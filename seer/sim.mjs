// Monte-Carlo simulation of the Seherwettstreit (Seer duel) using the REAL
// game model (game.js) and the REAL helper solver (solver.js).
//
// Compares:
//   - "helper"      : play the card the solver recommends each round
//   - "naive 0-8"   : play your cards 0,1,2,...,8 in order, no thinking
//   - "random"      : play a random remaining card each round (reference)
//
// Opponent model = the solver's own assumption: a uniformly random card order.
//
// Leader is fixed for the whole game. We run three regimes:
//   - you lead every round   (you commit blind)
//   - PC leads every round    (you see the opponent's colour, then respond)
//   - 50/50 mix               (leader chosen by a coin flip per game)
//
// Scoring: margin = (your wins) - (your losses) over the 9 rounds.
// Coins   = margin if you win overall (margin>0), else 0  ("coins = point diff").

import {
  createState, recordRound, resetState, color, resultOf,
} from "./game.js";
import { recommend, resetSolverCache } from "./solver.js";

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// --- deterministic PRNG (mulberry32) so runs are reproducible ---
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(0xC0FFEE);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- play one game, return margin ---
// strategy: (state, ctx, myRemainingArr) -> card to play
function playGame(leader, oppPerm, strategy) {
  const state = createState();
  // your remaining cards as an ordered array for the naive strategy
  const remaining = new Set(ALL);

  for (let round = 0; round < 9; round++) {
    const oppCard = oppPerm[round];
    const oppColor = color(oppCard);

    let ctx;
    if (leader === "opp") ctx = { leader: "opp", knownColor: oppColor };
    else ctx = { leader: "me" };

    const myRem = ALL.filter((v) => remaining.has(v));
    const myCard = strategy(state, ctx, myRem);

    remaining.delete(myCard);
    const result = resultOf(myCard, oppCard);
    recordRound(state, { leader, myCard, oppColor, result });
  }

  let me = 0, opp = 0;
  for (const r of state.rounds) {
    if (r.result === "higher") me++;
    else if (r.result === "lower") opp++;
  }
  return { margin: me - opp, wins: me };
}

// Coins actually paid (per Dominik's description of the event):
//   1 coin per point you score (= per round won), ALWAYS, plus
//   if you win the duel overall, a bonus equal to the point difference (margin);
//   equal or losing overall => 0 bonus.
function coinsFor(wins, margin) {
  return wins + (margin > 0 ? margin : 0);
}

// --- strategies ---
const helperStrat = (state, ctx, myRem) => {
  const rec = recommend(state, ctx);
  return rec ? rec.card : myRem[0];
};
const naiveStrat = (state, ctx, myRem) => myRem[0]; // myRem is sorted asc => 0,1,2,...
const randomStrat = (state, ctx, myRem) => myRem[Math.floor(rand() * myRem.length)];

// --- run a batch ---
function runBatch(label, leaderMode, n, strat) {
  // leaderMode: "me" | "opp" | "mix"
  let sumMargin = 0;
  let sumCoins = 0;
  let wins = 0, ties = 0, losses = 0;
  const dist = {}; // margin -> count
  for (let g = 0; g < n; g++) {
    const leader = leaderMode === "mix" ? (rand() < 0.5 ? "me" : "opp") : leaderMode;
    const oppPerm = shuffle(ALL);
    const { margin: m, wins: w } = playGame(leader, oppPerm, strat);
    sumMargin += m;
    sumCoins += coinsFor(w, m);
    if (m > 0) wins++; else if (m < 0) losses++; else ties++;
    dist[m] = (dist[m] || 0) + 1;
  }
  return {
    label, leaderMode, n,
    avgMargin: sumMargin / n,
    avgCoins: sumCoins / n,
    winRate: wins / n,
    tieRate: ties / n,
    lossRate: losses / n,
    dist,
  };
}

function fmt(x, d = 3) { return x.toFixed(d); }

function printRow(r) {
  console.log(
    `  ${r.label.padEnd(12)} | margin ${fmt(r.avgMargin).padStart(7)} | ` +
    `coins ${fmt(r.avgCoins).padStart(6)} | ` +
    `win ${(r.winRate * 100).toFixed(1).padStart(5)}%  ` +
    `tie ${(r.tieRate * 100).toFixed(1).padStart(5)}%  ` +
    `loss ${(r.lossRate * 100).toFixed(1).padStart(5)}%`
  );
}

const N = parseInt(process.argv[2] || "30000", 10);
console.log(`Seer simulation — ${N} games per cell, opponent = uniform-random order.`);
console.log(`(margin = wins-losses over 9 rounds; coins = 1 per round won + margin bonus when you win the duel)\n`);

const regimes = [
  ["YOU start (you commit blind every round)", "me"],
  ["PC starts (you see colour & respond)",     "opp"],
  ["50/50 mix (coin flip who starts)",          "mix"],
];

const strategies = [
  ["helper", helperStrat],
  ["naive 0-8", naiveStrat],
  ["random", randomStrat],
];

const summary = [];
for (const [title, mode] of regimes) {
  console.log(`### ${title}`);
  // reset RNG per regime so each strategy sees the SAME set of opponent decks
  // (paired comparison — fairer head-to-head).
  for (const [sname, sfn] of strategies) {
    rand = mulberry32(0xC0FFEE + mode.length); // same seed within regime
    resetSolverCache();
    const r = runBatch(sname, mode, N, sfn);
    printRow(r);
    summary.push({ regime: title, ...r });
  }
  console.log("");
}

// --- margin distribution for the helper in each regime ---
console.log("### Helper margin distribution (share of games at each margin)");
for (const [title, mode] of regimes) {
  const h = summary.find((s) => s.regime === title && s.label === "helper");
  const keys = Object.keys(h.dist).map(Number).sort((a, b) => a - b);
  const parts = keys.map((k) => `${k >= 0 ? "+" : ""}${k}:${(h.dist[k] / h.n * 100).toFixed(1)}%`);
  console.log(`  ${title}\n    ${parts.join("  ")}`);
}
console.log("");

// --- helper vs naive deltas ---
console.log("### Helper advantage (helper - naive 0-8)");
for (const [title, mode] of regimes) {
  const h = summary.find((s) => s.regime === title && s.label === "helper");
  const nv = summary.find((s) => s.regime === title && s.label === "naive 0-8");
  console.log(
    `  ${title}\n    +${fmt(h.avgMargin - nv.avgMargin)} margin/game, ` +
    `+${fmt(h.avgCoins - nv.avgCoins)} coins/game, ` +
    `win-rate ${(nv.winRate * 100).toFixed(1)}% -> ${(h.winRate * 100).toFixed(1)}%`
  );
}
