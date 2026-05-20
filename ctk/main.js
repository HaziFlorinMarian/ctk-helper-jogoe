import {
  createState,
  recordReveal,
  catchCell,
  undo,
  isGameOver,
  isTrivialSweep,
  NEIGHBORS,
  BOARD_COUNTS,
  VALUES,
  fiveProbabilities,
  cellValueDistribution,
} from "./game.js";
import { suggestMove } from "./solver.js";
import { CHEST_THRESHOLDS, computeChestProbabilities } from "./simulate.js";
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
  sessionRate: document.getElementById("sessionRate"),
  globalRate: document.getElementById("globalRate"),
  muteBtn: document.getElementById("muteBtn"),
  minimalUiBtn: document.getElementById("minimalUiBtn"),
  chatBtn: document.getElementById("chatBtn"),
  twitchChatMount: document.getElementById("twitchChatMount"),
};

// ---------- twitch chat embed (consent-gated) ----------
// Twitch's chat iframe sets cookies and ships IP+session data to Twitch. To
// stay on the right side of GDPR/TTDSG we never load it without explicit
// user opt-in. The consent flag is persisted in localStorage; a Revoke
// button in the privacy modal clears it.
const TWITCH_CONSENT_KEY = "ctk-twitch-consent-v1";
function mountTwitchIframe() {
  if (!els.twitchChatMount) return;
  // Replace the placeholder with the real iframe.
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
function bootTwitchChat() {
  if (localStorage.getItem(TWITCH_CONSENT_KEY) === "1") {
    mountTwitchIframe();
    return;
  }
  // Wire the consent button (rendered in the placeholder template).
  const btn = document.getElementById("twitchConsentBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      localStorage.setItem(TWITCH_CONSENT_KEY, "1");
      mountTwitchIframe();
    });
  }
}
bootTwitchChat();
const revokeBtn = document.getElementById("revokeTwitchConsentBtn");
if (revokeBtn) {
  revokeBtn.addEventListener("click", () => {
    localStorage.removeItem(TWITCH_CONSENT_KEY);
    showToast(t("twitchConsentRevoked"));
  });
}

// ---------- header toggles ----------
// Two simple sticky toggles persisted in localStorage:
//   - mute:        suppresses the ching.mp3 played when gold locks in.
//   - minimal-ui:  hides every panel except current card / board / undo+reset.
const MUTE_KEY = "ctk-mute-v1";
const MINIMAL_KEY = "ctk-minimal-ui-v1";
const CHAT_HIDDEN_KEY = "ctk-chat-hidden-v1";
const LEGACY_STYLE_KEY = "ctk-legacy-style-v1";
let muted = localStorage.getItem(MUTE_KEY) === "1";
function applyMute() {
  if (els.muteBtn) els.muteBtn.classList.toggle("off", muted);
}
function applyMinimalUi() {
  const on = localStorage.getItem(MINIMAL_KEY) === "1";
  document.body.classList.toggle("minimal-ui", on);
  if (els.minimalUiBtn) els.minimalUiBtn.classList.toggle("off", on);
}
function applyLegacyStyle() {
  const on = localStorage.getItem(LEGACY_STYLE_KEY) === "1";
  document.body.classList.toggle("legacy-style", on);
  const btn = document.getElementById("legacyStyleBtn");
  if (btn) btn.classList.toggle("off", !on);
}
applyMute();
applyMinimalUi();
applyLegacyStyle();
if (els.muteBtn) {
  els.muteBtn.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    applyMute();
  });
}
const legacyStyleBtn = document.getElementById("legacyStyleBtn");
if (legacyStyleBtn) {
  legacyStyleBtn.addEventListener("click", () => {
    const on = localStorage.getItem(LEGACY_STYLE_KEY) !== "1";
    localStorage.setItem(LEGACY_STYLE_KEY, on ? "1" : "0");
    applyLegacyStyle();
  });
}

