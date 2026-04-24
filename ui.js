// DOM rendering and input handling. Keeps the game/solver state isolated.

import {
  CELL_COUNT,
  BOARD_COUNTS,
  VALUES,
  currentCard,
  isGameOver,
  deriveConstraints,
  fiveProbabilities,
  hiddenCells,
  isSafeFor5Turn,
} from "./game.js";

// event.code is layout-independent and unaffected by Shift, so Shift+1 still
// reports "Digit1". event.key flips to "!" / "@" / etc. under Shift and varies
// by keyboard layout — don't rely on it for digit input.
const CODE_TO_VALUE = {
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "K",
  Numpad1: "1",
  Numpad2: "2",
  Numpad3: "3",
  Numpad4: "4",
  Numpad5: "5",
  Numpad6: "K",
  KeyK: "K",
};

export function renderBoard(boardEl) {
  boardEl.innerHTML = "";
  for (let i = 0; i < CELL_COUNT; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.idx = String(i);
    cell.tabIndex = -1;
    boardEl.appendChild(cell);
  }
}

export function updateBoard(boardEl, state, suggestion) {
  const { mustNotBe5, constraints } = deriveConstraints(state);
  const pFive = fiveProbabilities(state);
  const constrainedCells = new Set();
  for (const cons of constraints) for (const c of cons) constrainedCells.add(c);

  for (let i = 0; i < CELL_COUNT; i++) {
    const el = boardEl.children[i];
    const cell = state.cells[i];
    el.className = "cell";
    el.removeAttribute("data-value");
    el.textContent = "";

    if (cell.state === "revealed") {
      el.classList.add("revealed");
      el.dataset.value = cell.value;
      el.textContent = cell.value;
      if (cell.flashed) el.classList.add("flashed");
      if (!cell.scored) el.classList.add("unscored");
      continue;
    }

    const p = pFive.get(i) ?? 0;
    const mustBeFive = p >= 0.999;
    const ruledOut = p < 0.001 && !mustBeFive;
    const safeToFlip = isSafeFor5Turn(state, i, null, pFive);

    if (mustBeFive) {
      // Render exactly like a revealed 5 so the user can treat it the same way
      // when deciding where to click. The `must5` class keeps a subtle "deduced
      // not actually revealed" distinction.
      el.classList.add("must5");
      el.dataset.value = "5";
      el.textContent = "5";
    } else if (constrainedCells.has(i) && !ruledOut) {
      // Cell is an adjacency candidate for a flash AND enumeration hasn't ruled
      // it out — i.e. the 5 really could be here.
      el.classList.add("possible5");
    } else if (ruledOut || mustNotBe5.has(i)) {
      // Either explicitly mustNotBe5 (from a no-flash reveal) or ruled out via
      // constraint enumeration (every consistent 5-placement avoids this cell).
      el.classList.add("safe5");
    }

    // Independent visual: safe to click with a 5-card (no adjacent face-down 5).
    if (safeToFlip) el.classList.add("safe-flip");

    if (p > 0 && !mustBeFive) {
      const probLabel = document.createElement("span");
      probLabel.className = "prob";
      probLabel.textContent = Math.round(p * 100) + "%";
      el.appendChild(probLabel);
    }
  }

  if (suggestion && suggestion.cellIdx != null) {
    const el = boardEl.children[suggestion.cellIdx];
    if (el) el.classList.add("suggested");
  }
}

export function updateSidebar(els, state, suggestion) {
  const hand = currentCard(state);

  if (hand) {
    els.currentCard.textContent = hand;
    els.currentCard.classList.remove("done");
  } else {
    els.currentCard.textContent = "—";
    els.currentCard.classList.add("done");
  }

  els.turnHint.textContent = hintForTurn(state, hand);

  els.score.textContent = String(state.score);
  if (state.score >= 550) els.score.classList.add("good");
  else els.score.classList.remove("good");

  els.remaining.innerHTML = "";
  for (const v of VALUES) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="v">${v}</span><span>${state.remaining[v]} / ${BOARD_COUNTS[v]}</span>`;
    els.remaining.appendChild(li);
  }

  if (isGameOver(state)) {
    els.suggestionNote.textContent = state.score >= 550
      ? `Game over. Final score ${state.score}. Target reached!`
      : `Game over. Final score ${state.score}.`;
  } else if (!suggestion || suggestion.cellIdx == null) {
    els.suggestionNote.textContent = "Nothing to suggest.";
  } else {
    const r = indexToLabel(suggestion.cellIdx);
    els.suggestionNote.innerHTML = `Try <strong>${r}</strong> &mdash; ${suggestion.reason}`;
  }
}

function hintForTurn(state, hand) {
  if (!hand) return "Deck exhausted.";
  if (hand === "K") {
    if (state.remaining.K === 0) return "Click your K card on the revealed King to score 100.";
    return "Catch the King in exactly one flip.";
  }
  if (hand === "5") return "Avoid cells with 5-neighbors (would catch you).";
  return "Lowest remaining card is played automatically.";
}

function indexToLabel(idx) {
  const r = Math.floor(idx / 5);
  const c = idx % 5;
  return `R${r + 1}C${c + 1}`;
}

export function bindHover(boardEl, onHoverChange) {
  let current = null;
  boardEl.addEventListener("mouseover", (e) => {
    const target = e.target.closest(".cell");
    if (!target) return;
    const idx = Number(target.dataset.idx);
    current = idx;
    onHoverChange(idx);
  });
  boardEl.addEventListener("mouseout", (e) => {
    const target = e.target.closest(".cell");
    if (!target) return;
    if (Number(target.dataset.idx) === current) {
      current = null;
      onHoverChange(null);
    }
  });
  return {
    getHovered: () => current,
  };
}

export function bindClick(boardEl, handlers) {
  boardEl.addEventListener("click", (e) => {
    const target = e.target.closest(".cell");
    if (!target) return;
    const idx = Number(target.dataset.idx);
    handlers.onCellClick(idx);
  });
}

export function bindKeyboard(handlers) {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      handlers.onReset();
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace") {
      handlers.onUndo();
      e.preventDefault();
      return;
    }
    const mapped = CODE_TO_VALUE[e.code];
    if (mapped) {
      handlers.onReveal(mapped, e.shiftKey);
      e.preventDefault();
    }
  });
}
