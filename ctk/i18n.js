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
    globalWhyLowerTooltip: "<strong>Why is this lower than the solver's rate?</strong><ul><li>Input typos when entering revealed values</li><li>Players who don't follow the suggestion every move</li><li>Players still using older versions of the helper</li><li>Page-open / partial-game counts that include people who never used the suggestions at all</li></ul>",
    versionHistoryTooltip: "<strong>Version history</strong><ul class='version-history'><li><b>v0.12</b> &mdash; 44.0% gold &mdash; dead-line filter on bingos + extended late-game search to 7 hidden cells when below target</li><li><b>v0.11</b> &mdash; 43.8% gold &mdash; late-game search now optimises P(score &ge; 550) instead of E[score]</li><li><b>v0.10</b> &mdash; 43.8% gold &mdash; bingo-progress accumulator (rewards reveals that advance partial lines)</li><li><b>v0.9</b> &mdash; 42.4% gold &mdash; exact Shannon info gain about 5-placement replaces hand-crafted info proxy</li><li><b>v0.8</b> &mdash; 41.9% gold &mdash; legal pages (impressum, privacy) + Twitch chat consent gate</li><li><b>v0.7</b> &mdash; 41.9% gold &mdash; chat sidebar, edge-tab collapse, like button, page-views counter</li><li><b>v0.6</b> &mdash; 41.9% gold &mdash; first published chest-rate display, money-rain on lock-in</li><li><b>v0.5</b> &mdash; ~40% gold &mdash; spreadWeight prior, ceiling.mjs + diagnose.mjs offline tooling</li><li><b>v0.4</b> &mdash; ~38% gold &mdash; random-search weight tuning lifted gold rate ~8pp</li><li><b>v0.3</b> &mdash; benchmark.mjs harness for offline self-play measurement</li><li><b>v0.2</b> &mdash; chain bonus, K-hunt weighting, catch penalty during 5-turn</li><li><b>v0.1</b> &mdash; ~31.6% gold &mdash; hand-tuned baseline heuristic</li></ul><div class='version-note'>UX-only patches (v0.12.1&ndash;v0.12.5): Web Worker for the gold-chance compute, hover tooltips, panel polish.</div>",
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
    likePrompt: "Enjoying the helper? Drop a like!",
    twitchChat: "Chat",
    aboutTitle: "About this project",
    aboutPrivacyHeading: "Your data",
    aboutPrivacyBody:
      "<p>Nothing about you is stored on this site. There's no login, no analytics, no tracking pixel. The only state that leaves your browser is three small public counters (likes, page opens, completed games per tier) hosted on a free counter service. They store integers, nothing else.</p>" +
      "<p>The Twitch chat on the right is Twitch's own embed — your interaction with it goes directly to Twitch under their account, not to this page. We can't read it.</p>" +
      "<p>Your session stats and toggle preferences live in your browser's localStorage. Clearing site data wipes them.</p>",
    aboutSolverHeading: "How the solver works",
    aboutSolverBody:
      "<p>The helper plays a clean-room reimplementation of <em>Catch the King</em>. It never reads the game; you tell it what each cell shows by clicking and pressing keys, and it tells you which cell to click next.</p>" +
      "<p>For each hidden cell on your turn it computes a score with several terms:</p>" +
      "<ul>" +
        "<li><b>Expected immediate points</b> — probability-weighted points from flipping this cell with the current hand.</li>" +
        "<li><b>Information gain</b> — how much the resulting flash signal narrows down where the 5s are. Reveals near unknown cells are worth more.</li>" +
        "<li><b>Chain bonus</b> — likelihood the turn continues so we can score again.</li>" +
        "<li><b>Bingo bonus</b> — credit for completing a row, column, or diagonal.</li>" +
        "<li><b>King-hunt bonus</b> — scales with the gap to 550. Far behind? Hunt the K.</li>" +
        "<li><b>5-turn safety penalty</b> — heavy aversion to flipping cells adjacent to a possible 5 when the 5-card is in hand.</li>" +
      "</ul>" +
      "<p>The cell with the highest combined score is the suggestion. Late-game (≤ 6 hidden cells past the 5-turn) it switches to <em>exact expectimax search</em> — evaluating the full subgame tree and picking the move with highest expected final score.</p>",
    aboutFindingsHeading: "What we tried",
    aboutFindingsBody:
      "<p><b>Worked:</b></p>" +
      "<ul>" +
        "<li>Hardcoded 4-cell opener (a dominating set on the 5×5 grid). +1.7pp gold over greedy first-move.</li>" +
        "<li>Random-search weight tuning over paired self-play. Lifted gold from 31.6% to ~42% across 100,000 simulated games.</li>" +
        "<li>K-hunt bonus that scales with the gap to gold target.</li>" +
        "<li>Late-game exact expectimax (+0.6pp gold).</li>" +
      "</ul>" +
      "<p><b>Didn't:</b></p>" +
      "<ul>" +
        "<li>PIMC (Perfect-Info Monte Carlo): the strategy-fusion bias makes its rollouts overconfident; suggestions ended up worse than the bare heuristic.</li>" +
        "<li>Bounded mid-game expectimax with cheap leaf evaluators (sampled rollouts, deterministic playouts, greedy analytical assignment). All three regressed to 15–37% gold — the leaves miss the heuristic's information-value and 5-turn safety setup.</li>" +
      "</ul>" +
      "<p>Headline number: <b>~42% gold over 100,000 games</b>, 88% silver-or-better, 0% sub-bronze.</p>",
    aboutLimitsHeading: "Why we can't be perfect",
    aboutLimitsBody:
      "<p>To play optimally we'd need the best response for every game state we could ever face. The board is a permutation of 25 cards — there are <b>25!&nbsp;≈&nbsp;1.55&nbsp;×&nbsp;10²⁵</b> orderings.</p>" +
      "<p>Even storing one byte per arrangement would need around <b>15 yottabytes</b> — roughly <b>50–75× the world's total digital storage</b> as of 2024. A real perfect solver would need many bytes per state (best move, expected score, sub-tree value), so the gap is far worse.</p>" +
      "<p>We measured a separate <em>perfect-information ceiling</em> with a solver that already knows the board layout but still has to obey the turn order. That ceiling is around <b>98% gold</b>. So the rules aren't what cap us at 42% — the gap is decision-making under uncertainty.</p>",
    impressum: "Imprint",
    privacy: "Privacy",
    impressumTitle: "Imprint",
    impressumBody:
      "<p>Information per §5 TMG / §18 MStV:</p>" +
      "<p><b>Dominik Löffler</b><br>" +
        "Roseggerstraße 21<br>" +
        "4020 Linz<br>" +
        "Österreich</p>" +
      "<p>Contact: discord <code>@jogoe</code></p>" +
      "<p>Responsible for content per §18 (2) MStV: same as above.</p>" +
      "<p><i>Disclaimer:</i> Despite careful editorial control, no liability is accepted for the content of external links. The operators of those linked pages are solely responsible for their content.</p>",
    datenschutzTitle: "Privacy policy",
    datenschutzBody:
      "<p><b>1. Controller</b><br>See Imprint.</p>" +
      "<p><b>2. Hosting (GitHub Pages)</b><br>This site is hosted on GitHub Pages (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA). GitHub processes visitors' IP addresses in server logs as part of operating the service. " +
        "Privacy statement: <a href='https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement' target='_blank' rel='noopener'>docs.github.com</a>.</p>" +
      "<p><b>3. Local storage</b><br>The following is stored only in your browser (localStorage), never sent to us:</p>" +
      "<ul>" +
        "<li>Language preference (EN/DE)</li>" +
        "<li>Session statistics (games played, gold/silver/bronze)</li>" +
        "<li>UI preferences (mute, minimal UI, chat hidden)</li>" +
        "<li>Like state, Twitch-chat consent flag</li>" +
      "</ul>" +
      "<p><b>4. Public counters (abacus.jasoncameron.dev)</b><br>For the like button, the page-open counter, and the global games/gold/silver/bronze tally, the site sends HTTP requests to a free public counter service. The provider may process IP addresses while serving these requests. Legal basis: legitimate interest (Art. 6 (1) lit. f GDPR) in basic usage statistics.</p>" +
      "<p><b>5. Twitch chat</b><br>The Twitch-chat embed is loaded only after you explicitly click the consent button. Once loaded, Twitch (Twitch Interactive Inc., 350 Bush Street, San Francisco, CA 94104, USA) processes your IP address, may set cookies, and integrates with your Twitch account if you're logged in. " +
        "Twitch privacy notice: <a href='https://www.twitch.tv/p/legal/privacy-notice/' target='_blank' rel='noopener'>twitch.tv/p/legal/privacy-notice</a>. Legal basis for loading: your explicit consent (Art. 6 (1) lit. a GDPR), revocable any time below.</p>",
    revokeTwitchConsent: "Revoke Twitch-chat consent",
    twitchConsentBody:
      "<b>Loading the Twitch chat sends your IP and cookies to Twitch.</b> By clicking below you consent to that connection (revocable in the privacy policy).",
    twitchConsentBtn: "Load Twitch chat",
    twitchConsentRevoked: "Twitch-chat consent revoked. Reload to apply.",
    customSfxTitle: "Click: pick custom sound · Right-click: reset",
    customSfxSet: "Custom sound saved.",
    customSfxReset: "Sound reset to default.",
    customSfxTooBig: "Sound file too big (max 4 MB).",
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
    globalWhyLowerTooltip: "<strong>Warum niedriger als die Solver-Quote?</strong><ul><li>Tippfehler bei der Eingabe der aufgedeckten Werte</li><li>Spieler die nicht jedem Vorschlag folgen</li><li>Spieler die noch ältere Versionen des Helfers nutzen</li><li>Seitenaufrufe und abgebrochene Spiele zählen mit, auch wenn keine Vorschläge genutzt wurden</li></ul>",
    versionHistoryTooltip: "<strong>Versionshistorie</strong><ul class='version-history'><li><b>v0.12</b> &mdash; 44.0% Gold &mdash; Dead-Line-Filter f&uuml;r Bingos + Suche bis 7 verdeckte Felder, wenn unter dem Ziel</li><li><b>v0.11</b> &mdash; 43.8% Gold &mdash; Endspiel-Suche optimiert P(Score &ge; 550) statt E[Score]</li><li><b>v0.10</b> &mdash; 43.8% Gold &mdash; Bingo-Fortschritts-Bonus (belohnt Z&uuml;ge die Linien voranbringen)</li><li><b>v0.9</b> &mdash; 42.4% Gold &mdash; Exakter Shannon-Informationsgewinn &uuml;ber 5er-Positionen ersetzt heuristische N&auml;herung</li><li><b>v0.8</b> &mdash; 41.9% Gold &mdash; Impressum, Datenschutz, Twitch-Chat-Einwilligungs-Gate</li><li><b>v0.7</b> &mdash; 41.9% Gold &mdash; Chat-Sidebar, Edge-Tab zum Einklappen, Like-Button, Seitenaufruf-Z&auml;hler</li><li><b>v0.6</b> &mdash; 41.9% Gold &mdash; erste Anzeige der Truhen-Quote, Geld-Regen bei 100% Gold-Chance</li><li><b>v0.5</b> &mdash; ~40% Gold &mdash; spreadWeight-Priorit&auml;t, ceiling.mjs + diagnose.mjs als Offline-Werkzeug</li><li><b>v0.4</b> &mdash; ~38% Gold &mdash; Random-Search-Gewichts-Tuning hob die Gold-Rate um ~8pp</li><li><b>v0.3</b> &mdash; benchmark.mjs Selfplay-Harness f&uuml;r Offline-Messungen</li><li><b>v0.2</b> &mdash; Chain-Bonus, K&ouml;nigsjagd-Gewichtung, Fang-Strafe in der 5er-Runde</li><li><b>v0.1</b> &mdash; ~31.6% Gold &mdash; handgetunte Basis-Heuristik</li></ul><div class='version-note'>Reine UI-Updates (v0.12.1&ndash;v0.12.5): Web Worker f&uuml;r die Gold-Berechnung, Hover-Tooltips, Panel-Politur.</div>",
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
    likePrompt: "Gefällt dir der Helfer? Lass ein Like da!",
    twitchChat: "Chat",
    aboutTitle: "Über das Projekt",
    aboutPrivacyHeading: "Deine Daten",
    aboutPrivacyBody:
      "<p>Es werden keinerlei Daten über dich gespeichert. Kein Login, keine Analytics, kein Tracking. Das Einzige, was deinen Browser verlässt, sind drei kleine öffentliche Zähler (Likes, Seitenaufrufe, abgeschlossene Spiele pro Stufe), gehostet bei einem kostenlosen Zähler-Service. Es werden nur ganze Zahlen gespeichert, sonst nichts.</p>" +
      "<p>Der Twitch-Chat rechts ist Twitchs eigener Embed — deine Interaktion damit läuft direkt über deinen Twitch-Account zu Twitch, nicht zu dieser Seite. Wir können den Chat nicht mitlesen.</p>" +
      "<p>Deine Sitzungs-Statistiken und Toggle-Einstellungen liegen im localStorage deines Browsers. Beim Löschen der Website-Daten verschwinden sie.</p>",
    aboutSolverHeading: "Wie der Solver arbeitet",
    aboutSolverBody:
      "<p>Der Helfer ist eine Clean-Room-Nachbildung von <em>Schnapp den König</em>. Er liest das Spiel nicht; du sagst ihm per Klick und Tasten, was auf jedem Feld steht, und er sagt dir, welches Feld als Nächstes dran ist.</p>" +
      "<p>Für jedes verdeckte Feld berechnet er bei jedem Zug eine Bewertung mit mehreren Anteilen:</p>" +
      "<ul>" +
        "<li><b>Erwartete Sofort-Punkte</b> — wahrscheinlichkeitsgewichtete Punkte für das Aufdecken mit der aktuellen Handkarte.</li>" +
        "<li><b>Informationsgewinn</b> — wie stark das resultierende Flash-Signal die Lage der 5er einschränkt. Felder neben unbekannten Nachbarn sind wertvoller.</li>" +
        "<li><b>Chain-Bonus</b> — Wahrscheinlichkeit, dass der Zug weitergeht.</li>" +
        "<li><b>Bingo-Bonus</b> — Bonus, wenn eine Reihe, Spalte oder Diagonale komplettiert wird.</li>" +
        "<li><b>Königs-Jagd-Bonus</b> — skaliert mit dem Abstand zu 550. Weit entfernt? Such den K.</li>" +
        "<li><b>5er-Sicherheits-Strafe</b> — starke Abneigung gegen Felder neben einer möglichen 5, wenn die 5er-Karte auf der Hand ist.</li>" +
      "</ul>" +
      "<p>Das Feld mit der höchsten Gesamt-Bewertung ist der TIPP. In der Endphase (≤ 6 verdeckte Felder nach dem 5er-Zug) wechselt der Solver in eine <em>exakte Expectimax-Suche</em> und bewertet den vollständigen Spielbaum.</p>",
    aboutFindingsHeading: "Was wir probiert haben",
    aboutFindingsBody:
      "<p><b>Hat geklappt:</b></p>" +
      "<ul>" +
        "<li>Fest verdrahtetes 4-Felder-Eröffnungsmuster (ein dominierender Satz auf dem 5×5-Brett). +1,7pp Gold gegenüber greedy.</li>" +
        "<li>Gewichts-Tuning per Random-Search mit gepaartem Self-Play. Gold-Rate von 31,6% auf ~42% über 100.000 simulierte Spiele.</li>" +
        "<li>Königs-Jagd-Bonus, der mit dem Abstand zur Goldgrenze skaliert.</li>" +
        "<li>Exakte Expectimax-Suche im Endspiel (+0,6pp Gold).</li>" +
      "</ul>" +
      "<p><b>Hat nicht geklappt:</b></p>" +
      "<ul>" +
        "<li>PIMC (Perfect-Info Monte Carlo): der Strategy-Fusion-Bias macht die Rollouts überschätzt; die Vorschläge wurden schlechter als die reine Heuristik.</li>" +
        "<li>Begrenzte Mid-Game-Expectimax-Suche mit billigen Leaf-Evaluatoren (gesamplete Rollouts, deterministische Playouts, gieriger analytischer Assignment). Alle drei rutschten auf 15–37% Gold — den Leaves fehlen die Info-Wert- und 5er-Sicherheits-Anteile der Heuristik.</li>" +
      "</ul>" +
      "<p>Endergebnis: <b>~42% Gold über 100.000 Spiele</b>, 88% Silber-oder-besser, 0% unter Bronze.</p>",
    aboutLimitsHeading: "Warum wir nicht perfekt spielen können",
    aboutLimitsBody:
      "<p>Um optimal zu spielen, bräuchten wir die beste Antwort für jeden möglichen Spielzustand. Das Brett ist eine Permutation von 25 Karten — es gibt <b>25!&nbsp;≈&nbsp;1,55&nbsp;×&nbsp;10²⁵</b> Anordnungen.</p>" +
      "<p>Selbst nur ein Byte pro Anordnung wären rund <b>15 Yottabyte</b> — etwa <b>das 50- bis 75-fache des gesamten weltweiten digitalen Speichers</b> (Stand 2024). Ein echter perfekter Solver bräuchte viele Bytes pro Zustand (beste Aktion, erwarteter Score, Wert des Teilbaums), die Lücke wäre also noch dramatischer.</p>" +
      "<p>Eine separate <em>Perfekt-Information-Decke</em> haben wir mit einem Solver gemessen, der das Layout des Bretts kennt, aber weiterhin der Zugreihenfolge folgen muss. Die liegt bei rund <b>98% Gold</b>. Es sind also nicht die Spielregeln, die uns auf 42% deckeln — es ist die Entscheidung unter Unsicherheit.</p>",
    impressum: "Impressum",
    privacy: "Datenschutz",
    impressumTitle: "Impressum",
    impressumBody:
      "<p>Angaben gemäß §5 TMG / §18 MStV:</p>" +
      "<p><b>Dominik Löffler</b><br>" +
        "Roseggerstraße 21<br>" +
        "4020 Linz<br>" +
        "Österreich</p>" +
      "<p>Kontakt: Discord <code>@jogoe</code></p>" +
      "<p>Verantwortlich für den Inhalt nach §18 Abs. 2 MStV: siehe oben.</p>" +
      "<p><i>Haftungsausschluss:</i> Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.</p>",
    datenschutzTitle: "Datenschutzerklärung",
    datenschutzBody:
      "<p><b>1. Verantwortlicher</b><br>Siehe Impressum.</p>" +
      "<p><b>2. Hosting (GitHub Pages)</b><br>Diese Seite wird auf GitHub Pages gehostet (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA). GitHub verarbeitet beim Aufruf der Seite IP-Adressen der Besucher in Server-Logs. " +
        "Datenschutzerklärung: <a href='https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement' target='_blank' rel='noopener'>docs.github.com</a>.</p>" +
      "<p><b>3. Lokale Speicherung</b><br>Folgende Daten werden ausschließlich in deinem Browser (localStorage) gespeichert und nicht an uns übertragen:</p>" +
      "<ul>" +
        "<li>Sprachauswahl (EN/DE)</li>" +
        "<li>Sitzungs-Statistiken (gespielte Spiele, Gold/Silber/Bronze)</li>" +
        "<li>UI-Präferenzen (Stumm, Minimal-UI, Chat ausgeblendet)</li>" +
        "<li>Like-Status, Twitch-Chat-Einwilligung</li>" +
      "</ul>" +
      "<p><b>4. Öffentliche Zähler (abacus.jasoncameron.dev)</b><br>Für den Like-Button, den Seitenaufruf-Zähler und die globale Spiel-Statistik (Gold/Silber/Bronze) sendet die Seite HTTP-Anfragen an einen kostenlosen öffentlichen Zähldienst. Der Anbieter kann dabei IP-Adressen verarbeiten. Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) an einfacher Nutzungsstatistik.</p>" +
      "<p><b>5. Twitch-Chat</b><br>Der Twitch-Chat wird ausschließlich nach deiner ausdrücklichen Einwilligung geladen. Sobald geladen, verarbeitet Twitch (Twitch Interactive Inc., 350 Bush Street, San Francisco, CA 94104, USA) deine IP-Adresse, kann Cookies setzen und integriert sich mit deinem Twitch-Konto, falls du eingeloggt bist. " +
        "Twitch-Datenschutzhinweis: <a href='https://www.twitch.tv/p/legal/privacy-notice/' target='_blank' rel='noopener'>twitch.tv/p/legal/privacy-notice</a>. Rechtsgrundlage für das Laden: deine ausdrückliche Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), unten jederzeit widerrufbar.</p>",
    revokeTwitchConsent: "Twitch-Chat-Einwilligung widerrufen",
    twitchConsentBody:
      "<b>Beim Laden des Twitch-Chats werden deine IP und Cookies an Twitch übertragen.</b> Mit Klick unten willigst du dieser Verbindung zu (in der Datenschutzerklärung jederzeit widerrufbar).",
    twitchConsentBtn: "Twitch-Chat laden",
    twitchConsentRevoked: "Twitch-Chat-Einwilligung widerrufen. Bitte Seite neu laden.",
    customSfxTitle: "Klick: eigenen Sound wählen · Rechtsklick: zurücksetzen",
    customSfxSet: "Eigener Sound gespeichert.",
    customSfxReset: "Sound auf Standard zurückgesetzt.",
    customSfxTooBig: "Sound-Datei zu groß (max. 4 MB).",
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
  if (typeof document !== "undefined") document.documentElement.lang = lang;
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
  // Keep <html lang> in sync with the active language so CSS can branch on it
  // (e.g. localised pseudo-element labels via html[lang="…"]).
  if (!root) document.documentElement.lang = currentLang;
  const r = root ?? document;
  r.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  r.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  r.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
}
