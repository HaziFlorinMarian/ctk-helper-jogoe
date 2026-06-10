// Seer solver.
//
// Objective: maximise expected MARGIN (your wins - your losses), which is what
// the event pays out in coins (and tracks the point ranking too).
//
// Opponent model (v1): plays a uniformly random card order. The deduction in
// game.js (oppBelief) narrows the opponent's possible remaining cards from the
// colours + results you've entered; the solver then optimises against a uniform
// draw over each consistent remaining set.
//
// Two things are modelled exactly for the CURRENT round, because that's the
// decision the user acts on:
//   - opponent leads  -> you already see the colour, so you respond to a card
//     drawn uniformly from the opponent's remaining cards OF THAT COLOUR.
//   - you lead        -> you commit blind, opponent's card is uniform over all
//     its remaining cards.
// The tail value (rounds after this one) uses a memoised DP that assumes you
// commit each round vs a uniform-random opponent. That slightly UNDER-values
// future "opponent leads, you respond" rounds (where you'd have extra info), so
// real results should be at least as good as the numbers shown.

import { maskToArr, fullMask, color, myRemaining, oppBelief } from "./game.js";

// One matchup, your perspective: +1 win, -1 loss, 0 tie.
function payoff(x, o) { return x > o ? 1 : x < o ? -1 : 0; }

// ---------- tail DP ----------
// value(myMask, oppMask) = expected margin-to-go with both sides holding those
// cards, you playing optimally (commit), opponent uniform-random. Memoised.
const memo = new Map();
function dpKey(m, o) { return m * 512 + o; }

export function dpValue(myMask, oppMask) {
  if (myMask === 0) return 0;
  const k = dpKey(myMask, oppMask);
  const cached = memo.get(k);
  if (cached !== undefined) return cached;

  const myCards = maskToArr(myMask);
  const oppCards = maskToArr(oppMask);
  const invO = 1 / oppCards.length;

  let best = -Infinity;
  for (const x of myCards) {
    const mRest = myMask & ~(1 << x);
    let ev = 0;
    for (const o of oppCards) {
      ev += invO * (payoff(x, o) + dpValue(mRest, oppMask & ~(1 << o)));
    }
    if (ev > best) best = ev;
  }
  memo.set(k, best);
  return best;
}

// ---------- recommendation ----------
//
// ctx:
//   { leader: "me" }                     you lead this round (commit blind)
//   { leader: "opp", knownColor: "black"|"white" }  opponent led, colour shown
//
// Returns { card, ev, evByCard: Map, overflow, leader, knownColor } or null.
export function recommend(state, ctx) {
  const myCards = myRemaining(state);
  if (myCards.length === 0) return null;

  const { scenarios, overflow } = oppBelief(state);
  let belief = scenarios.length ? scenarios : [{ remainingMask: fullMask(), weight: 1 }];
  let totalW = 0;
  for (const s of belief) totalW += s.weight;

  const myMask = myCards.reduce((m, v) => m | (1 << v), 0);
  const respond = ctx && ctx.leader === "opp" && (ctx.knownColor === "black" || ctx.knownColor === "white");

  const evByCard = new Map();
  for (const x of myCards) {
    const mRest = myMask & ~(1 << x);
    let ev = 0;
    let w = 0;
    for (const s of belief) {
      // The opponent's current card is uniform over its remaining set, optionally
      // restricted to the revealed colour when it led this round.
      let oppNow = maskToArr(s.remainingMask);
      if (respond) oppNow = oppNow.filter((o) => color(o) === ctx.knownColor);
      if (oppNow.length === 0) continue; // scenario inconsistent with the shown colour
      const invO = 1 / oppNow.length;
      let scen = 0;
      for (const o of oppNow) {
        scen += invO * (payoff(x, o) + dpValue(mRest, s.remainingMask & ~(1 << o)));
      }
      ev += s.weight * scen;
      w += s.weight;
    }
    evByCard.set(x, w > 0 ? ev / w : -Infinity);
  }

  // Highest EV; tie-break toward the LOWER card (keep your strong cards for later).
  let bestCard = null, bestEv = -Infinity;
  for (const x of [...evByCard.keys()].sort((a, b) => a - b)) {
    const ev = evByCard.get(x);
    if (ev > bestEv + 1e-9) { bestEv = ev; bestCard = x; }
  }

  return {
    card: bestCard,
    ev: bestEv,
    evByCard,
    overflow,
    leader: ctx ? ctx.leader : "me",
    knownColor: respond ? ctx.knownColor : null,
  };
}

export function resetSolverCache() { memo.clear(); }
