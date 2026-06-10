// Seer helper — streamlined flow on the shared ctk shell.
//
// One decision drives everything: who plays first (fixed for the whole game).
//   - "I start"        -> the maths says card order is irrelevant, so we just tell
//                         the player to click 0..8 in order. No tracking needed.
//   - "Computer starts"-> the helper earns its keep: per round we ask the colour
//                         we can see, suggest the best card, and record the result.

import { createState, recordRound, undo, resetState, color } from "./game.js";
import { recommend } from "./solver.js";
import { renderStatus, renderLog, gameOver } from "./ui.js";
import { applyToDOM, getLang, setLang, onLangChange, t } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const els = {
  scoreMe: $("scoreMe"), scoreOpp: $("scoreOpp"), scoreMargin: $("scoreMargin"),
  roundNum: $("roundNum"), oppBlack: $("oppBlack"), oppWhite: $("oppWhite"),

  leaderPick: $("leaderPick"), leaderMe: $("leaderMe"), leaderOpp: $("leaderOpp"),

  meStage: $("meStage"),

  scoreBlock: $("scoreBlock"), oppCardsBlock: $("oppCardsBlock"),
  controlsBlock: $("controlsBlock"), modelNoteBlock: $("modelNoteBlock"),

  oppStage: $("oppStage"),
  askColour: $("askColour"), colorBlack: $("colorBlack"), colorWhite: $("colorWhite"),
  askResult: $("askResult"), recCard: $("recCard"), recMeta: $("recMeta"),
  resHigher: $("resHigher"), resEqual: $("resEqual"), resLower: $("resLower"),
  oppOver: $("oppOver"), overText: $("overText"),
  undoBtn: $("undoBtn"), resetBtn: $("resetBtn"), roundsLog: $("roundsLog"),

  likeBtn: $("likeBtn"), likeCount: $("likeCount"),
  chatBtn: $("chatBtn"), twitchChatMount: $("twitchChatMount"),
  seerSessGames: $("seerSessGames"), seerSessAvg: $("seerSessAvg"),
  seerSessionReset: $("seerSessionReset"),
  seerGlobGames: $("seerGlobGames"), seerGlobAvg: $("seerGlobAvg"), seerCoinDist: $("seerCoinDist"),
  toast: $("toast"),
};

const state = createState();
let leader = null;            // null | "me" | "opp"
let pendingColor = null;      // current round's revealed colour ("black"|"white")
let recCard = null;           // suggested card for the current round
let gameCounted = false;      // guard: count each finished game's coins exactly once

// ---------- branch switching ----------
// leaderPick: only the two big buttons. me: only the explanatory banner.
// opp: the colour/result flow + the live score/controls on the right.

function show(stage) {
  els.leaderPick.hidden = stage !== "leader";
  els.meStage.hidden = stage !== "me";
  els.oppStage.hidden = stage !== "opp";

  // The right panel (score, opponent cards, Undo/Reset, model note) is ALWAYS
  // visible and never moves — only the centre stage changes. Reset always sits
  // in the same spot. Undo is only meaningful during a computer-starts game.
  els.undoBtn.disabled = stage !== "opp";
}

function chooseLeader(which) {
  leader = which;
  if (which === "me") { show("me"); }
  else { resetState(state); pendingColor = null; recCard = null; show("opp"); renderOpp(); }
}

function newGame() {
  leader = null;
  resetState(state);
  pendingColor = null; recCard = null;
  gameCounted = false;
  show("leader");
  renderStatus(els, state);
}

// ---------- "Computer starts" branch ----------

function computeRec() {
  if (!pendingColor || gameOver(state)) { recCard = null; return; }
  const rec = recommend(state, { leader: "opp", knownColor: pendingColor });
  recCard = rec ? rec.card : null;
}

function setColour(c) {
  if (gameOver(state)) return;
  pendingColor = c;
  computeRec();
  renderOpp();
}

