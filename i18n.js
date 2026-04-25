// Lightweight i18n. Static HTML strings get tagged with `data-i18n` or
// `data-i18n-html` and are swapped in by applyToDOM(); dynamic strings from
// ui.js / solver.js go through t(key, params). Safe to import from Node —
// DOM/localStorage access is guarded.

const STRINGS = {
  en: {
    // ----- left panel: solver chest rate -----
    solverChestRate: "Solver's chest rate",
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    acrossRounds: "across 100,000 rounds",
    // ----- left panel: session -----
    session: "Session",
    globalAllTime: "Everyone (all time)",
    games: "Games",
    reset: "Reset",
    // ----- disclaimer / help -----
    disclaimerFull:
      "<strong>Work in progress.</strong> The suggestions get noticeably less " +
      "reliable toward the end of the game, especially once only a few cells " +
      "remain and the solver has to weigh multiple overlapping constraints. " +
      "Trust your own read in the late game. When blindly following the " +
      "suggestions, see the chest rates on the left table.",
    helpIntro: "<strong>Hover</strong> a cell and press a key:",
    helpReveal: "<kbd>1</kbd>&ndash;<kbd>5</kbd>, <kbd>K</kbd> or <kbd>6</kbd> &mdash; revealed value, <em>no flash</em> (neighbors safe)",
    helpShift: "<kbd>Shift</kbd> + value &mdash; revealed value <em>with flash</em> (a 5 is adjacent)",
    helpClick: "<strong>Click</strong> a dim (unscored) cell &mdash; catch it with the current hand card",
    helpBackspace: "<kbd>Backspace</kbd> &mdash; undo last action",
    helpEsc: "<kbd>Esc</kbd> &mdash; reset game",
    // ----- right panel -----
    currentCard: "Current card",
    score: "Score",
    target550: "target 550",
    remainingOnBoard: "Remaining on board",
    suggestion: "Suggestion",
    undo: "Undo",
    goldChance: "Gold chance (this game)",
    goldChanceComputing: "computing…",
    goldChanceNote: ({ samples }) => `${samples} heuristic rollouts`,
    goldChanceFinal: ({ score }) => `final score ${score}`,
    valueExhausted: ({ value, total }) => `Already revealed all ${total} ${value}s — can't add more.`,
    openingReason: "Opener — spread-out dominating pattern (saves centre for later)",
    likePrompt: "Enjoying the helper? Drop a like —",
    twitchChat: "Chat",
    // ----- footer -----
    footerText: "Clean-room helper for Metin2 · Schnapp den König",
    // ----- ui.js dynamic -----
    deckExhausted: "Deck exhausted.",
    hintKingClick: "Click your K card on the revealed King to score 100.",
    hintKingFlip: "Catch the King in exactly one flip.",
    hintFive: "Avoid cells with 5-neighbors (would catch you).",
    hintGeneric: "Lowest remaining card is played automatically.",
    nothingToSuggest: "Nothing to suggest.",
    suggestionTryHtml: ({ cell, reason }) => `Try <strong>${cell}</strong> &mdash; ${reason}`,
    gameOverGold: ({ score }) => `Game over. Final score ${score}. Target reached!`,
    gameOverOther: ({ score }) => `Game over. Final score ${score}.`,
    ceilingText: ({ ceiling, left }) => `ceiling ${ceiling} (+${left} left)`,
    // ----- solver.js dynamic -----
    catchSameValueReason: ({ value, points }) => `Catch the revealed ${value} for +${points} (ends turn)`,
    catchChainReason: ({ value, points }) => `Catch the revealed ${value} for +${points} (chain)`,
    clickKKingReason: "Click your K card on this King cell for +100",
    kingHereReason: ({ bingoBonus }) => `King is here — catch for +100${bingoBonus ? ` (+bingo ${bingoBonus})` : ""}`,
    pKingReason: ({ pct, bingoBonus }) => `P(King here) = ${pct}%${bingoBonus ? ` (+bingo ${bingoBonus})` : ""}`,
    reservedReason: ({ lost }) => `reserved for 5-turn (would lose ${lost} pts)`,
    evReason: ({ ev }) => `E[points] ≈ ${ev}`,
    chainReason: ({ pct }) => `chain ${pct}%`,
    infoReason: ({ bonus }) => `info +${bonus}`,
    bingoReason: ({ bonus }) => `+${bonus} bingo`,
    catchRiskReason: ({ pct }) => `catch risk ${pct}%`,
    kHuntReason: ({ bonus }) => `K-hunt +${bonus}`,
  },

  de: {
    // ----- Linkes Panel: Truhenrate -----
    solverChestRate: "Truhenrate des Solvers",
    gold: "Gold",
    silver: "Silber",
    bronze: "Bronze",
    acrossRounds: "über 100.000 Runden",
    // ----- Linkes Panel: Sitzung -----
    session: "Sitzung",
    globalAllTime: "Alle (gesamt)",
    games: "Spiele",
    reset: "Zurücksetzen",
    // ----- Hinweis / Hilfe -----
    disclaimerFull:
      "<strong>In Arbeit.</strong> Die Vorschläge werden gegen Ende des " +
      "Spiels merklich unzuverlässiger, besonders wenn nur noch wenige " +
      "Felder übrig sind und der Solver mehrere überlappende " +
      "Einschränkungen abwägen muss. Vertrau im späten Spiel " +
      "deinem eigenen Urteil. Wer den Vorschlägen blind folgt: siehe die " +
      "Truhenraten in der Tabelle links.",
    helpIntro: "<strong>Zeige</strong> auf ein Feld und drücke eine Taste:",
    helpReveal: "<kbd>1</kbd>&ndash;<kbd>5</kbd>, <kbd>K</kbd> oder <kbd>6</kbd> &mdash; aufgedeckter Wert, <em>kein Blinken</em> (Nachbarn sicher)",
    helpShift: "<kbd>Shift</kbd> + Wert &mdash; aufgedeckter Wert <em>mit Blinken</em> (eine 5 ist benachbart)",
    helpClick: "<strong>Klick</strong> auf ein gedämpftes (nicht gewertetes) Feld &mdash; mit der aktuellen Handkarte einfangen",
    helpBackspace: "<kbd>Backspace</kbd> &mdash; letzte Aktion rückgängig",
    helpEsc: "<kbd>Esc</kbd> &mdash; Spiel zurücksetzen",
    // ----- Rechtes Panel -----
    currentCard: "Aktuelle Karte",
    score: "Punkte",
    target550: "Ziel 550",
    remainingOnBoard: "Verbleibend auf dem Feld",
    suggestion: "Vorschlag",
    undo: "Rückgängig",
    goldChance: "Gold-Chance (diese Runde)",
    goldChanceComputing: "berechne…",
    goldChanceNote: ({ samples }) => `${samples} Heuristik-Rollouts`,
    goldChanceFinal: ({ score }) => `Endstand ${score}`,
    valueExhausted: ({ value, total }) => `Bereits alle ${total} ${value}er aufgedeckt — keine weiteren möglich.`,
    openingReason: "Eröffnung — verteiltes Dominanzmuster (Mitte bleibt für später)",
    likePrompt: "Gefällt dir der Helfer? Lass ein Like da —",
    twitchChat: "Chat",
    // ----- Fußzeile -----
    footerText: "Clean-Room-Helfer für Metin2 · Schnapp den König",
    // ----- ui.js dynamisch -----
    deckExhausted: "Stapel aufgebraucht.",
    hintKingClick: "Klicke deine K-Karte auf den sichtbaren König für 100 Punkte.",
    hintKingFlip: "Fang den König mit genau einem Flip.",
    hintFive: "Meide Felder mit 5er-Nachbarn (würdest gefangen werden).",
    hintGeneric: "Die niedrigste verbleibende Karte wird automatisch gespielt.",
    nothingToSuggest: "Kein Vorschlag.",
    suggestionTryHtml: ({ cell, reason }) => `Versuch <strong>${cell}</strong> &mdash; ${reason}`,
    gameOverGold: ({ score }) => `Spiel vorbei. Endstand ${score}. Ziel erreicht!`,
    gameOverOther: ({ score }) => `Spiel vorbei. Endstand ${score}.`,
    ceilingText: ({ ceiling, left }) => `Max ${ceiling} (+${left} möglich)`,
    // ----- solver.js dynamisch -----
    catchSameValueReason: ({ value, points }) => `Fange die sichtbare ${value} für +${points} (Runde endet)`,
    catchChainReason: ({ value, points }) => `Fange die sichtbare ${value} für +${points} (Kette)`,
    clickKKingReason: "Klicke deine K-Karte auf dieses Königsfeld für +100",
    kingHereReason: ({ bingoBonus }) => `König ist hier — fangen für +100${bingoBonus ? ` (+Bingo ${bingoBonus})` : ""}`,
    pKingReason: ({ pct, bingoBonus }) => `P(König hier) = ${pct}%${bingoBonus ? ` (+Bingo ${bingoBonus})` : ""}`,
    reservedReason: ({ lost }) => `reserviert für 5er-Runde (verliert ${lost} Punkte)`,
    evReason: ({ ev }) => `E[Punkte] ≈ ${ev}`,
    chainReason: ({ pct }) => `Kette ${pct}%`,
    infoReason: ({ bonus }) => `Info +${bonus}`,
    bingoReason: ({ bonus }) => `+${bonus} Bingo`,
    catchRiskReason: ({ pct }) => `Fangrisiko ${pct}%`,
    kHuntReason: ({ bonus }) => `K-Jagd +${bonus}`,
  },
};

const STORAGE_KEY = "ctk-lang-v1";
const listeners = new Set();

function detectInitial() {
  if (typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && STRINGS[saved]) return saved;
    } catch (e) { /* incognito / disabled */ }
  }
  if (typeof navigator !== "undefined") {
    const browser = (navigator.language || "en").toLowerCase();
    if (browser.startsWith("de")) return "de";
  }
  return "en";
}

let currentLang = detectInitial();

export function getLang() { return currentLang; }

export function setLang(lang) {
  if (!STRINGS[lang] || lang === currentLang) return;
  currentLang = lang;
  if (typeof localStorage !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignored */ }
  }
  applyToDOM();
  for (const fn of listeners) fn(lang);
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key, params) {
  const entry = STRINGS[currentLang][key] ?? STRINGS.en[key] ?? key;
  if (typeof entry === "function") return entry(params ?? {});
  return entry;
}

export function applyToDOM(root) {
  if (typeof document === "undefined") return;
  const r = root ?? document;
  r.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  r.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
}
