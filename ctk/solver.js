// Best-move suggester. Greedy one-step expected value with hand-aware scoring.
//
// Goal: help the player reach at least 550 points. We rank each hidden cell by
// expected points from flipping it with the current hand card, with a heavy
// safety penalty during the 5-turn, and we prefer cells that complete a bingo
// line or continue a scoring chain.

import {
  NEIGHBORS,
  BINGO_LINES,
  VALUES,
  GRID_SIZE,
  HAND_SEQUENCE,
  cellValueDistribution,
  fiveProbabilities,
  hiddenCells,
  currentCard,
  pointsFor,
  compareHandVsRevealed,
  deriveConstraints,
  isSafeFor5Turn,
} from "./game.js";
import { t } from "./i18n.js";
import { suggestMoveSearch } from "./search.js";

// Late-game expectimax. Triggers when the state is small enough for the
// search to terminate within budget — past hand=5 with too many hidden cells
// branching explodes. Empirically ≤ 6 hidden cells stays under ~50k nodes
// with useful resolution; expanding to hand=4 was tried but fails because
// budget-exhausted leaves return state.score (no future estimate), so the
// search picks worse moves than the heuristic. The fix would be a heuristic
// leaf evaluator — left for future work.
const SEARCH_TRIGGER_HAND_INDEX = 10;
const SEARCH_MAX_HIDDEN = 6;
const SEARCH_NODE_BUDGET = 50000;

const SCORE_TARGET = 550;
const FIVE_CARD_INDEX = HAND_SEQUENCE.indexOf("5");

// Hardcoded opening: a dominating-set pattern that covers the whole 5×5 board
// with 4 reveals (every cell either revealed or a neighbour of a revealed
// cell). Beats greedy info-flip by ~+1.7pp gold per tune-opening.mjs. The
// gain comes from a multi-turn property — saving the centre for later — that
// a one-step heuristic can't see.
const OPENING_PATTERN = [1, 3, 16, 18];

// All tunable weights in one place so offline search (tune.mjs) can sweep
// them. suggestMove() accepts an optional weights argument and falls back to
// these defaults, so the in-browser app never notices the refactor.
//
// Current values were produced by tune.mjs: n=3000 paired self-play games
// lifted pGold from 31.6% to 40.1% vs. a hand-tuned starting point.
// Chain-greed (chainBonusMul) and info-seeking (infoWeight) were the biggest
// wins — both came in well below the game's optimum.
export const DEFAULT_WEIGHTS = {
  catchPenalty: 612,      // hand=5 catch-risk aversion (× P(any 5 adjacent))
  infoWeight: 2.89,       // scales flash-info contribution per hidden neighbour
  centerTiebreak: 0.037,  // microscopic bias toward the grid centre
  chainBonusMul: 1.94,    // multiplier on the chain-continuation expected value
  kHuntBase: 150,         // K-hunt weight when score already near target
  kHuntSlope: 2.46,       // extra K-hunt weight per point of gap to 550
  kHuntMax: 727,          // ceiling so K-hunt can't wholly crowd out EV
  spreadWeight: 0,        // bonus per neighbour not yet adjacent to a reveal
};

// The K-turn's +100 is often the difference between the silver (400) and gold
// (550) chest. When the current score is far below 550, revealing K early —
// which converts the K-turn from a probability-weighted guess into a
// deterministic +100 — is the highest-leverage move available. Scale the
// K-hunt bonus by the score gap so it automatically goes up when we need it.
function kHuntWeight(state, w) {
  const gap = Math.max(0, SCORE_TARGET - state.score);
  return Math.min(w.kHuntMax, w.kHuntBase + gap * w.kHuntSlope);
}

// "Informative" neighbors — neighbors whose 5-status the flash signal can
// still distinguish. The flash is predetermined if any adjacent cell is a
// confirmed 5 (revealed OR deduced P(5)=1): it will always fire, giving no
// new information. Otherwise, count hidden neighbors that still have a
// nonzero probability of being a 5 — each contributes to the flash signal's
// uncertainty.
function informativeNeighborCount(state, cellIdx, pFive) {
  for (const n of NEIGHBORS[cellIdx]) {
    const nc = state.cells[n];
    if (nc.state === "revealed" && nc.value === "5") return 0;
    if (nc.state === "hidden" && (pFive.get(n) ?? 0) >= 0.999) return 0;
  }
  let count = 0;
  for (const n of NEIGHBORS[cellIdx]) {
    const nc = state.cells[n];
    if (nc.state === "hidden" && (pFive.get(n) ?? 0) > 0.001) count += 1;
  }
  return count;
}

