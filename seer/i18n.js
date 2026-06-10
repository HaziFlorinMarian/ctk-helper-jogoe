// Lightweight i18n for the Seer helper (mirrors ctk/i18n.js).
// Static HTML carries data-i18n / data-i18n-html; dynamic strings go through
// t(key, params). DOM/localStorage access is guarded so it's import-safe.

const STRINGS = {
  en: {
    subtitle: "Seherwettstreit move suggester",
    pageIntro:
      "Free helper for the Metin2 card event <strong>Seherwettstreit</strong> (Duel of the Seers). " +
      "Tell it who plays first; if the computer leads it tracks the hidden cards and tells you exactly " +
      "which card to play.",
    you: "You",
    opponent: "Opponent",
    margin: "Margin",
    round: "Round",
    score: "Score",
    oppCardsLeft: "Opponent's cards left",
    black: "Black",
    white: "White",
    footer: "Clean-room helper for Metin2 · Seherwettstreit",
    allHelpers: "All helpers",
    modelNote: "Model: the computer plays a random card order; the helper maximises your expected margin (wins − losses).",

    // help block
    helpIntro: "How to use it:",
    helpLeader: "<strong>Pick who starts</strong> once — it's fixed for the whole game.",
    helpColour: "If the computer leads, tap the <strong>colour</strong> you see, play the suggested card, then record the result.",
    helpResult: "<kbd>B</kbd>/<kbd>W</kbd> set colour, <kbd>1</kbd>/<kbd>0</kbd>/<kbd>2</kbd> = won/equal/lost, <kbd>Backspace</kbd> undo, <kbd>Esc</kbd> new game.",

    // chat + support
    twitchChat: "Chat",
    twitchConsentBody: "<b>Loading the Twitch chat sends your IP and cookies to Twitch.</b> By clicking below you consent to that connection (revocable in the privacy policy).",
    twitchConsentBtn: "Load Twitch chat",
    twitchConsentRevoked: "Twitch-chat consent revoked. Reload to apply.",
    revokeTwitchConsent: "Revoke Twitch-chat consent",
    likePrompt: "Enjoying the helper? Drop a like!",
    supportText:
      "<strong>This helper will never have ads.</strong> If you want to support the project, you can donate on " +
      "<a href='https://paypal.me/jogoe' target='_blank' rel='noopener'>PayPal</a> &mdash; every bit truly means a lot. Thank you! &lt;3",

    // footer / legal
    impressum: "Imprint",
    privacy: "Privacy",
    impressumTitle: "Imprint",
    impressumBody:
      "<p>Information per §5 TMG / §18 MStV:</p>" +
      "<p><b>Dominik Löffler</b><br>Roseggerstraße 21<br>4020 Linz<br>Österreich</p>" +
      "<p>Contact: discord <code>@jogoe</code></p>" +
      "<p>Responsible for content per §18 (2) MStV: same as above.</p>" +
      "<p><i>Disclaimer:</i> Despite careful editorial control, no liability is accepted for the content of external links.</p>",
    datenschutzTitle: "Privacy policy",
    datenschutzBody:
      "<p><b>1. Controller</b><br>See Imprint.</p>" +
      "<p><b>2. Hosting (GitHub Pages)</b><br>This site is hosted on GitHub Pages (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA). GitHub processes visitors' IP addresses in server logs. " +
        "Privacy statement: <a href='https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement' target='_blank' rel='noopener'>docs.github.com</a>.</p>" +
      "<p><b>3. Local storage</b><br>Stored only in your browser, never sent to us: language preference, like state, Twitch-chat consent flag, chat-hidden preference.</p>" +
      "<p><b>4. Public counters (abacus.jasoncameron.dev)</b><br>For the like button and the page-open counter, the page sends HTTP requests to a free public counter service. The provider may process IP addresses while serving these requests. Legal basis: legitimate interest (Art. 6 (1) lit. f GDPR).</p>" +
      "<p><b>5. Twitch chat</b><br>The Twitch-chat embed loads only after you explicitly click the consent button. Once loaded, Twitch (Twitch Interactive Inc., 350 Bush Street, San Francisco, CA 94104, USA) processes your IP address and may set cookies. " +
        "Twitch privacy notice: <a href='https://www.twitch.tv/p/legal/privacy-notice/' target='_blank' rel='noopener'>twitch.tv/p/legal/privacy-notice</a>. Legal basis: your explicit consent (Art. 6 (1) lit. a GDPR), revocable any time below.</p>",

    // leader pick
    whoFirst: "Who plays first this game?",
    iStart: "I start",
    iStartSub: "I place my card first",
    pcStart: "Computer starts",
    pcStartSub: "I see its colour, then answer",
    leaderNote: "Fixed for the whole game — pick whoever placed the very first card.",

    // I-start branch
    meTitle: "You go first — just play 0 → 8 in order",
    meBody:
      "When you commit before seeing the computer's card, <strong>every play order has the exact same " +
      "expected result</strong> (proven over 100,000 simulated games: ~38.5% win either way). So don't " +
      "overthink it — click 0, 1, 2 … 8 and save your energy.",
    meSeqHint: "Tap each card as you play it — purely to keep your place.",
    newGame: "New game",
    reset: "Reset",
    meDone: "All 9 played — good luck! 🍀",

    // computer-leads branch
    colourQ: "What colour is the computer's card?",
    blackSub: "even · 0 2 4 6 8",
    whiteSub: "odd · 1 3 5 7",
    playThis: "Play this card",
    resultQ: "Did your card win?",
    won: "Won",
    wonSub: "mine higher",
    equal: "Equal",
    equalSub: "same number",
    lost: "Lost",
    lostSub: "mine lower",
    undo: "Undo",

    // stats panel
    statsTitle: "Does the helper actually help?",
    statsLead:
      "Measured over <strong>100,000 simulated duels</strong> (computer plays a random card order). " +
      "Coins = 1 per round you win, plus the point difference as a bonus when you win the duel.",
    scPcTag: "🤖 Computer starts",
    scPcSub: "duels won with the helper",
    scPcCmp: "vs 39% guessing · ≈ 5.2 coins/game (+0.6)",
    scMeTag: "🫵 You start",
    scMeSub: "helper = clicking blindly",
    scMeCmp: "order is mathematically irrelevant — don't overthink it",
    scMixTag: "🎲 50 / 50 mix",
    scMixSub: "duels won with the helper",
    scMixCmp: "vs 39% guessing · ≈ 4.9 coins/game (+0.3)",
    realCase: "★ what actually happens in-game",
    statsFoot:
      "Bottom line: the helper's edge is entirely in the rounds where the computer leads and you can " +
      "react to its colour. When you lead, no tool can beat a coin flip — so it just says \"play in order\".",

    // dynamic
    recMeta: ({ colour }) => `computer showed ${colour}`,
    overText: ({ m, coins, cls }) =>
      `Final margin <span class="${cls}">${m}</span> · <strong>${coins}</strong> coins`,
    recordedRound: ({ n }) => `Round ${n} saved.`,
    finalCoins: ({ coins, m }) => `Done — ${coins} coins (margin ${m})`,
  },
  de: {
    subtitle: "Seherwettstreit Zug-Vorschläge",
    pageIntro:
      "Kostenloser Helfer für das Metin2 Kartenspiel-Event <strong>Seherwettstreit</strong>. " +
      "Sag ihm, wer beginnt; wenn der Computer beginnt, verfolgt er die verdeckten Karten und sagt dir " +
      "genau, welche Karte du spielen sollst.",
    you: "Du",
    opponent: "Gegner",
    margin: "Vorsprung",
    round: "Runde",
    score: "Punkte",
    oppCardsLeft: "Verbleibende Gegnerkarten",
    black: "Schwarz",
    white: "Weiß",
    allHelpers: "Alle Helfer",
    modelNote: "Modell: Der Computer spielt eine zufällige Reihenfolge; der Helfer maximiert deinen erwarteten Vorsprung (Siege − Niederlagen).",

    helpIntro: "So benutzt du ihn:",
    helpLeader: "<strong>Wähle einmal, wer beginnt</strong> — gilt für das ganze Spiel.",
    helpColour: "Beginnt der Computer, tippe die <strong>Farbe</strong>, die du siehst, spiel die vorgeschlagene Karte und trage das Ergebnis ein.",
    helpResult: "<kbd>B</kbd>/<kbd>W</kbd> Farbe, <kbd>1</kbd>/<kbd>0</kbd>/<kbd>2</kbd> = gewonnen/gleich/verloren, <kbd>Backspace</kbd> zurück, <kbd>Esc</kbd> neues Spiel.",

    twitchChat: "Chat",
    twitchConsentBody: "<b>Das Laden des Twitch-Chats sendet deine IP und Cookies an Twitch.</b> Mit dem Klick unten stimmst du dieser Verbindung zu (in der Datenschutzerklärung widerrufbar).",
    twitchConsentBtn: "Twitch-Chat laden",
    twitchConsentRevoked: "Twitch-Chat-Einwilligung widerrufen. Zum Anwenden neu laden.",
    revokeTwitchConsent: "Twitch-Chat-Einwilligung widerrufen",
    likePrompt: "Gefällt dir der Helfer? Lass ein Like da!",
    supportText:
      "<strong>Dieser Helfer wird nie Werbung haben.</strong> Wenn du das Projekt unterstützen möchtest, kannst du auf " +
      "<a href='https://paypal.me/jogoe' target='_blank' rel='noopener'>PayPal</a> spenden &mdash; jeder Beitrag bedeutet mir viel. Danke! &lt;3",

    impressum: "Impressum",
    privacy: "Datenschutz",
    impressumTitle: "Impressum",
    impressumBody:
      "<p>Angaben gemäß §5 TMG / §18 MStV:</p>" +
      "<p><b>Dominik Löffler</b><br>Roseggerstraße 21<br>4020 Linz<br>Österreich</p>" +
      "<p>Kontakt: discord <code>@jogoe</code></p>" +
      "<p>Verantwortlich für den Inhalt nach §18 (2) MStV: wie oben.</p>" +
      "<p><i>Haftungsausschluss:</i> Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links.</p>",
    datenschutzTitle: "Datenschutzerklärung",
    datenschutzBody:
      "<p><b>1. Verantwortlicher</b><br>Siehe Impressum.</p>" +
      "<p><b>2. Hosting (GitHub Pages)</b><br>Diese Seite wird über GitHub Pages gehostet (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA). GitHub verarbeitet IP-Adressen der Besucher in Server-Logs. " +
        "Datenschutzerklärung: <a href='https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement' target='_blank' rel='noopener'>docs.github.com</a>.</p>" +
      "<p><b>3. Lokale Speicherung</b><br>Nur in deinem Browser gespeichert, nie an uns gesendet: Sprachwahl, Like-Status, Twitch-Chat-Einwilligung, Chat-ausgeblendet-Einstellung.</p>" +
      "<p><b>4. Öffentliche Zähler (abacus.jasoncameron.dev)</b><br>Für den Like-Button und den Seitenaufruf-Zähler sendet die Seite HTTP-Anfragen an einen kostenlosen öffentlichen Zählerdienst. Der Anbieter kann dabei IP-Adressen verarbeiten. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).</p>" +
      "<p><b>5. Twitch-Chat</b><br>Das Twitch-Chat-Embed wird erst geladen, nachdem du ausdrücklich auf den Einwilligungs-Button geklickt hast. Danach verarbeitet Twitch (Twitch Interactive Inc., 350 Bush Street, San Francisco, CA 94104, USA) deine IP-Adresse und kann Cookies setzen. " +
        "Twitch-Datenschutz: <a href='https://www.twitch.tv/p/legal/privacy-notice/' target='_blank' rel='noopener'>twitch.tv/p/legal/privacy-notice</a>. Rechtsgrundlage: deine ausdrückliche Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), jederzeit unten widerrufbar.</p>",
    footer: "Clean-Room-Helfer für Metin2 · Seherwettstreit",

    whoFirst: "Wer beginnt dieses Spiel?",
    iStart: "Ich beginne",
    iStartSub: "Ich lege zuerst",
    pcStart: "Computer beginnt",
    pcStartSub: "Ich sehe die Farbe, dann antworte ich",
    leaderNote: "Gilt für das ganze Spiel — wähle, wer die allererste Karte gelegt hat.",

    meTitle: "Du beginnst — spiel einfach 0 → 8 der Reihe nach",
    meBody:
      "Wenn du dich festlegst, bevor du die Computer-Karte siehst, hat <strong>jede Reihenfolge exakt " +
      "denselben erwarteten Ausgang</strong> (über 100.000 simulierte Spiele bewiesen: ~38,5% Sieg, egal wie). " +
      "Also nicht überdenken — klick 0, 1, 2 … 8 und spar dir die Mühe.",
    meSeqHint: "Tippe jede Karte an, während du sie spielst — nur als Merkhilfe.",
    newGame: "Neues Spiel",
    reset: "Zurücksetzen",
    meDone: "Alle 9 gespielt — viel Glück! 🍀",

    colourQ: "Welche Farbe hat die Computer-Karte?",
    blackSub: "gerade · 0 2 4 6 8",
    whiteSub: "ungerade · 1 3 5 7",
    playThis: "Spiel diese Karte",
    resultQ: "Hat deine Karte gewonnen?",
    won: "Gewonnen",
    wonSub: "meine höher",
    equal: "Gleich",
    equalSub: "gleiche Zahl",
    lost: "Verloren",
    lostSub: "meine niedriger",
    undo: "Zurück",

    statsTitle: "Bringt der Helfer wirklich was?",
    statsLead:
      "Gemessen über <strong>100.000 simulierte Duelle</strong> (Computer spielt zufällige Reihenfolge). " +
      "Münzen = 1 pro gewonnener Runde, plus die Punktedifferenz als Bonus, wenn du das Duell gewinnst.",
    scPcTag: "🤖 Computer beginnt",
    scPcSub: "Duelle mit Helfer gewonnen",
    scPcCmp: "statt 39% Raten · ≈ 5,2 Münzen/Spiel (+0,6)",
    scMeTag: "🫵 Du beginnst",
    scMeSub: "Helfer = blind klicken",
    scMeCmp: "Reihenfolge ist mathematisch egal — nicht überdenken",
    scMixTag: "🎲 50 / 50 gemischt",
    scMixSub: "Duelle mit Helfer gewonnen",
    scMixCmp: "statt 39% Raten · ≈ 4,9 Münzen/Spiel (+0,3)",
    realCase: "★ der echte Fall im Spiel",
    statsFoot:
      "Fazit: Der Vorteil des Helfers liegt komplett in den Runden, in denen der Computer beginnt und du " +
      "auf seine Farbe reagieren kannst. Wenn du beginnst, schlägt kein Tool den Zufall — dann heißt es nur " +
      "\"spiel der Reihe nach\".",

    recMeta: ({ colour }) => `Computer zeigte ${colour}`,
    overText: ({ m, coins, cls }) =>
      `Endvorsprung <span class="${cls}">${m}</span> · <strong>${coins}</strong> Münzen`,
    recordedRound: ({ n }) => `Runde ${n} gespeichert.`,
    finalCoins: ({ coins, m }) => `Fertig — ${coins} Münzen (Vorsprung ${m})`,
  },
};

const LANG_KEY = "seer-helper.lang.v1";
let lang = "en";
const listeners = new Set();

(function initLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && STRINGS[saved]) lang = saved;
    else if (typeof navigator !== "undefined" && /^de\b/i.test(navigator.language || "")) lang = "de";
  } catch {}
})();

export function getLang() { return lang; }
export function setLang(next) {
  if (!STRINGS[next] || next === lang) return;
  lang = next;
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  applyToDOM();
  for (const fn of listeners) fn(lang);
}
export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function t(key, params) {
  const v = (STRINGS[lang] && STRINGS[lang][key]) ?? (STRINGS.en[key]) ?? key;
  return typeof v === "function" ? v(params || {}) : v;
}

export function applyToDOM() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.getAttribute("data-i18n-title"));
  });
}