// ---------- custom sound ----------
// Lets the user pick their own ching mp3. We persist the file as a data URL
// in localStorage so it survives reload without a server. Quota is ~5MB on
// most browsers — files larger than 4MB are rejected up front.
const CUSTOM_SFX_KEY = "ctk-custom-sfx-v1";
const CUSTOM_SFX_MAX_BYTES = 4 * 1024 * 1024;
const customSfxBtn = document.getElementById("customSfxBtn");
const customSfxInput = document.getElementById("customSfxInput");
function applyCustomSfx() {
  const url = localStorage.getItem(CUSTOM_SFX_KEY);
  if (els.chingSfx) els.chingSfx.src = url || "ching.mp3";
  if (customSfxBtn) customSfxBtn.classList.toggle("off", !url);
}
applyCustomSfx();
if (customSfxBtn && customSfxInput) {
  customSfxBtn.addEventListener("click", () => customSfxInput.click());
  customSfxBtn.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    localStorage.removeItem(CUSTOM_SFX_KEY);
    applyCustomSfx();
    showToast(t("customSfxReset"));
  });
  customSfxInput.addEventListener("change", () => {
    const f = customSfxInput.files && customSfxInput.files[0];
    customSfxInput.value = "";
    if (!f) return;
    if (f.size > CUSTOM_SFX_MAX_BYTES) {
      showToast(t("customSfxTooBig"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem(CUSTOM_SFX_KEY, reader.result);
        applyCustomSfx();
        if (els.chingSfx && !muted) {
          const sfx = els.chingSfx.cloneNode();
          sfx.volume = 0.7;
          sfx.play().catch(() => {});
        }
        showToast(t("customSfxSet"));
      } catch {
        showToast(t("customSfxTooBig"));
      }
    };
    reader.readAsDataURL(f);
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

// ---------- modals (about, impressum, datenschutz) ----------
// Generic open/close: any element with [data-open-modal="<id>"] opens that
// modal; any descendant with [data-close] inside a modal dismisses it; Esc
// closes any open modal.
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.hidden = false;
  const card = m.querySelector(".modal-card");
  if (card) card.focus();
}
function closeModal(m) {
  if (m) m.hidden = true;
}
document.querySelectorAll("[data-open-modal]").forEach((el) => {
  el.addEventListener("click", () => openModal(el.getAttribute("data-open-modal")));
});
document.querySelectorAll(".modal").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.hasAttribute("data-close")) closeModal(m);
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".modal:not([hidden])").forEach((m) => closeModal(m));
});
const aboutBtn = document.getElementById("aboutBtn");
if (aboutBtn) aboutBtn.addEventListener("click", () => openModal("aboutModal"));

// ---------- farewell / event-summary modal ----------
// Shows once on first visit (gated by localStorage flag), reopenable from
// the header 🎉 button. Renders the user's local session stats + a derived
// "sets farmed" (games × 5) number, and offers download / copy / share of
// the captured stat card as a PNG.
const FAREWELL_SEEN_KEY = "ctk-farewell-seen-v1";
function populateFarewell() {
  const s = loadSessionStats();
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
  const pct = (n, d) => d > 0 ? `(${Math.round(n / d * 100)}%)` : "";
  const fmt = (n) => Number.isFinite(n) ? n.toLocaleString(undefined) : "…";
  // Chest tiers shown as CHESTS EARNED (each game awards 5 chests at the
  // achieved tier), matching how the game distributes rewards in-game.
  const fmtChests = (n) => Number.isFinite(n) ? (n * 5).toLocaleString(undefined) : "…";
  setEl("farewellGames", s.games);
  setEl("farewellGold", fmtChests(s.gold));
  setEl("farewellSilver", fmtChests(s.silver));
  setEl("farewellBronze", fmtChests(s.bronze));
  setEl("farewellSets", s.games * 5);
  setEl("farewellGoldPct", pct(s.gold, s.games));
  setEl("farewellSilverPct", pct(s.silver, s.games));
  setEl("farewellBronzePct", pct(s.bronze, s.games));

  // Global stats from abacus (may still be loading on first render).
  setEl("farewellGlobalGames", fmt(globalCounts.games));
  setEl("farewellGlobalGold", fmtChests(globalCounts.gold));
  setEl("farewellGlobalSilver", fmtChests(globalCounts.silver));
  setEl("farewellGlobalBronze", fmtChests(globalCounts.bronze));
  setEl("farewellGlobalSets", Number.isFinite(globalCounts.games)
    ? fmt(globalCounts.games * 5) : "…");
  setEl("farewellGlobalGoldPct", pct(globalCounts.gold, globalCounts.games));
  setEl("farewellGlobalSilverPct", pct(globalCounts.silver, globalCounts.games));
  setEl("farewellGlobalBronzePct", pct(globalCounts.bronze, globalCounts.games));
}