// Has every hidden cell that could still be a 5 already been "seen" by a
// flash from some revealed neighbour? If yes, the opener has nothing left
// to learn about 5-locations even if not all of its moves were played —
// e.g. when constraint propagation pins all candidates to one side of the
// board after just two reveals. Deduced-certain 5s (P=1) are also covered:
// their flash status is fully determined.
function fivesFullyInformed(state) {
  if (state.remaining[5] === 0) return true;
  const pFive = fiveProbabilities(state);
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i].state !== "hidden") continue;
    const p = pFive.get(i) ?? 0;
    if (p <= 0 || p >= 0.999) continue;
    let seen = false;
    for (const n of NEIGHBORS[i]) {
      if (state.cells[n].state === "revealed") { seen = true; break; }
    }
    if (!seen) return false;
  }
  return true;
}

function centerDistance(cellIdx) {
  const r = Math.floor(cellIdx / GRID_SIZE);
  const c = cellIdx % GRID_SIZE;
  const mid = (GRID_SIZE - 1) / 2;
  return Math.hypot(r - mid, c - mid);
}

// Count of `cellIdx`'s hidden neighbours that aren't already adjacent to some
// other revealed cell. Higher number = flipping this cell pulls more "fresh"
// area into the helper's adjacency view. Encodes a board-coverage prior so
// the heuristic spreads its reveals instead of clustering them.
function spreadCount(state, cellIdx) {
  let count = 0;
  for (const n of NEIGHBORS[cellIdx]) {
    const nc = state.cells[n];
    if (nc.state === "revealed") continue;
    let alreadyAdjacent = false;
    for (const nn of NEIGHBORS[n]) {
      if (nn === cellIdx) continue;
      if (state.cells[nn].state === "revealed") { alreadyAdjacent = true; break; }
    }
    if (!alreadyAdjacent) count += 1;
  }
  return count;
}

// Uncertainty of a cell's value as a ratio in [0, 1]. A must-be-5 or must-be-X
// cell returns 0 (no information to learn). A uniform distribution returns 1.
function valueUncertainty(dist) {
  const maxH = Math.log2(VALUES.length);
  let h = 0;
  for (const v of VALUES) {
    const p = dist[v] ?? 0;
    if (p > 0) h -= p * Math.log2(p);
  }
  return h / maxH;
}

function fiveAhead(state) {
  return state.handIndex < FIVE_CARD_INDEX;
}

// Expected points from flipping this cell *with a 5 in hand*, assuming the
// cell is safe (no catch risk). K reveal still ends the turn with 0 points.
function expectedPointsIfFiveTurn(dist) {
  let ev = 0;
  for (const v of VALUES) {
    if (v === "K") continue;
    ev += (dist[v] ?? 0) * pointsFor(v);
  }
  return ev;
}

// Probability that at least one face-down 8-neighbor of `cellIdx` is a 5,
// conditioned on the cell itself having a specified value (approximate: we
// treat the neighbor 5-probabilities as independent, which is a reasonable
// first-order approximation).
function probAnyNeighborIsFive(state, cellIdx, pFive) {
  // Any adjacent revealed 5 guarantees a catch.
  for (const n of NEIGHBORS[cellIdx]) {
    const nc = state.cells[n];
    if (nc.state === "revealed" && nc.value === "5") return 1;
  }
  const neighbors = NEIGHBORS[cellIdx].filter(
    (n) => state.cells[n].state === "hidden" && n !== cellIdx,
  );
  let pNone = 1;
  for (const n of neighbors) {
    const p = pFive.get(n) ?? 0;
    pNone *= 1 - p;
  }
  return 1 - pNone;
}

// How many bingo lines would flipping `cellIdx` (and getting it scored)
// complete? Bingo now requires every cell in the line to be revealed AND
// scored, so count only lines where every OTHER cell already satisfies that.
function bingoLinesCompletedBy(state, cellIdx) {
  let count = 0;
  for (let i = 0; i < BINGO_LINES.length; i++) {
    if (state.completedBingos.has(i)) continue;
    const line = BINGO_LINES[i];
    if (!line.includes(cellIdx)) continue;
    const othersDone = line.every((c) => {
      if (c === cellIdx) return true;
      const cell = state.cells[c];
      return cell.state === "revealed" && cell.scored;
    });
    if (othersDone) count += 1;
  }
  return count;
}

