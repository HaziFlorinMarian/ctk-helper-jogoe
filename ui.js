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
  isTrivialSweep,
  maxPossibleRemaining,
} from "./game.js";

const MONEY_FACE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" class="money-icon">
  <circle cx="60" cy="60" r="52" fill="#f2c94c" stroke="#1a1a1a" stroke-width="4"/>
  <text x="36" y="70" font-size="36" font-weight="900" text-anchor="middle" fill="#1b9b4b" font-family="system-ui">$</text>
  <text x="84" y="70" font-size="36" font-weight="900" text-anchor="middle" fill="#1b9b4b" font-family="system-ui">$</text>
  <path d="M 32 82 Q 60 112 88 82 Z" fill="#1a1a1a"/>
  <ellipse cx="60" cy="98" rx="16" ry="8" fill="#ff5e7a"/>
</svg>`;

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
  // Free-cash easter egg: when every remaining hidden cell is either safe-for-5
  // or a deduced 5, the player can just sweep. Stamp each green cell with a
  // tiny money-eyes face.
  const freeCashMode = isTrivialSweep(state, pFive);

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
      if (!cell.scored) {
        el.classList.add("unscored");
        // During hand=5, unscored cells with a 5 neighbor can't be claimed —
        // clicking would trigger the catch mechanic and score 0. Flag them so
        // the user can see at a glance that the click is blocked.
        if (currentCard(state) === "5" && !isSafeFor5Turn(state, i, null, pFive)) {
          el.classList.add("unscored-locked");
        }
      }
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

    // Drop the free-cash face on every safe green during sweep mode.
    if (freeCashMode && safeToFlip && !mustBeFive) {
      const face = document.createElement("div");
      face.className = "money-icon-wrap";
      face.innerHTML = MONEY_FACE_SVG;
      el.appendChild(face);
    }

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

  if (els.scoreCeiling) {
    const maxRem = maxPossibleRemaining(state);
    const ceiling = state.score + maxRem;
    els.scoreCeiling.textContent = `ceiling ${ceiling} (+${maxRem} left)`;
    els.scoreCeiling.classList.remove("unreachable", "within-reach");
    if (ceiling < 550) els.scoreCeiling.classList.add("unreachable");
    else if (state.score >= 550) els.scoreCeiling.classList.add("within-reach");
  }

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
