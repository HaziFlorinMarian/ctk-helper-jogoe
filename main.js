import { createState, recordReveal, catchCell, undo, isGameOver, isTrivialSweep } from "./game.js";
import { suggestMove as suggestMoveHeuristic } from "./solver.js";
import { suggestMovePIMC, CHEST_THRESHOLDS } from "./simulate.js";
import {
  renderBoard,
  updateBoard,
  updateSidebar,
  bindHover,
  bindKeyboard,
  bindClick,
} from "./ui.js";

const boardEl = document.getElementById("board");
const els = {
  currentCard: document.getElementById("currentCard"),
  turnHint: document.getElementById("turnHint"),
  score: document.getElementById("score"),
  scoreCeiling: document.getElementById("scoreCeiling"),
  remaining: document.getElementById("remaining"),
  suggestionNote: document.getElementById("suggestionNote"),
  resetBtn: document.getElementById("resetBtn"),
  undoBtn: document.getElementById("undoBtn"),
  solverMode: document.getElementById("solverMode"),
  solverToggleBtn: document.getElementById("solverToggleBtn"),
  sessionGames: document.getElementById("sessionGames"),
  sessionGold: document.getElementById("sessionGold"),
  sessionSilver: document.getElementById("sessionSilver"),
  sessionBronze: document.getElementById("sessionBronze"),
  sessionPctGold: document.getElementById("sessionPctGold"),
  sessionPctSilver: document.getElementById("sessionPctSilver"),
  sessionPctBronze: document.getElementById("sessionPctBronze"),
  sessionResetBtn: document.getElementById("sessionResetBtn"),
};

let state = createState();
// Heuristic is the active solver. The PIMC toggle is wired but hidden in the
// UI — strategy fusion in the full-info rollout made its suggestions worse
// than the heuristic. Keep the code around for future work.
let solverMode = "heuristic"; // "pimc" | "heuristic"
let lastGameOver = false;

// Session stats persist across reloads via localStorage so refreshing the
// page doesn't wipe out a streak.
const SESSION_KEY = "ctk-session-stats-v1";

function loadSessionStats() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { games: 0, gold: 0, silver: 0, bronze: 0, ...parsed };
    }
  } catch (e) { /* ignored — corrupt storage just resets */ }
  return { games: 0, gold: 0, silver: 0, bronze: 0 };
}

function saveSessionStats(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* quota or disabled */ }
}

function renderSessionStats() {
  const s = loadSessionStats();
  els.sessionGames.textContent = String(s.games);
  els.sessionGold.textContent = String(s.gold);
  els.sessionSilver.textContent = String(s.silver);
  els.sessionBronze.textContent = String(s.bronze);
  const pct = (n) => (s.games > 0 ? `(${Math.round((n / s.games) * 100)}%)` : "");
  els.sessionPctGold.textContent = pct(s.gold);
  els.sessionPctSilver.textContent = pct(s.silver);
  els.sessionPctBronze.textContent = pct(s.bronze);
}

function recordGameCompletion(score) {
  const s = loadSessionStats();
  s.games += 1;
  // Exclusive tiers — a gold finish doesn't also count as silver and bronze.
  // Sub-bronze finishes just bump `games` without landing in any tier.
  if (score >= CHEST_THRESHOLDS.gold) s.gold += 1;
  else if (score >= CHEST_THRESHOLDS.silver) s.silver += 1;
  else if (score >= CHEST_THRESHOLDS.bronze) s.bronze += 1;
  saveSessionStats(s);
  renderSessionStats();
}

function trackGameCompletion() {
  const now = isGameOver(state);
  if (!lastGameOver && now) recordGameCompletion(state.score);
  lastGameOver = now;
}

function computeSuggestion() {
  if (isGameOver(state)) return null;
  return solverMode === "pimc" ? suggestMovePIMC(state) : suggestMoveHeuristic(state);
}

function refresh() {
  const suggestion = computeSuggestion();
  updateBoard(boardEl, state, suggestion);
  updateSidebar(els, state, suggestion);
  els.undoBtn.disabled = state.history.length === 0;
  els.solverMode.textContent = solverMode === "pimc" ? "PIMC" : "Heuristic";
  trackGameCompletion();
}

renderBoard(boardEl);
renderSessionStats();

const hover = bindHover(boardEl, () => {});

bindClick(boardEl, {
  onCellClick(idx) {
    if (isGameOver(state)) return;
    const cell = state.cells[idx];
    if (cell.state === "revealed" && !cell.scored) {
      catchCell(state, idx);
      refresh();
    }
  },
});

bindKeyboard({
  onReveal(value, flashed) {
    if (isGameOver(state)) return;
    const idx = hover.getHovered();
    if (idx == null) return;
    if (state.cells[idx].state !== "hidden") return;
    recordReveal(state, idx, value, flashed);
    refresh();
  },
  onUndo() {
    undo(state);
    refresh();
  },
  onReset() {
    state = createState();
    lastGameOver = false;
    refresh();
  },
});

els.resetBtn.addEventListener("click", () => {
  state = createState();
  lastGameOver = false;
  refresh();
});

els.undoBtn.addEventListener("click", () => {
  undo(state);
  refresh();
});

els.solverToggleBtn.addEventListener("click", () => {
  solverMode = solverMode === "pimc" ? "heuristic" : "pimc";
  refresh();
});

els.sessionResetBtn.addEventListener("click", () => {
  saveSessionStats({ games: 0, gold: 0, silver: 0, bronze: 0 });
  renderSessionStats();
});

refresh();