// Preload the chest icons once; they're embedded next to the page so the
// canvas doesn't get tainted when we draw them into the PNG export.
const chestImgs = {};
for (const tier of ["gold", "silver", "bronze"]) {
  const img = new Image();
  img.src = `img/chest-${tier}.png`;
  chestImgs[tier] = img;
}
function waitForChests() {
  return Promise.all(Object.values(chestImgs).map((img) =>
    img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      : new Promise((res) => { img.onload = res; img.onerror = res; })
  ));
}

// Render an epic shareable wrapped-style card to a 2D canvas. Designed
// for social-share — portrait 720×1080 with a hero gradient background,
// big hero number, chest tiles, and watermark. All drawn natively (no DOM
// taint, no external dep) so toBlob works everywhere.
async function captureFarewellPng() {
  await waitForChests();
  const s = loadSessionStats();
  const sets = s.games * 5;
  const fmt = (n) => Number.isFinite(n) ? n.toLocaleString(undefined) : "—";
  const pct = (n, d) => d > 0 ? `${Math.round(n / d * 100)}%` : "";

  const W = 720, H = 1080;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // ── 1. Background: deep navy with two huge radial bursts + linear sheen.
  const baseGrad = ctx.createLinearGradient(0, 0, W, H);
  baseGrad.addColorStop(0, "#1a0b3a");
  baseGrad.addColorStop(0.55, "#2d1758");
  baseGrad.addColorStop(1, "#0f0820");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  // Purple burst, top-right.
  const burst1 = ctx.createRadialGradient(W * 0.85, H * 0.12, 0, W * 0.85, H * 0.12, 520);
  burst1.addColorStop(0, "rgba(196, 102, 255, 0.55)");
  burst1.addColorStop(1, "rgba(196, 102, 255, 0)");
  ctx.fillStyle = burst1;
  ctx.fillRect(0, 0, W, H);
  // Orange burst, bottom-left.
  const burst2 = ctx.createRadialGradient(W * 0.10, H * 0.95, 0, W * 0.10, H * 0.95, 560);
  burst2.addColorStop(0, "rgba(240, 138, 58, 0.45)");
  burst2.addColorStop(1, "rgba(240, 138, 58, 0)");
  ctx.fillStyle = burst2;
  ctx.fillRect(0, 0, W, H);
  // Top-left magenta highlight.
  const burst3 = ctx.createRadialGradient(W * 0.15, H * 0.20, 0, W * 0.15, H * 0.20, 380);
  burst3.addColorStop(0, "rgba(255, 90, 160, 0.32)");
  burst3.addColorStop(1, "rgba(255, 90, 160, 0)");
  ctx.fillStyle = burst3;
  ctx.fillRect(0, 0, W, H);

  // Light grain — small low-alpha dots for texture.
  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }
  ctx.restore();

  // ── 2. Header text.
  const PAD = 48;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Eyebrow
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "700 18px -apple-system, 'Segoe UI', Roboto, sans-serif";
  const eyebrow = t("farewellEyebrow").toUpperCase();
  drawSpaced(ctx, eyebrow, PAD, 80, 3);

  // Big title — two lines, vertically aligned.
  ctx.fillStyle = "#fff";
  ctx.font = "900 56px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(t("farewellHeroGameName"), PAD, 138);

  // Year accent
  const yearGrad = ctx.createLinearGradient(PAD, 180, PAD + 200, 220);
  yearGrad.addColorStop(0, "#f2c94c");
  yearGrad.addColorStop(1, "#f08a3a");
  ctx.fillStyle = yearGrad;
  ctx.fillText("2026 WRAPPED", PAD, 200);

  // ── 3. Hero bignum: sets farmed.
  // Large rounded card with the BIG number.
  const heroY = 270;
  const heroH = 230;
  drawRoundedRect(ctx, PAD, heroY, W - PAD * 2, heroH, 22);
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(242, 201, 76, 0.40)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Played-sets label near top of card.
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "700 14px -apple-system, 'Segoe UI', Roboto, sans-serif";
  drawSpaced(ctx, t("farewellPlayedSets").toUpperCase(), W / 2, heroY + 34, 2.5, "center");

  // The huge number, visually centered between the SITZUNG label (top) and
  // the SETS GEFARMT caption (bottom). textBaseline:"middle" centers the
  // em-box, but for digit-only strings the actual ink sits higher than the
  // em-center because there are no descenders. Use measureText's actual
  // bounding box to put the visual ink center exactly at the target.
  const setsStr = fmt(sets);
  ctx.font = "900 120px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(242, 201, 76, 0.55)";
  ctx.shadowBlur = 30;
  const numGrad = ctx.createLinearGradient(0, heroY + heroH / 2 - 60, 0, heroY + heroH / 2 + 60);
  numGrad.addColorStop(0, "#fff3b0");
  numGrad.addColorStop(1, "#f2c94c");
  ctx.fillStyle = numGrad;
  // Target visual centre: midway between the top label and the bottom caption.
  const numTargetY = (heroY + 34 + (heroY + heroH - 28)) / 2;
  const m = ctx.measureText(setsStr);
  const ascent = m.actualBoundingBoxAscent || 90;
  const descent = m.actualBoundingBoxDescent || 0;
  const baselineY = numTargetY + (ascent - descent) / 2;
  ctx.fillText(setsStr, W / 2, baselineY);
  ctx.shadowBlur = 0;
  ctx.textBaseline = "middle"; // restore for the rest of the painter

  // SETS GEFARMT caption near bottom of card.
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "700 16px -apple-system, 'Segoe UI', Roboto, sans-serif";
  drawSpaced(ctx, t("setsFarmed").toUpperCase(), W / 2, heroY + heroH - 28, 1.5, "center");

  // ── 4. Chest tiles — gold/silver/bronze row.
  const tileY = heroY + heroH + 30;
  const tileH = 170;
  const tileGap = 16;
  const tileW = (W - PAD * 2 - tileGap * 2) / 3;

  const chests = [
    { tier: "gold",   label: t("gold"),   val: s.gold * 5,   pctVal: pct(s.gold,   s.games), color: "#f2c94c", glow: "rgba(242, 201, 76, 0.45)" },
    { tier: "silver", label: t("silver"), val: s.silver * 5, pctVal: pct(s.silver, s.games), color: "#dde2ec", glow: "rgba(202, 211, 223, 0.45)" },
    { tier: "bronze", label: t("bronze"), val: s.bronze * 5, pctVal: pct(s.bronze, s.games), color: "#e09457", glow: "rgba(210, 138, 63, 0.45)" },
  ];

  for (let i = 0; i < chests.length; i++) {
    const c = chests[i];
    const tx = PAD + i * (tileW + tileGap);

    drawRoundedRect(ctx, tx, tileY, tileW, tileH, 18);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();
    // colored accent stroke
    const tileGrad = ctx.createLinearGradient(tx, tileY, tx, tileY + tileH);
    tileGrad.addColorStop(0, c.color + "80");
    tileGrad.addColorStop(1, c.color + "20");
    ctx.strokeStyle = tileGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = tx + tileW / 2;

    // Chest icon (top) — upscaled 64×64 from the 32×32 wiki source.
    const img = chestImgs[c.tier];
    if (img && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      const iconSize = 64;
      ctx.save();
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 14;
      ctx.drawImage(img, cx - iconSize / 2, tileY + 8, iconSize, iconSize);
      ctx.restore();
      ctx.imageSmoothingEnabled = true;
    }

    // Big value (middle) — chests earned (games × 5).
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 18;
    ctx.font = "900 42px -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = c.color;
    ctx.fillText(fmt(c.val), cx, tileY + 100);
    ctx.shadowBlur = 0;

    // Label
    ctx.font = "700 13px -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    drawSpaced(ctx, c.label.toUpperCase(), cx, tileY + 128, 1.5, "center");

    // pct (bottom)
    if (c.pctVal) {
      ctx.font = "400 12px -apple-system, 'Segoe UI', Roboto, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.fillText(c.pctVal, cx, tileY + 144);
    }
  }

  // ── 5. Games played row.
  const gamesY = tileY + tileH + 36;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "600 12px -apple-system, 'Segoe UI', Roboto, sans-serif";
  drawSpaced(ctx, t("games").toUpperCase(), W / 2, gamesY, 2, "center");
  ctx.fillStyle = "#fff";
  ctx.font = "800 38px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(fmt(s.games), W / 2, gamesY + 36);

  // ── 6. Global / community line at bottom.
  const globalY = gamesY + 86;
  if (Number.isFinite(globalCounts.games) && globalCounts.games > 0) {
    const globalH = 90;
    drawRoundedRect(ctx, PAD, globalY, W - PAD * 2, globalH, 16);
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fill();
    ctx.strokeStyle = "rgba(196, 102, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = "600 11px -apple-system, 'Segoe UI', Roboto, sans-serif";
    drawSpaced(ctx, t("globalAllTime").toUpperCase(), PAD + 22, globalY + 28, 1.8);

    ctx.fillStyle = "#e29bd9";
    ctx.font = "800 26px -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(fmt(globalCounts.games * 5), PAD + 22, globalY + 60);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = "400 12px -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(t("setsFarmed").toLowerCase(), W - PAD - 22, globalY + 60);
  }

  // ── 7. Footer / watermark.
  const footerY = H - 50;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.font = "600 13px -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("ctk-helper-jogoe", W / 2, footerY);
  ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
  ctx.font = "400 11px ui-monospace, 'SF Mono', Menlo, monospace";
  ctx.fillText("dominikloefflerniteo.github.io/ctk-helper-jogoe/ctk", W / 2, footerY + 22);

  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}

