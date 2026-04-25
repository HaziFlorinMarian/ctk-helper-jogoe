import {
  createState,
  recordReveal,
  catchCell,
  undo,
  isGameOver,
  isTrivialSweep,
  NEIGHBORS,
  BOARD_COUNTS,
  fiveProbabilities,
} from "./game.js";
import { suggestMove as suggestMoveHeuristic } from "./solver.js";
import { suggestMovePIMC, CHEST_THRESHOLDS, computeChestProbabilities } from "./simulate.js";
import {
  renderBoard,
  updateBoard,
  updateSidebar,
  bindHover,
  bindKeyboard,
  bindClick,
} from "./ui.js";
import { applyToDOM, getLang, setLang, onLangChange, t } from "./i18n.js";

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
  gameGoldPct: document.getElementById("gameGoldPct"),
  gameGoldNote: document.getElementById("gameGoldNote"),
  toast: document.getElementById("toast"),
  moneyRain: document.getElementById("moneyRain"),
  chingSfx: document.getElementById("chingSfx"),
  likeBtn: document.getElementById("likeBtn"),
  likeCount: document.getElementById("likeCount"),
  globalGames: document.getElementById("globalGames"),
  globalGold: document.getElementById("globalGold"),
  globalSilver: document.getElementById("globalSilver"),
  globalBronze: document.getElementById("globalBronze"),
  globalPctGold: document.getElementById("globalPctGold"),
  globalPctSilver: document.getElementById("globalPctSilver"),
  globalPctBronze: document.getElementById("globalPctBronze"),
  muteBtn: document.getElementById("muteBtn"),
  minimalUiBtn: document.getElementById("minimalUiBtn"),
  chatBtn: document.getElementById("chatBtn"),
  twitchChatMount: document.getElementById("twitchChatMount"),
};