// Expected immediate value (points for this flip) of flipping `cellIdx`.
// Does NOT lookahead into chain continuation value — chain potential is added
// separately as a small heuristic bonus.
function expectedImmediatePoints(hand, distribution) {
  let ev = 0;
  for (const v of VALUES) {
    const p = distribution[v] ?? 0;
    if (p === 0) continue;
    const cmp = compareHandVsRevealed(hand, v);
    if (cmp === "score" || cmp === "chain") ev += p * pointsFor(v);
  }
  return ev;
}

// Probability that the turn CONTINUES after flipping this cell with `hand`.
function probChainContinues(hand, distribution) {
  let p = 0;
  for (const v of VALUES) {
    const cmp = compareHandVsRevealed(hand, v);
    if (cmp === "chain") p += distribution[v] ?? 0;
  }
  return p;
}

// Score a candidate flip for the current hand.
function scoreCell(state, cellIdx, hand, pFive, distribution, w) {
  const dist = distribution.get(cellIdx);
  const bingoBonus = bingoLinesCompletedBy(state, cellIdx) * 10;

  if (hand === "K") {
    // Only value is catching the King.
    const pK = dist.K ?? 0;
    const centerBias = -centerDistance(cellIdx) * w.centerTiebreak;
    return {
      score: pK * 100 + bingoBonus + centerBias,
      detail: { pK, bingoBonus },
    };
  }

  const ev = expectedImmediatePoints(hand, dist);
  const chainP = probChainContinues(hand, dist);
  const uncertainty = valueUncertainty(dist);
  // Base value-info (knowing this cell's own value) + flash-info (resolving
  // neighbor 5-candidacy, conditional on the flash being unknown a priori).
  const flashInfo = informativeNeighborCount(state, cellIdx, pFive);
  const infoBonus = uncertainty * (1 + flashInfo * w.infoWeight);
  const centerBias = -centerDistance(cellIdx) * w.centerTiebreak;
  const spreadBonus = w.spreadWeight ? spreadCount(state, cellIdx) * w.spreadWeight : 0;
  const pK = dist.K ?? 0;
  const p5 = dist[5] ?? 0;
  // Note: no penalty for revealing K early — the K-turn can still click the
  // K-card on a face-up K to score 100.
  const kPenalty = 0;
  // Bonus for flipping cells likely to BE the King. When hand is not K, the
  // reveal converts the K-turn from a probability-weighted guess into a
  // guaranteed +100. Weight scales with distance to the 550 target so it
  // dominates decisions when we actually need K to reach gold.
  const kHuntBonus = hand !== "K" ? pK * kHuntWeight(state, w) : 0;

  const remaining = state.remaining;
  const totalRemaining =
    remaining[1] + remaining[2] + remaining[3] + remaining[4] + remaining[5] + remaining.K;
  const avgPts = totalRemaining
    ? (remaining[1] * 10 +
        remaining[2] * 20 +
        remaining[3] * 30 +
        remaining[4] * 40 +
        remaining[5] * 50 +
        remaining.K * 100) /
      totalRemaining
    : 0;
  // Chain expectation: when the current flip chains (hand > revealed), the
  // player gets to flip again. The expected total from continuation is
  // ~chainP/(1-chainP) * ev of the typical next flip — we approximate that
  // "typical next ev" with the remaining-card average, scaled by
  // chainBonusMul. A multiplier of 1.0 is still conservative vs. a full
  // geometric sum, but high enough that chain-heavy flips (e.g. hand=4 on a
  // safe unsafe-for-5 cell) correctly beat a same-value catch that ends
  // the turn.
  const chainBonus = chainP * avgPts * w.chainBonusMul;

  // A cell will almost certainly be captured during the 5-turn if it's either
  // already safe-for-5 (no catch risk) or a deduced 5 (player can flip it once
  // its neighbors are cleared). In those cases, the bingo bonus and most of
  // the point value are ALREADY priced into the 5-turn — don't double-credit
  // by rewarding an early flip for them.
  const reservedFor5Turn =
    hand !== "5" && fiveAhead(state) && (p5 >= 0.999 || isSafeFor5Turn(state, cellIdx, null, pFive));

  let score;
  let detail;
  if (reservedFor5Turn) {
    const evLater = p5 >= 0.999 ? 50 : expectedPointsIfFiveTurn(dist);
    // Net value of flipping now vs. letting the 5-turn handle it. Bingo and
    // chain roughly cancel because both turns get them. Info is lost if we
    // wait, so it stays on the "now" side. K-hunt bonus applies equally: the
    // 5-turn might not reach this cell before the K-turn begins, so revealing
    // K now is still a net gain.
    score = ev - evLater + infoBonus + spreadBonus + centerBias - kPenalty + kHuntBonus;
    detail = { ev, evLater, infoBonus, spreadBonus, kPenalty, kHuntBonus, reserved: true };
  } else {
    score = ev + chainBonus + bingoBonus + infoBonus + spreadBonus + centerBias - kPenalty + kHuntBonus;
    detail = { ev, chainP, chainBonus, bingoBonus, infoBonus, spreadBonus, kPenalty, kHuntBonus };
    if (hand === "5") {
      const pCatch = probAnyNeighborIsFive(state, cellIdx, pFive);
      score -= pCatch * w.catchPenalty;
      detail.pCatch = pCatch;
    }
  }
  return { score, detail };
}