// Helpers used by the PNG painter.
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}
function drawSpaced(ctx, text, x, y, spacing, align = "left") {
  // Manual letter-spacing — measure each char, advance by width+spacing.
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cur = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  for (let i = 0; i < chars.length; i++) {
    ctx.textAlign = "left";
    ctx.fillText(chars[i], cur, y);
    cur += widths[i] + spacing;
  }
}

const farewellBtn = document.getElementById("farewellBtn");
if (farewellBtn) {
  farewellBtn.addEventListener("click", () => {
    populateFarewell();
    openModal("farewellModal");
  });
}
// Auto-open every page load — small defer so the page paints first.
setTimeout(() => {
  populateFarewell();
  openModal("farewellModal");
}, 300);

document.getElementById("farewellDownloadBtn")?.addEventListener("click", async () => {
  const blob = await captureFarewellPng();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ctk-event-stats.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.getElementById("farewellCopyBtn")?.addEventListener("click", async () => {
  try {
    const blob = await captureFarewellPng();
    if (!blob) throw new Error("no blob");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    showToast(t("farewellCopied"));
  } catch (e) {
    showToast(t("farewellCopyFailed"));
  }
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
// `globalCounts` is the latest fetched truth from abacus.
// `displayedCounts` is what's shown — it lags `globalCounts` and rises in
// random ticks toward it, so the user sees a steady, lottery-style climb
// instead of a jump every 20s.
const globalCounts = { games: null, gold: null, silver: null, bronze: null };
const displayedCounts = { games: null, gold: null, silver: null, bronze: null };
const pendingIncrements = { games: [], gold: [], silver: [], bronze: [] };
const ANIMATION_WINDOW_MS = 5_000;

// Rolling history of {t, games} samples used to compute games/hour. Tracks the
// REAL fetched values (not the animated display) so the rate reflects truth.
const GLOBAL_HISTORY_MS = 30 * 60 * 1000;
const globalGamesHistory = [];
function pushGlobalSample() {
  if (!Number.isFinite(globalCounts.games)) return;
  const now = Date.now();
  globalGamesHistory.push({ t: now, games: globalCounts.games });
  while (globalGamesHistory.length > 0 && now - globalGamesHistory[0].t > GLOBAL_HISTORY_MS) {
    globalGamesHistory.shift();
  }
}

// When a fresh fetch arrives, schedule a random tick timestamp for each unit
// delta within the next animation window. The 1s render tick advances the
// displayed value past whichever timestamps have elapsed.
function scheduleAnimations() {
  const now = Date.now();
  for (const k of GLOBAL_KEYS) {
    const target = globalCounts[k];
    if (target == null) continue;
    if (displayedCounts[k] == null) {
      // First fetch — snap, no animation. Otherwise the page would slowly
      // count up from 0 on every reload, which is just confusing.
      displayedCounts[k] = target;
      pendingIncrements[k] = [];
      continue;
    }
    const delta = target - displayedCounts[k] - pendingIncrements[k].length;
    if (delta <= 0) continue;
    const schedule = [];
    for (let i = 0; i < delta; i++) schedule.push(now + Math.random() * ANIMATION_WINDOW_MS);
    schedule.sort((a, b) => a - b);
    pendingIncrements[k].push(...schedule);
    pendingIncrements[k].sort((a, b) => a - b);
  }
}

// Advance displayedCounts past every scheduled tick that's now in the past.
function tickAnimations() {
  const now = Date.now();
  for (const k of GLOBAL_KEYS) {
    const sched = pendingIncrements[k];
    while (sched.length > 0 && sched[0] <= now) {
      sched.shift();
      displayedCounts[k] = (displayedCounts[k] ?? 0) + 1;
    }
  }
}

function renderGlobalStats() {
  const d = displayedCounts;
  const fmt = (v) => v == null ? "…" : String(v);
  els.globalGames.textContent = fmt(d.games);
  els.globalGold.textContent = fmt(d.gold);
  els.globalSilver.textContent = fmt(d.silver);
  els.globalBronze.textContent = fmt(d.bronze);
  const pct = (n) => (d.games && n != null ? `(${Math.round((n / d.games) * 100)}%)` : "");
  els.globalPctGold.textContent = pct(d.gold);
  els.globalPctSilver.textContent = pct(d.silver);
  els.globalPctBronze.textContent = pct(d.bronze);
  if (els.globalRate && globalGamesHistory.length >= 2) {
    const oldest = globalGamesHistory[0];
    const newest = globalGamesHistory[globalGamesHistory.length - 1];
    els.globalRate.textContent = formatRate(newest.games - oldest.games, newest.t - oldest.t);
  } else if (els.globalRate) {
    els.globalRate.textContent = "";
  }
}
// Earliest allowed time for the next poll. Bumped forward when abacus tells
// us we're near (or over) the rate-limit ceiling via response headers.
let nextPollAt = 0;
function consumeRateLimitHeaders(r) {
  const remaining = parseInt(r.headers.get("RateLimit-Remaining") ?? "", 10);
  // Only stall if we're about to hit zero. Below 4 → wait until the window
  // resets. Above that, normal cadence.
  if (Number.isFinite(remaining) && remaining < 4) {
    const reset = parseInt(r.headers.get("RateLimit-Reset") ?? "", 10);
    if (Number.isFinite(reset)) nextPollAt = Math.max(nextPollAt, reset * 1000);
  }
  if (r.status === 429) {
    const retryAfterMs = parseInt(r.headers.get("Retry-After") ?? "10000", 10);
    nextPollAt = Math.max(nextPollAt, Date.now() + (Number.isFinite(retryAfterMs) ? retryAfterMs : 10_000));
  }
}
async function fetchGlobalCount(key) {
  try {
    const r = await fetch(`${LIKE_BASE}/get/${LIKE_NS}/${key}`);
    consumeRateLimitHeaders(r);
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
  pushGlobalSample();
  scheduleAnimations();
  renderGlobalStats();
}
async function hitGlobal(key) {
  try {
    const r = await fetch(`${LIKE_BASE}/hit/${LIKE_NS}/${key}`);
    consumeRateLimitHeaders(r);
    if (!r.ok) return;
    const data = await r.json();
    if (Number.isFinite(data.value)) {
      globalCounts[key] = data.value;
      // Local hit — snap immediately so the user sees their own action reflected
      // in the panel without waiting for the next animation tick.
      displayedCounts[key] = data.value;
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
// Network polling: every 5s steady state (4 GETs / 5s = 8 per 10s window;
// abacus's limit is 30 per 10s per IP, comfortable headroom for bursts).
// Recursive setTimeout instead of setInterval so we can defer the next poll
// when the response headers tell us we're approaching the rate-limit window.
const GLOBAL_POLL_MS = 5_000;
function schedulePoll() {
  const wait = Math.max(GLOBAL_POLL_MS, nextPollAt - Date.now());
  setTimeout(async () => {
    if (document.visibilityState === "visible") {
      await fetchAllGlobalCounts();
    }
    schedulePoll();
  }, wait);
}
fetchAllGlobalCounts();
schedulePoll();
// UI re-render: every 1s. Local-only — advances scheduled global-counter
// animation ticks and re-renders both panels so the games/hour reading and
// the lottery-style global counters keep pace with wall-clock time.
setInterval(() => {
  if (document.visibilityState !== "visible") return;
  tickAnimations();
  renderSessionStats();
  renderGlobalStats();
}, 1000);

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
let lastGameOver = false;

// Session stats persist across reloads via localStorage so refreshing the
// page doesn't wipe out a streak.
const SESSION_KEY = "ctk-session-stats-v1";
const SESSION_STARTED_KEY = "ctk-session-started-v1";

// Format a games-per-hour rate. Returns "" until enough time/data has
// accumulated for a meaningful number — small samples produce wild rates.
function formatRate(games, elapsedMs) {
  if (!games || !elapsedMs || elapsedMs < 60_000) return "";
  const perHour = games / (elapsedMs / 3_600_000);
  if (!Number.isFinite(perHour)) return "";
  return perHour >= 10 ? `(${perHour.toFixed(0)}/hr)` : `(${perHour.toFixed(1)}/hr)`;
}

function getSessionStart() {
  const raw = localStorage.getItem(SESSION_STARTED_KEY);
  return raw ? Number(raw) : 0;
}
function setSessionStart(ts) {
  try { localStorage.setItem(SESSION_STARTED_KEY, String(ts)); } catch (e) { /* ignored */ }
}
function clearSessionStart() {
  try { localStorage.removeItem(SESSION_STARTED_KEY); } catch (e) { /* ignored */ }
}

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
  if (els.sessionRate) {
    const start = getSessionStart();
    els.sessionRate.textContent = start ? formatRate(s.games, Date.now() - start) : "";
  }
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
  // Stamp the session-start timestamp on the first completed game so the
  // games/hour rate is anchored to actual play, not page-open time.
  if (s.games === 1 && !getSessionStart()) setSessionStart(Date.now());
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
  if (s.games === 1 && !getSessionStart()) setSessionStart(Date.now());
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
// Off-main-thread compute via Web Worker so UI clicks stay responsive
// while the rollout runs (it can take 1-2s in late-game states). A
// monotonic job id discards stale results when the user keeps acting
// quickly. We terminate any in-flight worker on each new request so
// rapid clicks don't queue up wasted CPU work.
let goldJob = 0;
let goldWorker = null;
function spawnGoldWorker() {
  const w = new Worker(new URL("./gold-worker.js", import.meta.url), { type: "module" });
  w.onmessage = (e) => {
    const { jobId, result, error } = e.data;
    if (jobId !== goldJob) return; // stale — user has moved on
    if (error) { console.error("gold worker:", error); return; }
    const r = result;
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
  };
  w.onerror = (e) => console.error("gold worker error:", e.message);
  return w;
}

// Fresh-game shortcut: at handIndex=0 with no reveals, every random board
// gives the same expected gold rate (the solver's measured 44.8% over 100k
// games). Showing the live PIMC value here would just sample noise around
// that constant — pin to the headline number until the player makes a move.
const FRESH_GAME_GOLD_PCT = 44.8;
function isFreshGame() {
  if (state.handIndex !== 0) return false;
  for (const c of state.cells) if (c.state !== "hidden") return false;
  return true;
}

function queueGoldChanceUpdate(suggestion) {
  const jobId = ++goldJob;
  if (isFreshGame()) {
    els.gameGoldPct.textContent = FRESH_GAME_GOLD_PCT + "%";
    els.gameGoldPct.classList.remove("cold", "hot", "locked");
    els.gameGoldPct.classList.add("warm");
    els.gameGoldNote.textContent = t("acrossRounds");
    if (goldWorker) { goldWorker.terminate(); goldWorker = null; }
    return;
  }
  // Search-derived shortcut: when the late-game expectimax search has run
  // and produced an exact P(gold), trust it over PIMC. The search evaluates
  // the full subgame tree under optimal play, while PIMC's heuristic
  // playout (run with skipSearch:true to keep rollouts cheap) can't always
  // find the optimal sequence — it's the difference between "is gold
  // achievable from here?" and "does the bare heuristic reach gold?".
  // Skip when search bailed (exhausted budget) since its answer is then a
  // truncated estimate, not exact.
  if (
    suggestion && suggestion.pGold != null && !suggestion.searchExhausted
    && (suggestion.pGold >= 0.999 || suggestion.pGold <= 0.001)
  ) {
    const pGold = suggestion.pGold;
    els.gameGoldPct.textContent = Math.round(pGold * 100) + "%";
    els.gameGoldPct.classList.toggle("hot",  pGold >= 0.6);
    els.gameGoldPct.classList.toggle("warm", pGold >= 0.3 && pGold < 0.6);
    els.gameGoldPct.classList.toggle("cold", pGold < 0.3);
    els.gameGoldPct.classList.toggle("locked", pGold >= 0.999);
    els.gameGoldNote.textContent = `exact search (${Math.round(suggestion.eScore ?? 0)} pts)`;
    if (!goldRainFired && pGold >= 0.999) {
      goldRainFired = true;
      triggerGoldRain();
    }
    if (goldWorker) { goldWorker.terminate(); goldWorker = null; }
    return;
  }
  els.gameGoldPct.textContent = "…";
  els.gameGoldPct.classList.remove("cold", "warm", "hot");
  els.gameGoldNote.textContent = t("goldChanceComputing");
  // Terminate any in-flight job so rapid clicks don't pile up. Worker
  // creation is fast (~10-20 ms) and saves us seconds of stale rollout.
  if (goldWorker) goldWorker.terminate();
  goldWorker = spawnGoldWorker();
  // structuredClone runs on postMessage; pass the live state object and
  // let the worker boundary serialise it. Sets/Maps survive intact.
  goldWorker.postMessage({ jobId, state });
}

// ---------- solver / refresh ----------
function computeSuggestion() {
  if (isGameOver(state)) return null;
  return suggestMove(state);
}

function refresh() {
  const suggestion = computeSuggestion();
  updateBoard(boardEl, state, suggestion);
  updateSidebar(els, state, suggestion);
  els.undoBtn.disabled = state.history.length === 0;
  trackGameCompletion();
  queueGoldChanceUpdate(suggestion);
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
      return;
    }
    // Hidden cell — if its value is fully determined by the constraint
    // network (P=1 for some value, e.g. a deduced must-be-5), accept the
    // click as that reveal so the user doesn't have to hover-and-press a
    // key for a forced fill. Cells with any uncertainty stay click-inert.
    if (cell.state === "hidden") {
      const dist = cellValueDistribution(state).get(idx);
      if (!dist) return;
      let bestV = null;
      let bestP = 0;
      for (const v of VALUES) {
        const p = dist[v] ?? 0;
        if (p > bestP) { bestP = p; bestV = v; }
      }
      if (bestV && bestP >= 0.999 && (state.remaining[bestV] ?? 0) > 0) {
        recordReveal(state, idx, bestV, effectiveFlashed(idx, false));
        refresh();
      }
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
    triggerReset();
  },
});

// Reset with an 8-second undo window. Hitting Reset stashes the prior state
// and defers the abandoned-game flush; if the user clicks "Undo reset" within
// the window we restore the snapshot. Otherwise we commit the flush so stats
// stay accurate.
const RESET_UNDO_MS = 8000;
let resetSnapshot = null;
let resetCommitTimer = 0;
let resetUndoBtn = null;
function commitPendingReset() {
  if (!resetSnapshot) return;
  const snap = resetSnapshot;
  resetSnapshot = null;
  // Restore enough state to flush the abandoned game from its real position.
  const live = state;
  const liveLastGameOver = lastGameOver;
  state = snap.state;
  lastGameOver = snap.lastGameOver;
  flushAbandonedGame();
  state = live;
  lastGameOver = liveLastGameOver;
  hideResetUndo();
}
function hideResetUndo() {
  if (resetCommitTimer) { clearTimeout(resetCommitTimer); resetCommitTimer = 0; }
  if (resetUndoBtn && resetUndoBtn.parentNode) resetUndoBtn.parentNode.removeChild(resetUndoBtn);
  resetUndoBtn = null;
  els.resetBtn.style.display = "";
}
function showResetUndo() {
  hideResetUndo();
  resetUndoBtn = document.createElement("button");
  resetUndoBtn.type = "button";
  resetUndoBtn.className = "reset-btn reset-undo-btn";
  resetUndoBtn.textContent = t("undoReset");
  resetUndoBtn.title = t("undoResetTitle");
  resetUndoBtn.addEventListener("click", () => {
    if (!resetSnapshot) return;
    state = resetSnapshot.state;
    lastGameOver = resetSnapshot.lastGameOver;
    goldRainFired = resetSnapshot.goldRainFired;
    resetSnapshot = null;
    hideResetUndo();
    refresh();
  });
  // Replace the Reset button in place — same slot, no layout shift.
  els.resetBtn.parentNode.insertBefore(resetUndoBtn, els.resetBtn);
  els.resetBtn.style.display = "none";
  resetCommitTimer = setTimeout(commitPendingReset, RESET_UNDO_MS);
}
function triggerReset() {
  // If a previous reset is still pending, commit it before starting a new one.
  if (resetSnapshot) commitPendingReset();
  resetSnapshot = { state, lastGameOver, goldRainFired };
  state = createState();
  lastGameOver = false;
  goldRainFired = false;
  refresh();
  showResetUndo();
}
els.resetBtn.addEventListener("click", triggerReset);

els.undoBtn.addEventListener("click", () => {
  undo(state);
  refresh();
});

els.sessionResetBtn.addEventListener("click", () => {
  saveSessionStats({ games: 0, gold: 0, silver: 0, bronze: 0 });
  clearSessionStart();
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