// ---------- twitch chat embed ----------
// Twitch's chat iframe requires the `parent` query param to match the hosting
// hostname (multiple `parent` params allowed). location.hostname covers both
// production (your github.io) and local file/dev hosts; we add localhost too
// so opening index.html via a local server still works.
function mountTwitchChat() {
  if (!els.twitchChatMount) return;
  const host = location.hostname || "localhost";
  const parents = new Set([host, "localhost", "127.0.0.1"]);
  const parentParams = [...parents].map((p) => `parent=${encodeURIComponent(p)}`).join("&");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.twitch.tv/embed/jogoe/chat?darkpopout&${parentParams}`;
  iframe.title = "Twitch chat for jogoe";
  iframe.allow = "autoplay; encrypted-media";
  els.twitchChatMount.appendChild(iframe);
}
mountTwitchChat();

// ---------- header toggles ----------
// Two simple sticky toggles persisted in localStorage:
//   - mute:        suppresses the ching.mp3 played when gold locks in.
//   - minimal-ui:  hides every panel except current card / board / undo+reset.
const MUTE_KEY = "ctk-mute-v1";
const MINIMAL_KEY = "ctk-minimal-ui-v1";
const CHAT_HIDDEN_KEY = "ctk-chat-hidden-v1";
let muted = localStorage.getItem(MUTE_KEY) === "1";
function applyMute() {
  if (els.muteBtn) els.muteBtn.classList.toggle("off", muted);
}
function applyMinimalUi() {
  const on = localStorage.getItem(MINIMAL_KEY) === "1";
  document.body.classList.toggle("minimal-ui", on);
  if (els.minimalUiBtn) els.minimalUiBtn.classList.toggle("off", on);
}
applyMute();
applyMinimalUi();
if (els.muteBtn) {
  els.muteBtn.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    applyMute();
  });
}
if (els.minimalUiBtn) {
  els.minimalUiBtn.addEventListener("click", () => {
    const on = localStorage.getItem(MINIMAL_KEY) !== "1";
    localStorage.setItem(MINIMAL_KEY, on ? "1" : "0");
    applyMinimalUi();
  });
}
function applyChatHidden() {
  const hidden = localStorage.getItem(CHAT_HIDDEN_KEY) === "1";
  document.body.classList.toggle("chat-hidden", hidden);
  if (els.chatBtn) els.chatBtn.classList.toggle("off", hidden);
}
applyChatHidden();
if (els.chatBtn) {
  els.chatBtn.addEventListener("click", () => {
    const hidden = localStorage.getItem(CHAT_HIDDEN_KEY) !== "1";
    localStorage.setItem(CHAT_HIDDEN_KEY, hidden ? "1" : "0");
    applyChatHidden();
  });
}

// ---------- about modal ----------
const aboutBtn = document.getElementById("aboutBtn");
const aboutModal = document.getElementById("aboutModal");
function openAbout() {
  if (!aboutModal) return;
  aboutModal.hidden = false;
  // Push focus into the dialog so Esc / Tab work as expected.
  const card = aboutModal.querySelector(".modal-card");
  if (card) card.focus();
}
function closeAbout() {
  if (aboutModal) aboutModal.hidden = true;
}
if (aboutBtn) aboutBtn.addEventListener("click", openAbout);
if (aboutModal) {
  aboutModal.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.hasAttribute("data-close")) closeAbout();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && aboutModal && !aboutModal.hidden) closeAbout();
});

// ---------- like button (free public counter API) ----------
// abacus.jasoncameron.dev hosts a stateless counter. /get returns the value;
// /hit increments and returns the new value. localStorage gates the click so
// one browser can't spam it. Network failures are silently swallowed — the
// page is fully functional without the like count.
const LIKE_NS = "ctk-helper-jogoe";
const LIKE_KEY = "likes";
const LIKE_BASE = "https://abacus.jasoncameron.dev";
const LIKE_LOCAL = "ctk-liked-v1";
function setLikeCount(n) {
  if (els.likeCount && Number.isFinite(n)) els.likeCount.textContent = String(n);
}
function markLiked() {
  if (els.likeBtn) {
    els.likeBtn.classList.add("liked");
    els.likeBtn.disabled = true;
    els.likeBtn.title = "Thanks!";
  }
}
async function fetchInitialLikes() {
  try {
    const r = await fetch(`${LIKE_BASE}/get/${LIKE_NS}/${LIKE_KEY}`);
    if (r.status === 404) {
      // Counter doesn't exist yet on the abacus side. /hit auto-creates on
      // first interaction; until then, show a zero so the UI isn't stuck on "…".
      setLikeCount(0);
      return;
    }
    if (!r.ok) return;
    const data = await r.json();
    setLikeCount(data.value);
  } catch { /* offline / API down — leave the placeholder. */ }
}
async function sendLike() {
  try {
    const r = await fetch(`${LIKE_BASE}/hit/${LIKE_NS}/${LIKE_KEY}`);
    if (!r.ok) return;
    const data = await r.json();
    setLikeCount(data.value);
  } catch { /* swallow — UI already shows liked state. */ }
}
if (els.likeBtn) {
  if (localStorage.getItem(LIKE_LOCAL) === "1") markLiked();
  els.likeBtn.addEventListener("click", () => {
    if (localStorage.getItem(LIKE_LOCAL) === "1") return;
    localStorage.setItem(LIKE_LOCAL, "1");
    markLiked();
    sendLike();
  });
  fetchInitialLikes();
}

// ---------- global counters (everyone, all time) ----------
// Same abacus host as the like button. Four counters under the helper's
// namespace: games / gold / silver / bronze. We GET all four on load to
// populate the panel, then HIT one tier counter + the games counter when a
// game completes locally. Like the like button: 404 → 0, network errors are
// silently swallowed so the page never breaks.
const GLOBAL_KEYS = ["games", "gold", "silver", "bronze"];
const globalCounts = { games: null, gold: null, silver: null, bronze: null };
function renderGlobalStats() {
  const g = globalCounts;
  const fmt = (v) => v == null ? "…" : String(v);
  els.globalGames.textContent = fmt(g.games);
  els.globalGold.textContent = fmt(g.gold);
  els.globalSilver.textContent = fmt(g.silver);
  els.globalBronze.textContent = fmt(g.bronze);
  const pct = (n) => (g.games && n != null ? `(${Math.round((n / g.games) * 100)}%)` : "");
  els.globalPctGold.textContent = pct(g.gold);
  els.globalPctSilver.textContent = pct(g.silver);
  els.globalPctBronze.textContent = pct(g.bronze);
}
async function fetchGlobalCount(key) {
  try {
    const r = await fetch(`${LIKE_BASE}/get/${LIKE_NS}/${key}`);
    if (r.status === 404) return 0;
    if (!r.ok) return null;
    const data = await r.json();
    return Number.isFinite(data.value) ? data.value : null;
  } catch { return null; }
}
async function fetchAllGlobalCounts() {
  const results = await Promise.all(GLOBAL_KEYS.map(fetchGlobalCount));
  for (let i = 0; i < GLOBAL_KEYS.length; i++) {
    if (results[i] != null) globalCounts[GLOBAL_KEYS[i]] = results[i];
  }
  renderGlobalStats();
}
async function hitGlobal(key) {
  try {
    const r = await fetch(`${LIKE_BASE}/hit/${LIKE_NS}/${key}`);
    if (!r.ok) return;
    const data = await r.json();
    if (Number.isFinite(data.value)) {
      globalCounts[key] = data.value;
      renderGlobalStats();
    }
  } catch { /* swallow */ }
}
function recordGlobalCompletion(score) {
  // Always count the game; bump exactly one tier so percentages add up.
  hitGlobal("games");
  if (score >= CHEST_THRESHOLDS.gold) hitGlobal("gold");
  else if (score >= CHEST_THRESHOLDS.silver) hitGlobal("silver");
  else if (score >= CHEST_THRESHOLDS.bronze) hitGlobal("bronze");
}
fetchAllGlobalCounts();

// ---------- page-open counter ----------
// Bumped once per page load. Shown next to the version line. We don't dedup
// across reloads — that's the standard "page views" semantic.
const versionViewsEl = document.getElementById("versionViews");
async function bumpPageOpens() {
  if (!versionViewsEl) return;
  try {
    const r = await fetch(`${LIKE_BASE}/hit/${LIKE_NS}/page-opens`);
    if (!r.ok) return;
    const data = await r.json();
    if (Number.isFinite(data.value)) {
      const formatted = data.value.toLocaleString();
      versionViewsEl.textContent = `${formatted} page opens`;
    }
  } catch { /* offline / API down — leave the slot empty. */ }
}
bumpPageOpens();

// One-shot trigger: fires the money rain + ching the moment this game's gold
// chance crosses 100%. Reset on game reset so the next gold-locked game can
// retrigger it.
let goldRainFired = false;
const COIN_GLYPHS = ["💰", "💵", "💴", "💶", "💷", "🪙"];
function triggerGoldRain() {
  if (!els.moneyRain) return;
  // Play sfx — clone the node so rapid retriggers (e.g. after reset) don't
  // get cut short by the still-playing previous instance. Respects the mute
  // toggle in the header.
  if (els.chingSfx && !muted) {
    const sfx = els.chingSfx.cloneNode();
    sfx.volume = 0.7;
    sfx.play().catch(() => { /* autoplay-blocked browsers — silent fail. */ });
  }
  const COIN_COUNT = 36;
  els.moneyRain.classList.add("active");
  let remaining = COIN_COUNT;
  for (let i = 0; i < COIN_COUNT; i++) {
    const coin = document.createElement("span");
    coin.className = "coin";
    coin.textContent = COIN_GLYPHS[i % COIN_GLYPHS.length];
    coin.style.left = (Math.random() * 100) + "vw";
    coin.style.fontSize = (22 + Math.random() * 18) + "px";
    coin.style.animationDuration = (1.8 + Math.random() * 1.4) + "s";
    coin.style.animationDelay = (Math.random() * 0.8) + "s";
    coin.addEventListener("animationend", () => {
      coin.remove();
      // Once the last coin's gone, drop the overlay so Twitch chat can be
      // used by channel owners/mods again.
      if (--remaining <= 0) els.moneyRain.classList.remove("active");
    });
    els.moneyRain.appendChild(coin);
  }
}

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
  recordGlobalCompletion(score);
}

function trackGameCompletion() {
  const now = isGameOver(state);
  if (!lastGameOver && now) recordGameCompletion(state.score);
  lastGameOver = now;
}

// Threshold for crediting an abandoned game: enough clicks that the rollout
// estimator has real signal, not just opener noise. ~10 actions ≈ past the
// hand=1 cards into the meaningful info-gathering phase.
const ABANDONED_MIN_CLICKS = 10;

// Roll a tier from the rollout probabilities. computeChestProbabilities returns
// CUMULATIVE thresholds (pGold ⊆ pSilver ⊆ pBronze), so tier-exclusive masses
// are pGold / pSilver-pGold / pBronze-pSilver / 1-pBronze.
function sampleTierFromProbs(p) {
  const pGold = p.pGold;
  const pSilver = Math.max(0, p.pSilver - p.pGold);
  const pBronze = Math.max(0, p.pBronze - p.pSilver);
  const r = Math.random();
  if (r < pGold) return "gold";
  if (r < pGold + pSilver) return "silver";
  if (r < pGold + pSilver + pBronze) return "bronze";
  return null; // sub-bronze
}

// If the user resets a substantive but unfinished game, count it using a
// tier sampled from the current solver estimate. Keeps the global ticker (and
// session table) representative when people abandon late-game positions.
function flushAbandonedGame() {
  if (isGameOver(state)) return;
  if ((state.history?.length ?? 0) < ABANDONED_MIN_CLICKS) return;
  const probs = computeChestProbabilities(state, { N: 80 });
  const tier = sampleTierFromProbs(probs);

  // Local session — bump games + tier (or just games for sub-bronze).
  const s = loadSessionStats();
  s.games += 1;
  if (tier === "gold") s.gold += 1;
  else if (tier === "silver") s.silver += 1;
  else if (tier === "bronze") s.bronze += 1;
  saveSessionStats(s);
  renderSessionStats();

  // Global — same shape, via the abacus counters.
  hitGlobal("games");
  if (tier) hitGlobal(tier);
}

// ---------- toast ----------
let toastTimer = 0;
function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("toast-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("toast-show");
  }, 2400);
}

// ---------- per-game gold-chance card ----------
// Async so the rest of the UI repaints first; a monotonic job id cancels stale
// computations when the user keeps acting quickly.
let goldJob = 0;
function queueGoldChanceUpdate() {
  const jobId = ++goldJob;
  els.gameGoldPct.textContent = "…";
  els.gameGoldPct.classList.remove("cold", "warm", "hot");
  els.gameGoldNote.textContent = t("goldChanceComputing");
  setTimeout(() => {
    if (jobId !== goldJob) return;
    const r = computeChestProbabilities(state, { N: 40 });
    if (jobId !== goldJob) return;
    const pctText = Math.round(r.pGold * 100) + "%";
    els.gameGoldPct.textContent = pctText;
    els.gameGoldPct.classList.toggle("hot",  r.pGold >= 0.6);
    els.gameGoldPct.classList.toggle("warm", r.pGold >= 0.3 && r.pGold < 0.6);
    els.gameGoldPct.classList.toggle("cold", r.pGold < 0.3);
    els.gameGoldPct.classList.toggle("locked", r.pGold >= 0.999);
    els.gameGoldNote.textContent = r.gameOver
      ? t("goldChanceFinal", { score: r.eScore })
      : t("goldChanceNote", { samples: r.samples });
    // Fire the rain the first time gold becomes locked-in this game. Use
    // pGold >= 0.999 instead of === 1 so float fuzz can't hide the trigger.
    if (!goldRainFired && r.pGold >= 0.999) {
      goldRainFired = true;
      triggerGoldRain();
    }
  }, 0);
}

// ---------- solver / refresh ----------
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
  queueGoldChanceUpdate();
}

renderBoard(boardEl);
renderSessionStats();
applyToDOM();

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

// Once a 5 is pinned (revealed or deduced P=1), revealing an adjacent cell
// MUST flash by definition — there's no longer a no-flash version of the
// truth. Auto-promote flashed=true on those reveals so the user doesn't
// have to press Shift on every later reveal.
function effectiveFlashed(idx, flashed) {
  if (flashed) return true;
  const pFive = fiveProbabilities(state);
  for (const n of NEIGHBORS[idx]) {
    const nc = state.cells[n];
    if (nc.state === "revealed" && nc.value === "5") return true;
    if (nc.state === "hidden" && (pFive.get(n) ?? 0) >= 0.999) return true;
  }
  return false;
}

bindKeyboard({
  onReveal(value, flashed) {
    if (isGameOver(state)) return;
    const idx = hover.getHovered();
    if (idx == null) return;
    if (state.cells[idx].state !== "hidden") return;
    if ((state.remaining[value] ?? 0) <= 0) {
      showToast(t("valueExhausted", { value, total: BOARD_COUNTS[value] }));
      return;
    }
    recordReveal(state, idx, value, effectiveFlashed(idx, flashed));
    refresh();
  },
  onUndo() {
    undo(state);
    refresh();
  },
  onReset() {
    flushAbandonedGame();
    state = createState();
    lastGameOver = false;
    goldRainFired = false;
    refresh();
  },
});

els.resetBtn.addEventListener("click", () => {
  flushAbandonedGame();
  state = createState();
  lastGameOver = false;
  goldRainFired = false;
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

// ---------- language switcher ----------
const langButtons = document.querySelectorAll(".lang-switcher .lang-btn");
function syncLangButtons() {
  const cur = getLang();
  langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === cur);
  });
}
langButtons.forEach((btn) => {
  btn.addEventListener("click", () => setLang(btn.dataset.lang));
});
onLangChange(() => {
  syncLangButtons();
  renderSessionStats();
  refresh();
});
syncLangButtons();

refresh();
