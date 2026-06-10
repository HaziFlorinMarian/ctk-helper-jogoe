// Seer UI rendering helpers. Pure DOM; no game logic.

import { ALL, color, scores, oppColorCounts, myRemaining } from "./game.js";
import { t } from "./i18n.js";

// ---------- status strip ----------

export function renderStatus(els, state) {
  const sc = scores(state);
  els.scoreMe.textContent = sc.me;
  els.scoreOpp.textContent = sc.opp;
  els.scoreMargin.textContent = (sc.margin > 0 ? "+" : "") + sc.margin;
  els.scoreMargin.className = "stat-v " + (sc.margin > 0 ? "pos" : sc.margin < 0 ? "neg" : "");
  els.roundNum.textContent = `${Math.min(state.rounds.length + 1, 9)} / 9`;

  const cc = oppColorCounts(state);
  els.oppBlack.textContent = cc.black;
  els.oppWhite.textContent = cc.white;
}

// ---------- 0..8 sequence checklist (the "I start" branch) ----------

export function renderSeq(el, played, onTap) {
  el.innerHTML = "";
  const nextVal = ALL.find((v) => !played.has(v));
  for (const v of ALL) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `seq-card card-${color(v)}`;
    btn.textContent = v;
    if (played.has(v)) btn.classList.add("done");
    else if (v === nextVal) btn.classList.add("next");
    btn.addEventListener("click", () => onTap(v));
    el.appendChild(btn);
  }
}

// ---------- rounds log (computer-leads branch) ----------

export function renderLog(el, state) {
  el.innerHTML = "";
  state.rounds.forEach((r, i) => {
    const li = document.createElement("li");
    const cls = r.result === "higher" ? "win" : r.result === "lower" ? "loss" : "tie";
    const sym = r.result === "higher" ? "▲" : r.result === "lower" ? "▼" : "=";
    li.className = `log-pill ${cls}`;
    li.innerHTML =
      `<span class="log-n">${i + 1}.</span>` +
      `<span class="mini-card card-${color(r.myCard)}">${r.myCard}</span>` +
      `<span class="mini-card card-${r.oppColor}">?</span>` +
      `<span class="log-sym">${sym}</span>`;
    el.appendChild(li);
  });
}

export function gameOver(state) { return myRemaining(state).length === 0; }
