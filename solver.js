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

const CATCH_PENALTY = 500; // weight for getting caught by a 5 on the 5-turn
const INFO_WEIGHT = 0.9;    // per hidden 8-neighbor; rewards info-rich flips
const CENTER_TIEBREAK = 0.005; // tiny bias toward grid center to break residual ties
// Revealing the King early turns the K-turn into a guaranteed +100 click
// instead of a probability-weighted guess. Weight P(K|cell) to reflect that
// benefit — scaled high enough that K-hunting on a safe green can beat a
// same-value catch once meaningful 4s have already been scored.
const K_HUNT_WEIGHT = 120;
const FIVE_CARD_INDEX = HAND_SEQUENCE.indexOf("5");

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

function centerDistance(cellIdx) {
  const r = Math.floor(cellIdx / GRID_SIZE);
  const c = cellIdx % GRID_SIZE;
  const mid = (GRID_SIZE - 1) / 2;
  return Math.hypot(r - mid, c - mid);
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

// How many additional reveals would flipping `cellIdx` contribute toward any
// not-yet-completed bingo line? Returns the number of lines that would become
// complete on a single reveal of this cell.
function bingoLinesCompletedBy(state, cellIdx) {
  let count = 0;
  for (let i = 0; i < BINGO_LINES.length; i++) {
    if (state.completedBingos.has(i)) continue;
    const line = BINGO_LINES[i];
    if (!line.includes(cellIdx)) continue;
    const otherHidden = line.filter(
      (c) => c !== cellIdx && state.cells[c].state === "hidden",
    ).length;
    if (otherHidden === 0) count += 1;
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
function scoreCell(state, cellIdx, hand, pFive, distribution) {
  const dist = distribution.get(cellIdx);
  const bingoBonus = bingoLinesCompletedBy(state, cellIdx) * 10;

  if (hand === "K") {
    // Only value is catching the King.
    const pK = dist.K ?? 0;
    const centerBias = -centerDistance(cellIdx) * CENTER_TIEBREAK;
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
  const infoBonus = uncertainty * (1 + flashInfo * INFO_WEIGHT);
  const centerBias = -centerDistance(cellIdx) * CENTER_TIEBREAK;
  const pK = dist.K ?? 0;
  const p5 = dist[5] ?? 0;
  // Note: no penalty for revealing K early — the K-turn can still click the
  // K-card on a face-up K to score 100.
  const kPenalty = 0;
  // Bonus for flipping cells likely to BE the King. When hand is not K, the
  // reveal converts the K-turn from a probability-weighted guess into a
  // guaranteed +100. Green cells (safe-for-5, P(5)=0) typically have higher
  // P(K) than red candidates, so this nudges the solver toward K-hunting on
  // low-risk squares when expected points are close.
  const kHuntBonus = hand !== "K" ? pK * K_HUNT_WEIGHT : 0;

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
  // "typical next ev" with the remaining-card average. A coefficient of 1.0 is
  // still conservative vs. a full geometric sum, but high enough that chain-
  // heavy flips (e.g. hand=4 on a safe unsafe-for-5 cell) correctly beat a
  // same-value catch that ends the turn.
  const chainBonus = chainP * avgPts;

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
    score = ev - evLater + infoBonus + centerBias - kPenalty + kHuntBonus;
    detail = { ev, evLater, infoBonus, kPenalty, kHuntBonus, reserved: true };
  } else {
    score = ev + chainBonus + bingoBonus + infoBonus + centerBias - kPenalty + kHuntBonus;
    detail = { ev, chainP, chainBonus, bingoBonus, infoBonus, kPenalty, kHuntBonus };
    if (hand === "5") {
      const pCatch = probAnyNeighborIsFive(state, cellIdx, pFive);
      score -= pCatch * CATCH_PENALTY;
      detail.pCatch = pCatch;
    }
  }
  return { score, detail };
}

function describeReason(state, hand, cellIdx, detail) {
  if (detail.kind === "catch") {
    return `Catch the revealed ${detail.value} for +${detail.points} (ends turn)`;
  }
  if (hand === "K") {
    const bingoPart = detail.bingoBonus ? ` (+bingo ${detail.bingoBonus})` : "";
    if (detail.pK >= 0.999) return `King is here — catch for +100${bingoPart}`;
    return `P(King here) = ${(detail.pK * 100).toFixed(1)}%${bingoPart}`;
  }
  const parts = [];
  if (detail.reserved) {
    parts.push(`reserved for 5-turn (would lose ${(detail.evLater - detail.ev).toFixed(1)} pts)`);
    if (detail.infoBonus) parts.push(`info +${detail.infoBonus.toFixed(1)}`);
  } else {
    parts.push(`E[points] ≈ ${detail.ev.toFixed(1)}`);
    if (detail.chainP > 0) parts.push(`chain ${(detail.chainP * 100).toFixed(0)}%`);
    if (detail.infoBonus) parts.push(`info +${detail.infoBonus.toFixed(1)}`);
    if (detail.bingoBonus) parts.push(`+${detail.bingoBonus} bingo`);
    if (hand === "5" && detail.pCatch != null) {
      parts.push(`catch risk ${(detail.pCatch * 100).toFixed(0)}%`);
    }
  }
  if (detail.kHuntBonus && detail.kHuntBonus > 0.5) {
    parts.push(`K-hunt +${detail.kHuntBonus.toFixed(1)}`);
  }
  return parts.join(", ");
}

export function suggestMove(state) {
  const hand = currentCard(state);
  if (!hand) return null;

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
          reason: "Click your K card on this King cell for +100",
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
      reason: `Catch the revealed ${bestChainCatch.value} for +${pts} (chain)`,
    };
  }

  const hidden = hiddenCells(state);
  const pFive = fiveProbabilities(state);
  const distribution = cellValueDistribution(state);

  let bestCell = null;
  let bestScore = -Infinity;
  let bestDetail = null;
  for (const idx of hidden) {
    const { score, detail } = scoreCell(state, idx, hand, pFive, distribution);
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
