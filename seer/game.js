// Seer — Seherwettstreit / "Duel of the Seers" — game model, rules, belief.
//
// Rules (https://de-wiki.metin2.gameforge.com/index.php/Seherwettstreit):
//   - Both players hold cards 0..8, each value exactly once.
//   - Even numbers are BLACK, odd numbers are WHITE.
//   - 9 rounds. Each round both players pick a card simultaneously.
//   - You do NOT see which card the opponent picked. You only learn its COLOR
//     (parity) and whether your card was higher / equal / lower.
//   - A round where your card is higher = 1 point. If you win overall you also
//     get coins equal to the point difference, so margin (wins - losses) is the
//     real objective.
//
// This module is pure game state + the belief computation. No DOM, no solver.

export const N = 9;
export const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function color(v) { return v % 2 === 0 ? "black" : "white"; }

export const BLACKS = ALL.filter((v) => color(v) === "black"); // 0,2,4,6,8
export const WHITES = ALL.filter((v) => color(v) === "white"); // 1,3,5,7

// Result is always from YOUR perspective: your card vs the opponent's.
export function resultOf(myCard, oppCard) {
  if (myCard > oppCard) return "higher";
  if (myCard < oppCard) return "lower";
  return "equal";
}

// ---------- bitmask helpers ----------

export function fullMask() { return (1 << N) - 1; }
export function maskToArr(mask) {
  const a = [];
  for (let v = 0; v < N; v++) if (mask & (1 << v)) a.push(v);
  return a;
}
export function arrToMask(arr) { return arr.reduce((m, v) => m | (1 << v), 0); }

// ---------- state ----------

// A round record:
//   { leader: "me"|"opp",          who played first this round
//     myCard: 0..8,                 the card you played
//     oppColor: "black"|"white",    colour of the opponent's card
//     result: "higher"|"equal"|"lower" }  your card vs theirs
// `leader` is informational for the belief (deduction only needs colour+result+
// myCard) but drives the recommendation: when the opponent leads you already
// know its colour and respond, when you lead you commit blind.
export function createState() {
  return {
    rounds: [],
    history: [],  // JSON snapshots of `rounds` for undo
  };
}

export function myRemaining(state) {
  const used = new Set(state.rounds.map((r) => r.myCard));
  return ALL.filter((v) => !used.has(v));
}

// Who plays first is decided once and stays fixed for the whole game (whoever
// leads round 1 leads every round). Derive it from round 1; null until the first
// round is recorded, so it unlocks automatically if you undo back to the start.
export function fixedLeader(state) {
  return state.rounds.length ? state.rounds[0].leader : null;
}

export function scores(state) {
  let me = 0, opp = 0;
  for (const r of state.rounds) {
    if (r.result === "higher") me++;
    else if (r.result === "lower") opp++;
  }
  return { me, opp, margin: me - opp };
}

// Opponent's remaining card colors are always known exactly (the event UI shows
// the face-down cards grouped by colour), and they fall straight out of how many
// of each colour have already been played.
export function oppColorCounts(state) {
  let black = BLACKS.length, white = WHITES.length;
  for (const r of state.rounds) {
    if (r.oppColor === "black") black--; else white--;
  }
  return { black, white };
}

export function recordRound(state, { leader, myCard, oppColor, result }) {
  state.history.push(JSON.stringify(state.rounds));
  state.rounds.push({ leader, myCard, oppColor, result });
}

export function undo(state) {
  if (!state.history.length) return false;
  state.rounds = JSON.parse(state.history.pop());
  return true;
}

export function resetState(state) {
  state.rounds = [];
  state.history = [];
}

// ---------- belief over the opponent's hidden cards ----------
//
// The opponent's hand is {0..8} in some unknown order. Every round reveals the
// colour (parity) of the card they played and how it compared to YOUR card. We
// enumerate every assignment of distinct values to the played rounds that is
// consistent with those observations; each gives a "played set" and hence a
// "remaining set". We return the distinct remaining sets with integer weights
// (= number of consistent orderings producing them) — i.e. the exact posterior
// under a uniform-random opponent. Capped to stay cheap (constraints are tight,
// so the count is tiny in practice).

export function oppBelief(state, cap = 50000) {
  const cands = state.rounds.map((r) =>
    ALL.filter((v) => color(v) === r.oppColor && resultOf(r.myCard, v) === r.result)
  );

  const scenarios = new Map(); // remainingMask -> weight
  let used = 0;
  let count = 0;
  let overflow = false;

  (function bt(i) {
    if (overflow) return;
    if (i === cands.length) {
      const remMask = fullMask() & ~used;
      scenarios.set(remMask, (scenarios.get(remMask) || 0) + 1);
      if (++count > cap) overflow = true;
      return;
    }
    for (const v of cands[i]) {
      const bit = 1 << v;
      if (used & bit) continue;
      used |= bit;
      bt(i + 1);
      used &= ~bit;
    }
  })(0);

  const out = [];
  for (const [remainingMask, weight] of scenarios) out.push({ remainingMask, weight });
  return { scenarios: out, overflow };
}

// Union (could-be-remaining) and intersection (definitely-remaining) of the
// opponent's possible remaining values — for display.
export function oppRemainingInfo(state) {
  if (state.rounds.length === 0) return { possible: ALL.slice(), certain: ALL.slice() };
  const { scenarios } = oppBelief(state);
  let union = 0, inter = fullMask();
  for (const s of scenarios) { union |= s.remainingMask; inter &= s.remainingMask; }
  return { possible: maskToArr(union), certain: maskToArr(inter) };
}