function describeReason(state, hand, cellIdx, detail) {
  if (detail.kind === "catch") {
    return t("catchSameValueReason", { value: detail.value, points: detail.points });
  }
  if (hand === "K") {
    if (detail.pK >= 0.999) return t("kingHereReason", { bingoBonus: detail.bingoBonus });
    return t("pKingReason", { pct: (detail.pK * 100).toFixed(1), bingoBonus: detail.bingoBonus });
  }
  const parts = [];
  if (detail.reserved) {
    parts.push(t("reservedReason", { lost: (detail.evLater - detail.ev).toFixed(1) }));
    if (detail.infoBonus) parts.push(t("infoReason", { bonus: detail.infoBonus.toFixed(1) }));
  } else {
    parts.push(t("evReason", { ev: detail.ev.toFixed(1) }));
    if (detail.chainP > 0) parts.push(t("chainReason", { pct: (detail.chainP * 100).toFixed(0) }));
    if (detail.infoBonus) parts.push(t("infoReason", { bonus: detail.infoBonus.toFixed(1) }));
    if (detail.bingoBonus) parts.push(t("bingoReason", { bonus: detail.bingoBonus }));
    if (hand === "5" && detail.pCatch != null) {
      parts.push(t("catchRiskReason", { pct: (detail.pCatch * 100).toFixed(0) }));
    }
  }
  if (detail.kHuntBonus && detail.kHuntBonus > 0.5) {
    parts.push(t("kHuntReason", { bonus: detail.kHuntBonus.toFixed(1) }));
  }
  return parts.join(", ");
}