function setResult(result) {
  if (pendingColor == null || recCard == null) return;
  recordRound(state, { leader: "opp", myCard: recCard, oppColor: pendingColor, result });
  pendingColor = null; recCard = null;
  if (gameOver(state)) {
    const s = finalStats();
    if (!gameCounted) { gameCounted = true; recordGameCoins(s.coins); }
    toast(t("finalCoins", s));
  } else {
    toast(t("recordedRound", { n: state.rounds.length }));
  }
  renderOpp();
}

function onUndo() {
  if (pendingColor != null) {            // back out of the in-progress round
    pendingColor = null; recCard = null;
  } else if (!undo(state)) {
    return;
  }
  renderOpp();
}

function renderOpp() {
  renderStatus(els, state);
  renderLog(els.roundsLog, state);

  const over = gameOver(state);
  els.oppOver.hidden = !over;
  els.askColour.hidden = over || pendingColor != null;
  els.askResult.hidden = over || pendingColor == null;

  if (over) {
    const s = finalStats();
    const cls = s.margin > 0 ? "pos" : s.margin < 0 ? "neg" : "";
    els.overText.innerHTML = t("overText", { ...s, cls });
  } else if (pendingColor != null && recCard != null) {
    els.recCard.textContent = recCard;
    els.recCard.className = `rec-card card-${color(recCard)}`;
    els.recMeta.textContent = t("recMeta", { colour: t(pendingColor) });
  }

  els.undoBtn.disabled = state.rounds.length === 0 && pendingColor == null;
}

function finalStats() {
  let wins = 0, losses = 0;
  for (const r of state.rounds) {
    if (r.result === "higher") wins++; else if (r.result === "lower") losses++;
  }
  const margin = wins - losses;
  const coins = wins + (margin > 0 ? margin : 0);
  return { wins, losses, margin, coins, m: (margin > 0 ? "+" : "") + margin };
}

// ---------- toast ----------
let toastTimer = 0;
function toast(msg) {
  if (!els.toast) return;
  els.toast.innerHTML = msg;
  els.toast.classList.add("toast-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("toast-show"), 1800);
}

// ---------- modals (impressum / datenschutz) ----------
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.hidden = false;
  const card = m.querySelector(".modal-card");
  if (card) card.focus();
}
function closeModal(m) { if (m) m.hidden = true; }
function anyModalOpen() { return document.querySelector(".modal:not([hidden])"); }
document.querySelectorAll("[data-open-modal]").forEach((el) => {
  el.addEventListener("click", () => openModal(el.getAttribute("data-open-modal")));
});
document.querySelectorAll(".modal").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.hasAttribute("data-close")) closeModal(m);
  });
});

