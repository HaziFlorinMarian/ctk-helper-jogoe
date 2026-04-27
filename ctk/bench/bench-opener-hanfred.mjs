// A/B: current opener [1,3,16,18] vs. Hanfred's "inner corners" [6,8,16,18]
// (one diagonal step in from each true corner). Paired self-play, same
// boards, same solver everywhere else.
//
// Usage: node ctk/bench/bench-opener-hanfred.mjs [games] [seed]

import {
  createState,
  recordReveal,
  catchCell,
  isGameOver,
  NEIGHBORS,
  BOARD_COUNTS,
} from "../game.js";
import { suggestMove } from "../solver.js";

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleWith(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
}
function randomBoard(rng) {
  const v = [];
  for (const k of Object.keys(BOARD_COUNTS)) for (let i = 0; i < BOARD_COUNTS[k]; i++) v.push(k);
  shuffleWith(v, rng);
  return v;
}
function generateBoards(n, seed) {
  const rng = mulberry32(seed);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = randomBoard(rng);
  return out;
}

function playOneGame(world, options) {
  const state = createState();
  let safety = 200;
  while (!isGameOver(state) && safety-- > 0) {
    const s = suggestMove(state, undefined, options);
    if (!s || s.cellIdx == null) break;
    const idx = s.cellIdx;
    const cell = state.cells[idx];
    if (cell.state === "hidden") {
      const v = world[idx];
      let flashed = false;
      for (const n of NEIGHBORS[idx]) if (world[n] === "5") { flashed = true; break; }
      recordReveal(state, idx, v, flashed);
    } else {
      if (!catchCell(state, idx)) break;
    }
  }
  return state.score;
}

function evaluate(options, boards) {
  let gold = 0, silver = 0, sum = 0;
  for (const b of boards) {
    const s = playOneGame(b, options);
    if (s >= 550) gold += 1;
    if (s >= 400) silver += 1;
    sum += s;
  }
  const n = boards.length;
  return { pGold: gold / n, pSilver: silver / n, mean: sum / n, n };
}

const PATTERNS = {
  current: [1, 3, 16, 18],
  hanfred: [6, 8, 16, 18],
};

function main() {
  const N = Number(process.argv[2] ?? 10000);
  const seed = Number(process.argv[3] ?? 0xC0FFEE);
  const boards = generateBoards(N, seed);
  console.log(`Opener A/B (current vs Hanfred) — n=${N}, seed=0x${seed.toString(16)}`);
  console.log(`current: [${PATTERNS.current.join(",")}]`);
  console.log(`hanfred: [${PATTERNS.hanfred.join(",")}]`);
  console.log("");

  const results = {};
  for (const [name, pattern] of Object.entries(PATTERNS)) {
    const t0 = Date.now();
    results[name] = evaluate({ openerPattern: pattern, forceFullOpener: true }, boards);
    const dt = ((Date.now() - t0) / 1000).toFixed(0);
    const r = results[name];
    const se = Math.sqrt(r.pGold * (1 - r.pGold) / N) * 100;
    console.log(`${name.padEnd(8)} pGold=${(r.pGold*100).toFixed(2)}% ±${se.toFixed(2)}  pSilver=${(r.pSilver*100).toFixed(2)}%  mean=${r.mean.toFixed(0)}  (${dt}s)`);
  }
  console.log("");
  const delta = (results.hanfred.pGold - results.current.pGold) * 100;
  const sePaired = Math.sqrt(
    (results.current.pGold * (1 - results.current.pGold) +
     results.hanfred.pGold * (1 - results.hanfred.pGold)) / N,
  ) * 100;
  const z = delta / sePaired;
  console.log(`Δ (hanfred - current): ${delta>=0?"+":""}${delta.toFixed(2)}pp gold  (z≈${z.toFixed(2)})`);
}
main();
