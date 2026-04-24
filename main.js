import { createState, recordReveal, catchCell, undo, isGameOver } from "./game.js";
import { suggestMove } from "./solver.js";
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
  remaining: document.getElementById("remaining"),
  suggestionNote: document.getElementById("suggestionNote"),
  resetBtn: document.getElementById("resetBtn"),
  undoBtn: document.getElementById("undoBtn"),
};

let state = createState();

renderBoard(boardEl);

function refresh() {
  const suggestion = isGameOver(state) ? null : suggestMove(state);
  updateBoard(boardEl, state, suggestion);
  updateSidebar(els, state, suggestion);
  els.undoBtn.disabled = state.history.length === 0;
}

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
    refresh();
  },
});

els.resetBtn.addEventListener("click", () => {
  state = createState();
  refresh();
});

els.undoBtn.addEventListener("click", () => {
  undo(state);
  refresh();
});

refresh();