// ---------- twitch chat (consent-gated, same as ctk) ----------
const TWITCH_CONSENT_KEY = "seer-twitch-consent-v1";
function mountTwitchIframe() {
  if (!els.twitchChatMount) return;
  els.twitchChatMount.innerHTML = "";
  const host = location.hostname || "localhost";
  const parents = new Set([host, "localhost", "127.0.0.1"]);
  const parentParams = [...parents].map((p) => `parent=${encodeURIComponent(p)}`).join("&");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.twitch.tv/embed/jogoe/chat?darkpopout&${parentParams}`;
  iframe.title = "Twitch chat for jogoe";
  iframe.allow = "autoplay; encrypted-media";
  els.twitchChatMount.appendChild(iframe);
}
(function bootTwitchChat() {
  if (localStorage.getItem(TWITCH_CONSENT_KEY) === "1") { mountTwitchIframe(); return; }
  const btn = document.getElementById("twitchConsentBtn");
  if (btn) btn.addEventListener("click", () => {
    localStorage.setItem(TWITCH_CONSENT_KEY, "1");
    mountTwitchIframe();
  });
})();
const revokeBtn = document.getElementById("revokeTwitchConsentBtn");
if (revokeBtn) revokeBtn.addEventListener("click", () => {
  localStorage.removeItem(TWITCH_CONSENT_KEY);
  toast(t("twitchConsentRevoked"));
});

// chat toggle
const CHAT_HIDDEN_KEY = "seer-chat-hidden-v1";
function applyChatHidden() {
  const hidden = localStorage.getItem(CHAT_HIDDEN_KEY) === "1";
  document.body.classList.toggle("chat-hidden", hidden);
  if (els.chatBtn) els.chatBtn.classList.toggle("off", hidden);
}
applyChatHidden();
if (els.chatBtn) els.chatBtn.addEventListener("click", () => {
  const hidden = localStorage.getItem(CHAT_HIDDEN_KEY) !== "1";
  localStorage.setItem(CHAT_HIDDEN_KEY, hidden ? "1" : "0");
  applyChatHidden();
});

// ---------- like + page-open counters (own namespace) ----------
const ABACUS = "https://abacus.jasoncameron.dev";
const NS = "seer-helper-jogoe";
const LIKE_LOCAL = "seer-liked-v1";
function setLikeCount(n) { if (els.likeCount && Number.isFinite(n)) els.likeCount.textContent = n.toLocaleString(); }
function markLiked() {
  if (!els.likeBtn) return;
  els.likeBtn.classList.add("liked");
  els.likeBtn.disabled = true;
  els.likeBtn.title = "Thanks!";
}
async function fetchInitialLikes() {
  try {
    const r = await fetch(`${ABACUS}/get/${NS}/likes`);
    if (r.status === 404) { setLikeCount(0); return; }
    if (!r.ok) return;
    const d = await r.json(); setLikeCount(d.value);
  } catch {}
}
async function sendLike() {
  try { const r = await fetch(`${ABACUS}/hit/${NS}/likes`); if (r.ok) { const d = await r.json(); setLikeCount(d.value); } } catch {}
}
if (els.likeBtn) {
  if (localStorage.getItem(LIKE_LOCAL) === "1") markLiked();
  els.likeBtn.addEventListener("click", () => {
    if (localStorage.getItem(LIKE_LOCAL) === "1") return;
    localStorage.setItem(LIKE_LOCAL, "1");
    markLiked(); sendLike();
  });
  fetchInitialLikes();
}
const versionViewsEl = $("versionViews");
(async function bumpPageOpens() {
  if (!versionViewsEl) return;
  try {
    const r = await fetch(`${ABACUS}/hit/${NS}/page-opens`);
    if (!r.ok) return;
    const d = await r.json();
    if (Number.isFinite(d.value)) versionViewsEl.textContent = `${d.value.toLocaleString()} page opens`;
  } catch {}
})();

// ---------- session + global coin counters ----------
// Coins/game range 0..16 (max achievable is 15). Each finished computer-leads game
// bumps one bucket. Session is local; global lives in abacus counters coins-0..16,
// total games = the sum of the buckets.
const MAXC = 16;
const SESSION_KEY = "seer-session-v1";
function loadSession() {
  try { const r = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}"); return { games: r.games || 0, coinsSum: r.coinsSum || 0 }; }
  catch { return { games: 0, coinsSum: 0 }; }
}
function saveSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {} }
let session = loadSession();
function renderSession() {
  if (els.seerSessGames) els.seerSessGames.textContent = session.games.toLocaleString();
  if (els.seerSessAvg) els.seerSessAvg.textContent = session.games ? (session.coinsSum / session.games).toFixed(2) : "–";
}

const globalDist = new Array(MAXC + 1).fill(null);
function renderGlobal() {
  let total = 0, sumCoins = 0, have = false, max = 0;
  for (let n = 0; n <= MAXC; n++) {
    const v = globalDist[n];
    if (Number.isFinite(v)) { have = true; total += v; sumCoins += n * v; if (v > max) max = v; }
  }
  if (els.seerGlobGames) els.seerGlobGames.textContent = have ? total.toLocaleString() : "…";
  if (els.seerGlobAvg) els.seerGlobAvg.textContent = have ? (total ? (sumCoins / total).toFixed(2) : "–") : "…";
  if (!els.seerCoinDist) return;
  els.seerCoinDist.innerHTML = "";
  for (let n = 0; n <= MAXC; n++) {
    const v = globalDist[n] || 0;
    const isDefault = n >= 2 && n <= 7;     // always show 2–7; others only if >0
    if (!isDefault && v <= 0) continue;
    const li = document.createElement("li");
    li.className = "cd-row" + (isDefault ? " cd-default" : "");
    const w = max > 0 ? Math.round((v / max) * 100) : 0;
    li.innerHTML =
      `<span class="cd-n">${n}</span>` +
      `<span class="cd-bar"><i style="width:${w}%"></i></span>` +
      `<span class="cd-c">${v.toLocaleString()}</span>`;
    els.seerCoinDist.appendChild(li);
  }
}
async function fetchGlobalDist() {
  await Promise.all(Array.from({ length: MAXC + 1 }, (_, n) =>
    fetch(`${ABACUS}/get/${NS}/coins-${n}`)
      .then((r) => r.status === 404 ? 0 : r.ok ? r.json().then((d) => Number.isFinite(d.value) ? d.value : 0) : 0)
      .catch(() => 0)
      .then((v) => { globalDist[n] = v; })
  ));
  renderGlobal();
}
async function hitGlobalCoins(n) {
  try {
    const r = await fetch(`${ABACUS}/hit/${NS}/coins-${n}`);
    if (r.ok) { const d = await r.json(); if (Number.isFinite(d.value)) { globalDist[n] = d.value; renderGlobal(); } }
  } catch {}
}
function recordGameCoins(coins) {
  const n = Math.max(0, Math.min(MAXC, coins | 0));
  session.games++; session.coinsSum += coins; saveSession(session); renderSession();
  hitGlobalCoins(n);
}
if (els.seerSessionReset) els.seerSessionReset.addEventListener("click", () => {
  session = { games: 0, coinsSum: 0 };
  saveSession(session); renderSession();
});
renderSession();
fetchGlobalDist();

// ---------- keyboard ----------
document.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key === "Escape") {
    const open = anyModalOpen();
    if (open) { document.querySelectorAll(".modal:not([hidden])").forEach(closeModal); return; }
    newGame();
    return;
  }
  if (leader === "opp") {
    if (e.key === "Backspace") { e.preventDefault(); onUndo(); return; }
    if (pendingColor == null && !gameOver(state)) {
      if (e.key.toLowerCase() === "b") setColour("black");
      if (e.key.toLowerCase() === "w") setColour("white");
    } else if (pendingColor != null) {
      if (e.key === "ArrowUp" || e.key === "1") setResult("higher");
      if (e.key === "0" || e.key === "=") setResult("equal");
      if (e.key === "ArrowDown" || e.key === "2") setResult("lower");
    }
  }
});

// ---------- language buttons (ctk-style) ----------
const langBtns = [...document.querySelectorAll(".lang-btn")];
function applyLangButtons() {
  const cur = getLang();
  langBtns.forEach((b) => b.classList.toggle("active", b.dataset.lang === cur));
}
langBtns.forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

// ---------- bootstrap ----------
els.leaderMe.addEventListener("click", () => chooseLeader("me"));
els.leaderOpp.addEventListener("click", () => chooseLeader("opp"));
els.colorBlack.addEventListener("click", () => setColour("black"));
els.colorWhite.addEventListener("click", () => setColour("white"));
els.resHigher.addEventListener("click", () => setResult("higher"));
els.resEqual.addEventListener("click", () => setResult("equal"));
els.resLower.addEventListener("click", () => setResult("lower"));
els.undoBtn.addEventListener("click", onUndo);
els.resetBtn.addEventListener("click", newGame);

onLangChange(() => {
  applyLangButtons();
  if (leader === "opp") renderOpp();
});

applyToDOM();
applyLangButtons();
renderStatus(els, state);
show("leader");
