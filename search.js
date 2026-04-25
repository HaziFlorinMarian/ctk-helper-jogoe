// Late-game expectimax. From a given state, search the full game tree to
// game-over, returning the move with highest expected final score.
//
// Decision nodes (player choice): max over candidate moves.
// Chance nodes (flip outcome): expectation over the cell's value distribution.
// Catches are deterministic (the cell's value is already known).
//
// Approximations:
//   - Use the cell's MARGINAL value distribution at each step (joint flash↔value
//     correlations are dropped). For hand=5 we explicitly marginalise flash
//     (it determines whether the cell catches the 5-card); for other hands
//     flash only affects downstream deductions, so we record the flip with
//     flashed=false to keep the branching factor down.
//   - Outcomes with P < 0.01 are pruned.
//
// Trigger lives in solver.js — this module just exports the search.

import {
  NEIGHBORS,
  CELL_COUNT,
  VALUES,
  currentCard,
  isGameOver,
  recordReveal,
  catchCell,
  compareHandVsRevealed,
  cellValueDistribution,
  fiveProbabilities,
} from "./game.js";

const PROB_EPS = 0.01;

function cloneState(state) {
  const cells = new Array(CELL_COUNT);
  for (let i = 0; i < CELL_COUNT; i++) {
    const c = state.cells[i];
    cells[i] = {
      state: c.state, value: c.value, flashed: c.flashed, scored: c.scored,
    };
  }
  return {
    cells,
    remaining: { ...state.remaining },
    handIndex: state.handIndex,
    score: state.score,
    completedBingos: new Set(state.completedBingos),
    history: [],
  };
}

// Every legal move from `state`. We don't filter dominated catches here —
// expectimax handles dominance automatically by picking the best EV.
function generateMoves(state) {
  const hand = currentCard(state);
  if (!hand) return [];
  const moves = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    const c = state.cells[i];
    if (c.state === "revealed" && !c.scored) {
      const cmp = compareHandVsRevealed(hand, c.value);
      if (cmp !== "lose") moves.push({ type: "catch", idx: i });
    } else if (c.state === "hidden") {
      moves.push({ type: "flip", idx: i });
    }
  }
  return moves;
}

// P(any neighbour of cellIdx is a 5). Revealed-5 neighbour fixes it to 1;
// otherwise we treat hidden neighbours' P(5) as independent (a known
// approximation — the joint distribution would be tighter, but this is the
// same prior the heuristic uses).
function probFlash(state, cellIdx, pFive) {
  for (const n of NEIGHBORS[cellIdx]) {
    const nc = state.cells[n];
    if (nc.state === "revealed" && nc.value === "5") return 1;
  }
  let pNo = 1;
  for (const n of NEIGHBORS[cellIdx]) {
    const nc = state.cells[n];
    if (nc.state !== "hidden") continue;
    pNo *= 1 - (pFive.get(n) ?? 0);
  }
  return 1 - pNo;
}

// Expected final score under optimal play from `state`. `budget` is a
// shared node counter; when it's exhausted we bail out with state.score so
// the search degrades gracefully on pathological inputs instead of hanging.
function evalState(state, budget) {
  if (budget.nodes++ > budget.cap) return state.score;
  if (isGameOver(state)) return state.score;
  const hand = currentCard(state);
  if (!hand) return state.score;

  const moves = generateMoves(state);
  if (moves.length === 0) return state.score;

  const dist = cellValueDistribution(state);
  const pFive = hand === "5" ? fiveProbabilities(state) : null;

  let bestEv = -Infinity;
  for (const m of moves) {
    const ev = evalMove(state, m, dist, pFive, budget);
    if (ev > bestEv) bestEv = ev;
    if (budget.nodes > budget.cap) break;
  }
  return bestEv === -Infinity ? state.score : bestEv;
}

// Expected score after committing to move `m`.
function evalMove(state, m, dist, pFive, budget) {
  if (m.type === "catch") {
    const ns = cloneState(state);
    const r = catchCell(ns, m.idx);
    if (!r) return state.score; // refused — treat as no-op
    return evalState(ns, budget);
  }

  const cellDist = dist.get(m.idx);
  const hand = currentCard(state);
  let ev = 0;
  let totalP = 0;

  if (hand === "5") {
    const pF = probFlash(state, m.idx, pFive);
    for (const v of VALUES) {
      const p = cellDist[v] ?? 0;
      if (p < PROB_EPS) continue;
      totalP += p;
      if (pF > 0) {
        const ns = cloneState(state);
        recordReveal(ns, m.idx, v, true);
        ev += p * pF * evalState(ns, budget);
      }
      if (pF < 1) {
        const ns = cloneState(state);
        recordReveal(ns, m.idx, v, false);
        ev += p * (1 - pF) * evalState(ns, budget);
      }
    }
  } else {
    for (const v of VALUES) {
      const p = cellDist[v] ?? 0;
      if (p < PROB_EPS) continue;
      totalP += p;
      const ns = cloneState(state);
      recordReveal(ns, m.idx, v, false);
      ev += p * evalState(ns, budget);
    }
  }
  if (totalP < 0.999) ev += (1 - totalP) * state.score;
  return ev;
}

// Pick the move with highest expected final score. `maxNodes` bounds total
// state-evaluations; default 50k is fast enough for browser interactive use.
export function suggestMoveSearch(state, options = {}) {
  const hand = currentCard(state);
  if (!hand) return null;
  const moves = generateMoves(state);
  if (moves.length === 0) return null;

  const budget = { nodes: 0, cap: options.maxNodes ?? 50000 };
  const dist = cellValueDistribution(state);
  const pFive = hand === "5" ? fiveProbabilities(state) : null;

  let bestMove = null;
  let bestEv = -Infinity;
  for (const m of moves) {
    const ev = evalMove(state, m, dist, pFive, budget);
    if (ev > bestEv) {
      bestEv = ev;
      bestMove = m;
    }
    if (budget.nodes > budget.cap) break;
  }
  if (!bestMove) return null;
  return {
    cellIdx: bestMove.idx,
    score: bestEv,
    reason: `Expected final ${Math.round(bestEv)} (search · ${budget.nodes} nodes)`,
    searchExhausted: budget.nodes > budget.cap,
  };
}