export function suggestMove(state, weights = DEFAULT_WEIGHTS, options = {}) {
  const hand = currentCard(state);
  if (!hand) return null;

  // Hardcoded opener — only on hand=1 turns. Skips already-revealed cells so
  // mid-game undo / manual reveals don't cause infinite suggestions.
  // Early-exit when every hidden cell that could still be a 5 is already
  // adjacent to a revealed cell: the existing flash signals already cover
  // all possible 5 locations, so further opener flips can't refine the
  // 5-map. Hand off to the heuristic, which can pick a more EV-rich flip.
  // `options.forceFullOpener` is an offline benchmarking knob to disable
  // that early-exit and measure its contribution.
  const openerEarlyExit = !options.forceFullOpener && fivesFullyInformed(state);
  // If the user has revealed any cell that ISN'T part of the opener, they've
  // already deviated — drop the opener entirely and let the heuristic pick.
  // The pattern only pays off as a coordinated multi-flip; finishing the
  // remaining opener cells out of context loses the property that makes it
  // good. Recomputed each call so undo restores opener mode automatically.
  const openerDeviated = state.cells.some(
    (c, i) => c.state === "revealed" && !OPENING_PATTERN.includes(i),
  );
  if (
    hand === "1" &&
    state.handIndex < OPENING_PATTERN.length &&
    !openerEarlyExit &&
    !openerDeviated
  ) {
    for (const idx of OPENING_PATTERN) {
      if (state.cells[idx].state === "hidden") {
        return {
          cellIdx: idx,
          score: 0,
          reason: t("openingReason"),
        };
      }
    }
  }

  // Late game: hand off to expectimax. The search budget bounds branching
  // so we degrade gracefully on dense states; if it bails out (exhausted)
  // we fall back to the heuristic for this decision.
  if (state.handIndex >= SEARCH_TRIGGER_HAND_INDEX) {
    let hiddenCount = 0;
    for (let i = 0; i < state.cells.length; i++) {
      if (state.cells[i].state === "hidden") hiddenCount += 1;
    }
    if (hiddenCount <= SEARCH_MAX_HIDDEN) {
      const r = suggestMoveSearch(state, { maxNodes: SEARCH_NODE_BUDGET });
      if (r && !r.searchExhausted) return r;
    }
  }

  // On the K-turn, clicking the K-card on the King (face-down OR already
  // face-up) catches it for +100. If the K is already revealed, point the
  // player directly at that cell instead of making them guess face-downs.
  if (hand === "K" && state.remaining.K === 0) {
    for (let i = 0; i < state.cells.length; i++) {
      const c = state.cells[i];
      if (c.state === "revealed" && c.value === "K" && !c.scored) {
        return {
          cellIdx: i,
          score: 100,
          reason: t("clickKKingReason"),
        };
      }
    }
  }

  // Pre-compute these once — used by both the catch-safety check below and
  // the face-down scoring loop further down.
  const pFiveForCatch = hand === "5" ? fiveProbabilities(state) : null;

  // Chain catches: revealed-but-unscored cells with value strictly below the
  // current hand are free points that keep the turn alive. Always do these
  // before any face-down flip — they're guaranteed score. For hand=5 we
  // additionally require the cell to be safe-for-5: any adjacent 5 (revealed
  // or still-hidden must-be-5) triggers the catch mechanic and would wipe the
  // attempt.
  let bestChainCatch = null;
  for (let i = 0; i < state.cells.length; i++) {
    const cell = state.cells[i];
    if (cell.state !== "revealed" || cell.scored) continue;
    const cmp = compareHandVsRevealed(hand, cell.value);
    if (cmp !== "chain") continue;
    if (hand === "5" && !isSafeFor5Turn(state, i, null, pFiveForCatch)) continue;
    if (!bestChainCatch || pointsFor(cell.value) > pointsFor(bestChainCatch.value)) {
      bestChainCatch = { cellIdx: i, value: cell.value };
    }
  }
  if (bestChainCatch) {
    const pts = pointsFor(bestChainCatch.value);
    return {
      cellIdx: bestChainCatch.cellIdx,
      score: pts,
      reason: t("catchChainReason", { value: bestChainCatch.value, points: pts }),
    };
  }

  const hidden = hiddenCells(state);
  const pFive = fiveProbabilities(state);
  const distribution = cellValueDistribution(state);

  let bestCell = null;
  let bestScore = -Infinity;
  let bestDetail = null;
  for (const idx of hidden) {
    const { score, detail } = scoreCell(state, idx, hand, pFive, distribution, weights);
    if (score > bestScore) {
      bestScore = score;
      bestCell = idx;
      bestDetail = detail;
    }
  }

  // Same-value catches: revealed-unscored cells whose value equals the current
  // hand card. They guarantee points but end the turn. Only worthwhile when no
  // HIGHER hand card can later chain-catch the same cell (since a chain catch
  // keeps the turn alive while banking the same points).
  //   hand=2 catching a 2: skip — hand=3 chain-catches it freely.
  //   hand=3 catching a 3: skip — hand=4 chain-catches it freely.
  //   hand=4 catching a 4: only if the cell is UNSAFE for the 5-turn
  //                         (hand=5 wouldn't be able to chain-catch safely).
  //   hand=5 catching a 5: yes, if the cell is safe-for-5 (otherwise caught).
  //   hand=K catching a K: always — it's the game's endpoint.
  for (let i = 0; i < state.cells.length; i++) {
    const cell = state.cells[i];
    if (cell.state !== "revealed" || cell.scored) continue;
    const cmp = compareHandVsRevealed(hand, cell.value);
    if (cmp !== "score") continue;
    if (hand === "5" && !isSafeFor5Turn(state, i, null, pFive)) continue;
    const basePts = pointsFor(cell.value);
    let futureChainAvailable = false;
    if (hand === "2" || hand === "3") {
      futureChainAvailable = true;
    } else if (hand === "4" && isSafeFor5Turn(state, i, null, pFive)) {
      futureChainAvailable = true;
    }
    const score = futureChainAvailable ? 0 : basePts;
    if (score > bestScore) {
      bestScore = score;
      bestCell = i;
      bestDetail = { kind: "catch", value: cell.value, points: basePts, futureChainAvailable };
    }
  }

  if (bestCell == null) return null;

  return {
    cellIdx: bestCell,
    score: bestScore,
    reason: describeReason(state, hand, bestCell, bestDetail),
    pFive,
    distribution,
  };
}
