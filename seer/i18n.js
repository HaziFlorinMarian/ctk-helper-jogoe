// Lightweight i18n for the Seer helper (mirrors ctk/i18n.js).
// Static HTML carries data-i18n / data-i18n-html; dynamic strings go through
// t(key, params). DOM/localStorage access is guarded so it's import-safe.

const STRINGS = {
  en: {
    subtitle: "Duel of the Seers move suggester",
    pageIntro:
      "Free helper for the Metin2 card event <strong>Duel of the Seers</strong> (German: Seherwettstreit). " +
      "Tell it who plays first; if the computer leads it tracks the hidden cards and tells you exactly " +
      "which card to play.",
    you: "You",
    opponent: "Opponent",
    margin: "Margin",
    round: "Round",
    score: "Score",
    session: "Session", games: "Games", avgCoins: "Avg coins/game",
    globalAllTime: "Everyone (all time)", coinDist: "Coins per game",
    statsScope: "Only counts games where the computer starts (the ones the helper plays for you). “You start” games aren't tracked — any order is equal there.",
    oppCardsLeft: "Opponent's cards left",
    black: "Black",
    white: "White",
    footer: "Clean-room helper for Metin2 · Duel of the Seers",
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
      "The helper now plays the <strong>exact optimal</strong> card (full belief-state solve, not a heuristic). " +
      "Measured over <strong>100,000 simulated duels</strong> vs a random-order computer. " +
      "Coins = 1 per round you win, plus the point difference as a bonus when you win the duel.",
    scPcTag: "🤖 Computer starts",
    scPcSub: "duels won with the helper",
    scPcCmp: "vs 39% guessing · ≈ 5.4 coins/game · mathematically optimal",
    scMeTag: "🫵 You start",
    scMeSub: "helper = clicking blindly",
    scMeCmp: "order is mathematically irrelevant — don't overthink it",
    scMixTag: "🎲 50 / 50 mix",
    scMixSub: "duels won with the helper",
    scMixCmp: "vs 39% guessing · ≈ 5.0 coins/game",
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
    session: "Sitzung", games: "Spiele", avgCoins: "Ø Münzen/Spiel",
    globalAllTime: "Alle (gesamt)", coinDist: "Münzen pro Spiel",
    statsScope: "Zählt nur Spiele, in denen der Computer beginnt (die der Helfer für dich spielt). „Du beginnst“-Spiele werden nicht erfasst — dort ist jede Reihenfolge gleich.",
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
      "Der Helfer spielt jetzt die <strong>exakt optimale</strong> Karte (vollständige Belief-State-Lösung, keine Heuristik). " +
      "Gemessen über <strong>100.000 simulierte Duelle</strong> gegen einen Computer mit zufälliger Reihenfolge. " +
      "Münzen = 1 pro gewonnener Runde, plus die Punktedifferenz als Bonus, wenn du das Duell gewinnst.",
    scPcTag: "🤖 Computer beginnt",
    scPcSub: "Duelle mit Helfer gewonnen",
    scPcCmp: "statt 39% Raten · ≈ 5,4 Münzen/Spiel · mathematisch optimal",
    scMeTag: "🫵 Du beginnst",
    scMeSub: "Helfer = blind klicken",
    scMeCmp: "Reihenfolge ist mathematisch egal — nicht überdenken",
    scMixTag: "🎲 50 / 50 gemischt",
    scMixSub: "Duelle mit Helfer gewonnen",
    scMixCmp: "statt 39% Raten · ≈ 5,0 Münzen/Spiel",
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
  // Turkish, Romanian, Spanish, Polish — UI strings translated; long legal
  // bodies (impressumBody/datenschutzBody) fall back to English, same as ctk.
  tr: {
    subtitle: "Kâhinler Düellosu hamle önericisi",
    pageIntro:
      "Metin2 kart etkinliği <strong>Kâhinler Düellosu</strong> (Seherwettstreit) için ücretsiz yardımcı. " +
      "Kimin başladığını söyle; bilgisayar başlarsa gizli kartları takip eder ve hangi kartı oynaman gerektiğini tam olarak söyler.",
    you: "Sen", opponent: "Rakip", margin: "Fark", round: "Tur", score: "Skor",
    session: "Oturum", games: "Oyunlar", avgCoins: "Ort. para/oyun",
    globalAllTime: "Herkes (tüm zamanlar)", coinDist: "Oyun başına para",
    statsScope: "Sadece bilgisayarın başladığı oyunları sayar (yardımcının senin için oynadıkları). „Sen başlıyorsun“ oyunları sayılmaz — orada her sıra eşittir.",
    oppCardsLeft: "Rakibin kalan kartları", black: "Siyah", white: "Beyaz",
    footer: "Metin2 için temiz oda yardımcısı · Kâhinler Düellosu",
    allHelpers: "Tüm yardımcılar",
    modelNote: "Model: bilgisayar rastgele bir kart sırası oynar; yardımcı beklenen farkını (galibiyet − mağlubiyet) en üst düzeye çıkarır.",
    helpIntro: "Nasıl kullanılır:",
    helpLeader: "<strong>Kimin başladığını</strong> bir kez seç — tüm oyun için sabit.",
    helpColour: "Bilgisayar başlarsa gördüğün <strong>rengi</strong> seç, önerilen kartı oyna, sonra sonucu kaydet.",
    helpResult: "<kbd>B</kbd>/<kbd>W</kbd> renk, <kbd>1</kbd>/<kbd>0</kbd>/<kbd>2</kbd> = kazandı/eşit/kaybetti, <kbd>Backspace</kbd> geri al, <kbd>Esc</kbd> yeni oyun.",
    twitchChat: "Sohbet",
    twitchConsentBody: "<b>Twitch sohbetini yüklemek IP'nizi ve çerezlerinizi Twitch'e gönderir.</b> Aşağıya tıklayarak bu bağlantıya onay verirsiniz (gizlilik politikasında istediğiniz zaman geri alınabilir).",
    twitchConsentBtn: "Twitch sohbetini yükle",
    twitchConsentRevoked: "Twitch sohbet onayı geri alındı. Uygulamak için sayfayı yenileyin.",
    revokeTwitchConsent: "Twitch sohbet onayını geri al",
    likePrompt: "Yardımcıyı beğeniyor musun? Bir beğeni bırak!",
    supportText: "<strong>Bu yardımcıda asla reklam olmayacak.</strong> Projeyi desteklemek istersen <a href='https://paypal.me/jogoe' target='_blank' rel='noopener'>PayPal</a> üzerinden bağış yapabilirsin &mdash; her katkı çok değerli. Teşekkürler! &lt;3",
    impressum: "Künye", privacy: "Gizlilik",
    impressumTitle: "Künye", datenschutzTitle: "Gizlilik politikası",
    whoFirst: "Bu oyunda kim başlıyor?",
    iStart: "Ben başlıyorum", iStartSub: "Kartımı önce ben koyarım",
    pcStart: "Bilgisayar başlıyor", pcStartSub: "Rengini görür, sonra cevap veririm",
    leaderNote: "Tüm oyun için sabit — ilk kartı kim koyduysa onu seç.",
    meTitle: "Sen başlıyorsun — sadece 0 → 8 sırayla oyna",
    meBody:
      "Bilgisayarın kartını görmeden önce karar verdiğinde, <strong>her sıralama tam olarak aynı beklenen sonucu verir</strong> " +
      "(100.000 simüle oyunda kanıtlandı: ~%38,5 galibiyet, fark etmez). Yani fazla düşünme — 0, 1, 2 … 8 tıkla ve enerjini koru.",
    meSeqHint: "Oynadıkça her kartı işaretle — sadece yerini kaybetmemek için.",
    newGame: "Yeni oyun", reset: "Sıfırla", meDone: "9'u da oynandı — bol şans! 🍀",
    colourQ: "Bilgisayarın kartı hangi renk?",
    blackSub: "çift · 0 2 4 6 8", whiteSub: "tek · 1 3 5 7",
    playThis: "Bu kartı oyna", resultQ: "Kartın kazandı mı?",
    won: "Kazandı", wonSub: "benimki yüksek", equal: "Eşit", equalSub: "aynı sayı",
    lost: "Kaybetti", lostSub: "benimki düşük", undo: "Geri Al",
    statsTitle: "Yardımcı gerçekten işe yarıyor mu?",
    statsLead:
      "Yardımcı artık <strong>tam optimal</strong> kartı oynuyor (tam belief-state çözümü, sezgisel değil). " +
      "Rastgele sıralı bilgisayara karşı <strong>100.000 simüle düelloda</strong> ölçüldü. " +
      "Madeni para = kazandığın her tur için 1, artı düelloyu kazanırsan puan farkı bonusu.",
    scPcTag: "🤖 Bilgisayar başlıyor", scPcSub: "yardımcıyla kazanılan düellolar",
    scPcCmp: "%39 tahmine karşı · ≈ 5,4 para/oyun · matematiksel olarak optimal",
    scMeTag: "🫵 Sen başlıyorsun", scMeSub: "yardımcı = körlemesine tıklama",
    scMeCmp: "sıra matematiksel olarak önemsiz — fazla düşünme",
    scMixTag: "🎲 50 / 50 karışık", scMixSub: "yardımcıyla kazanılan düellolar",
    scMixCmp: "%39 tahmine karşı · ≈ 5,0 para/oyun",
    realCase: "★ oyunda gerçekte olan",
    statsFoot:
      "Özet: yardımcının avantajı tamamen bilgisayarın başladığı ve rengine tepki verebildiğin turlarda. " +
      "Sen başladığında hiçbir araç şansı yenemez — bu yüzden sadece \"sırayla oyna\" der.",
    recMeta: ({ colour }) => `bilgisayar ${colour} gösterdi`,
    overText: ({ m, coins, cls }) => `Son fark <span class="${cls}">${m}</span> · <strong>${coins}</strong> para`,
    recordedRound: ({ n }) => `Tur ${n} kaydedildi.`,
    finalCoins: ({ coins, m }) => `Bitti — ${coins} para (fark ${m})`,
  },
  ro: {
    subtitle: "Sugestii de mutare Duelul Văzătorilor",
    pageIntro:
      "Ajutor gratuit pentru evenimentul de cărți Metin2 <strong>Duelul Văzătorilor</strong> (Seherwettstreit). " +
      "Spune cine începe; dacă începe calculatorul, urmărește cărțile ascunse și îți spune exact ce carte să joci.",
    you: "Tu", opponent: "Adversar", margin: "Diferență", round: "Rundă", score: "Scor",
    session: "Sesiune", games: "Jocuri", avgCoins: "Medie monede/joc",
    globalAllTime: "Toți (din total)", coinDist: "Monede pe joc",
    statsScope: "Numără doar jocurile în care calculatorul începe (cele jucate de ajutor). Jocurile „tu începi“ nu sunt urmărite — acolo orice ordine e egală.",
    oppCardsLeft: "Cărțile rămase ale adversarului", black: "Negru", white: "Alb",
    footer: "Ajutor clean-room pentru Metin2 · Duelul Văzătorilor",
    allHelpers: "Toate ajutoarele",
    modelNote: "Model: calculatorul joacă o ordine aleatorie a cărților; ajutorul maximizează diferența ta așteptată (victorii − înfrângeri).",
    helpIntro: "Cum se folosește:",
    helpLeader: "<strong>Alege cine începe</strong> o dată — rămâne fix pentru tot jocul.",
    helpColour: "Dacă începe calculatorul, atinge <strong>culoarea</strong> pe care o vezi, joacă cartea sugerată, apoi notează rezultatul.",
    helpResult: "<kbd>B</kbd>/<kbd>W</kbd> culoare, <kbd>1</kbd>/<kbd>0</kbd>/<kbd>2</kbd> = câștigat/egal/pierdut, <kbd>Backspace</kbd> anulează, <kbd>Esc</kbd> joc nou.",
    twitchChat: "Chat",
    twitchConsentBody: "<b>Încărcarea chat-ului Twitch trimite IP-ul și cookie-urile tale către Twitch.</b> Făcând click mai jos, ești de acord cu această conexiune (revocabilă în politica de confidențialitate).",
    twitchConsentBtn: "Încarcă chat-ul Twitch",
    twitchConsentRevoked: "Consimțământul pentru chat-ul Twitch a fost revocat. Reîncarcă pagina.",
    revokeTwitchConsent: "Revocă consimțământul pentru chat-ul Twitch",
    likePrompt: "Îți place ajutorul? Lasă un like!",
    supportText: "<strong>Acest ajutor nu va avea niciodată reclame.</strong> Dacă vrei să susții proiectul, poți dona pe <a href='https://paypal.me/jogoe' target='_blank' rel='noopener'>PayPal</a> &mdash; orice sprijin contează enorm. Mulțumesc! &lt;3",
    impressum: "Date legale", privacy: "Confidențialitate",
    impressumTitle: "Date legale", datenschutzTitle: "Politica de confidențialitate",
    whoFirst: "Cine începe acest joc?",
    iStart: "Eu încep", iStartSub: "Pun cartea prima",
    pcStart: "Calculatorul începe", pcStartSub: "Văd culoarea, apoi răspund",
    leaderNote: "Fix pentru tot jocul — alege cine a pus prima carte.",
    meTitle: "Tu începi — joacă pur și simplu 0 → 8 în ordine",
    meBody:
      "Când te decizi înainte de a vedea cartea calculatorului, <strong>orice ordine are exact același rezultat așteptat</strong> " +
      "(dovedit în 100.000 de jocuri simulate: ~38,5% victorii, oricum). Deci nu te complica — apasă 0, 1, 2 … 8 și economisește-ți energia.",
    meSeqHint: "Atinge fiecare carte pe măsură ce o joci — doar ca să-ți ții locul.",
    newGame: "Joc nou", reset: "Resetează", meDone: "Toate 9 jucate — baftă! 🍀",
    colourQ: "Ce culoare are cartea calculatorului?",
    blackSub: "par · 0 2 4 6 8", whiteSub: "impar · 1 3 5 7",
    playThis: "Joacă această carte", resultQ: "Cartea ta a câștigat?",
    won: "Câștigat", wonSub: "a mea mai mare", equal: "Egal", equalSub: "același număr",
    lost: "Pierdut", lostSub: "a mea mai mică", undo: "Anulează",
    statsTitle: "Chiar ajută ajutorul?",
    statsLead:
      "Ajutorul joacă acum cartea <strong>exact optimă</strong> (soluție completă belief-state, nu o euristică). " +
      "Măsurat pe <strong>100.000 de dueluri simulate</strong> împotriva unui calculator cu ordine aleatorie. " +
      "Monede = 1 pentru fiecare rundă câștigată, plus diferența de puncte ca bonus când câștigi duelul.",
    scPcTag: "🤖 Calculatorul începe", scPcSub: "dueluri câștigate cu ajutorul",
    scPcCmp: "față de 39% ghicire · ≈ 5,4 monede/joc · optim matematic",
    scMeTag: "🫵 Tu începi", scMeSub: "ajutor = clic orbește",
    scMeCmp: "ordinea e irelevantă matematic — nu te complica",
    scMixTag: "🎲 amestec 50 / 50", scMixSub: "dueluri câștigate cu ajutorul",
    scMixCmp: "față de 39% ghicire · ≈ 5,0 monede/joc",
    realCase: "★ ce se întâmplă de fapt în joc",
    statsFoot:
      "Concluzie: avantajul ajutorului este în întregime în rundele în care calculatorul începe și poți reacționa la culoarea lui. " +
      "Când începi tu, niciun instrument nu poate bate norocul — așa că spune doar \"joacă în ordine\".",
    recMeta: ({ colour }) => `calculatorul a arătat ${colour}`,
    overText: ({ m, coins, cls }) => `Diferență finală <span class="${cls}">${m}</span> · <strong>${coins}</strong> monede`,
    recordedRound: ({ n }) => `Runda ${n} salvată.`,
    finalCoins: ({ coins, m }) => `Gata — ${coins} monede (diferență ${m})`,
  },
  es: {
    subtitle: "Sugerencia de jugada de Duelo de los Videntes",
    pageIntro:
      "Ayudante gratuito para el evento de cartas de Metin2 <strong>Duelo de los Videntes</strong> (Seherwettstreit). " +
      "Dile quién empieza; si empieza el ordenador, rastrea las cartas ocultas y te dice exactamente qué carta jugar.",
    you: "Tú", opponent: "Rival", margin: "Margen", round: "Ronda", score: "Marcador",
    session: "Sesión", games: "Partidas", avgCoins: "Media monedas/partida",
    globalAllTime: "Todos (histórico)", coinDist: "Monedas por partida",
    statsScope: "Solo cuenta partidas donde empieza el ordenador (las que juega el ayudante). Las partidas “empiezas tú” no se registran — ahí cualquier orden es igual.",
    oppCardsLeft: "Cartas restantes del rival", black: "Negro", white: "Blanco",
    footer: "Ayudante clean-room para Metin2 · Duelo de los Videntes",
    allHelpers: "Todos los ayudantes",
    modelNote: "Modelo: el ordenador juega un orden de cartas aleatorio; el ayudante maximiza tu margen esperado (victorias − derrotas).",
    helpIntro: "Cómo usarlo:",
    helpLeader: "<strong>Elige quién empieza</strong> una vez — es fijo para toda la partida.",
    helpColour: "Si empieza el ordenador, toca el <strong>color</strong> que ves, juega la carta sugerida y registra el resultado.",
    helpResult: "<kbd>B</kbd>/<kbd>W</kbd> color, <kbd>1</kbd>/<kbd>0</kbd>/<kbd>2</kbd> = ganó/empate/perdió, <kbd>Backspace</kbd> deshacer, <kbd>Esc</kbd> nueva partida.",
    twitchChat: "Chat",
    twitchConsentBody: "<b>Cargar el chat de Twitch envía tu IP y cookies a Twitch.</b> Al hacer clic abajo aceptas esa conexión (revocable en la política de privacidad).",
    twitchConsentBtn: "Cargar chat de Twitch",
    twitchConsentRevoked: "Consentimiento del chat de Twitch revocado. Recarga la página.",
    revokeTwitchConsent: "Revocar consentimiento del chat de Twitch",
    likePrompt: "¿Te gusta el ayudante? ¡Dale un like!",
    supportText: "<strong>Este ayudante nunca tendrá anuncios.</strong> Si quieres apoyar el proyecto, puedes donar en <a href='https://paypal.me/jogoe' target='_blank' rel='noopener'>PayPal</a> &mdash; cada aporte significa mucho. ¡Gracias! &lt;3",
    impressum: "Aviso legal", privacy: "Privacidad",
    impressumTitle: "Aviso legal", datenschutzTitle: "Política de privacidad",
    whoFirst: "¿Quién empieza esta partida?",
    iStart: "Empiezo yo", iStartSub: "Pongo mi carta primero",
    pcStart: "Empieza el ordenador", pcStartSub: "Veo su color y luego respondo",
    leaderNote: "Fijo para toda la partida — elige quién puso la primera carta.",
    meTitle: "Empiezas tú — solo juega 0 → 8 en orden",
    meBody:
      "Cuando te comprometes antes de ver la carta del ordenador, <strong>cualquier orden tiene exactamente el mismo resultado esperado</strong> " +
      "(probado en 100.000 partidas simuladas: ~38,5% de victorias, da igual cómo). Así que no le des vueltas — pulsa 0, 1, 2 … 8 y ahorra energía.",
    meSeqHint: "Toca cada carta al jugarla — solo para no perder el sitio.",
    newGame: "Nueva partida", reset: "Reiniciar", meDone: "¡Las 9 jugadas — suerte! 🍀",
    colourQ: "¿De qué color es la carta del ordenador?",
    blackSub: "par · 0 2 4 6 8", whiteSub: "impar · 1 3 5 7",
    playThis: "Juega esta carta", resultQ: "¿Ganó tu carta?",
    won: "Ganó", wonSub: "la mía mayor", equal: "Empate", equalSub: "mismo número",
    lost: "Perdió", lostSub: "la mía menor", undo: "Deshacer",
    statsTitle: "¿De verdad ayuda el ayudante?",
    statsLead:
      "El ayudante ahora juega la carta <strong>exactamente óptima</strong> (solución completa de belief-state, no una heurística). " +
      "Medido en <strong>100.000 duelos simulados</strong> contra un ordenador con orden aleatorio. " +
      "Monedas = 1 por cada ronda ganada, más la diferencia de puntos como bono cuando ganas el duelo.",
    scPcTag: "🤖 Empieza el ordenador", scPcSub: "duelos ganados con el ayudante",
    scPcCmp: "frente al 39% adivinando · ≈ 5,4 monedas/partida · óptimo matemático",
    scMeTag: "🫵 Empiezas tú", scMeSub: "ayudante = pulsar a ciegas",
    scMeCmp: "el orden es matemáticamente irrelevante — no le des vueltas",
    scMixTag: "🎲 mezcla 50 / 50", scMixSub: "duelos ganados con el ayudante",
    scMixCmp: "frente al 39% adivinando · ≈ 5,0 monedas/partida",
    realCase: "★ lo que pasa de verdad en el juego",
    statsFoot:
      "En resumen: la ventaja del ayudante está totalmente en las rondas en que empieza el ordenador y puedes reaccionar a su color. " +
      "Cuando empiezas tú, ninguna herramienta supera al azar — por eso solo dice \"juega en orden\".",
    recMeta: ({ colour }) => `el ordenador mostró ${colour}`,
    overText: ({ m, coins, cls }) => `Margen final <span class="${cls}">${m}</span> · <strong>${coins}</strong> monedas`,
    recordedRound: ({ n }) => `Ronda ${n} guardada.`,
    finalCoins: ({ coins, m }) => `Listo — ${coins} monedas (margen ${m})`,
  },
  pl: {
    subtitle: "Podpowiedź ruchu Pojedynek Wróżbitów",
    pageIntro:
      "Darmowy pomocnik do karcianego eventu Metin2 <strong>Pojedynek Wróżbitów</strong> (Seherwettstreit). " +
      "Powiedz, kto zaczyna; jeśli zaczyna komputer, śledzi ukryte karty i mówi dokładnie, którą kartę zagrać.",
    you: "Ty", opponent: "Przeciwnik", margin: "Przewaga", round: "Runda", score: "Wynik",
    session: "Sesja", games: "Gry", avgCoins: "Śr. monet/grę",
    globalAllTime: "Wszyscy (łącznie)", coinDist: "Monety na grę",
    statsScope: "Liczy tylko gry, w których zaczyna komputer (te, które gra helper). Gry „ty zaczynasz“ nie są śledzone — tam każda kolejność jest równa.",
    oppCardsLeft: "Pozostałe karty przeciwnika", black: "Czarny", white: "Biały",
    footer: "Clean-room helper do Metin2 · Pojedynek Wróżbitów",
    allHelpers: "Wszystkie pomocniki",
    modelNote: "Model: komputer gra losową kolejność kart; helper maksymalizuje twoją oczekiwaną przewagę (wygrane − przegrane).",
    helpIntro: "Jak używać:",
    helpLeader: "<strong>Wybierz, kto zaczyna</strong> raz — to stałe na całą grę.",
    helpColour: "Jeśli zaczyna komputer, dotknij <strong>koloru</strong>, który widzisz, zagraj sugerowaną kartę, a potem zapisz wynik.",
    helpResult: "<kbd>B</kbd>/<kbd>W</kbd> kolor, <kbd>1</kbd>/<kbd>0</kbd>/<kbd>2</kbd> = wygrana/remis/przegrana, <kbd>Backspace</kbd> cofnij, <kbd>Esc</kbd> nowa gra.",
    twitchChat: "Czat",
    twitchConsentBody: "<b>Załadowanie czatu Twitcha wysyła twoje IP i pliki cookie do Twitcha.</b> Klikając poniżej, wyrażasz zgodę na to połączenie (odwoływalne w polityce prywatności).",
    twitchConsentBtn: "Załaduj czat Twitcha",
    twitchConsentRevoked: "Zgoda na czat Twitcha cofnięta. Odśwież stronę.",
    revokeTwitchConsent: "Cofnij zgodę na czat Twitcha",
    likePrompt: "Podoba ci się helper? Zostaw lajka!",
    supportText: "<strong>Ten helper nigdy nie będzie miał reklam.</strong> Jeśli chcesz wesprzeć projekt, możesz wpłacić na <a href='https://paypal.me/jogoe' target='_blank' rel='noopener'>PayPal</a> &mdash; każdy grosz wiele znaczy. Dziękuję! &lt;3",
    impressum: "Stopka redakcyjna", privacy: "Prywatność",
    impressumTitle: "Stopka redakcyjna", datenschutzTitle: "Polityka prywatności",
    whoFirst: "Kto zaczyna tę grę?",
    iStart: "Ja zaczynam", iStartSub: "Kładę kartę pierwszy",
    pcStart: "Komputer zaczyna", pcStartSub: "Widzę kolor, potem odpowiadam",
    leaderNote: "Stałe na całą grę — wybierz, kto położył pierwszą kartę.",
    meTitle: "Zaczynasz ty — po prostu zagraj 0 → 8 po kolei",
    meBody:
      "Gdy decydujesz się przed zobaczeniem karty komputera, <strong>każda kolejność ma dokładnie ten sam oczekiwany wynik</strong> " +
      "(udowodnione w 100 000 symulowanych gier: ~38,5% wygranych, tak czy siak). Więc nie kombinuj — klikaj 0, 1, 2 … 8 i oszczędzaj energię.",
    meSeqHint: "Dotykaj każdej karty, gdy ją zagrywasz — tylko by nie zgubić miejsca.",
    newGame: "Nowa gra", reset: "Resetuj", meDone: "Wszystkie 9 zagrane — powodzenia! 🍀",
    colourQ: "Jakiego koloru jest karta komputera?",
    blackSub: "parzyste · 0 2 4 6 8", whiteSub: "nieparzyste · 1 3 5 7",
    playThis: "Zagraj tę kartę", resultQ: "Czy twoja karta wygrała?",
    won: "Wygrana", wonSub: "moja wyższa", equal: "Remis", equalSub: "ta sama liczba",
    lost: "Przegrana", lostSub: "moja niższa", undo: "Cofnij",
    statsTitle: "Czy helper naprawdę pomaga?",
    statsLead:
      "Helper gra teraz <strong>dokładnie optymalną</strong> kartę (pełne rozwiązanie belief-state, nie heurystyka). " +
      "Zmierzone na <strong>100 000 symulowanych pojedynków</strong> przeciwko komputerowi z losową kolejnością. " +
      "Monety = 1 za każdą wygraną rundę, plus różnica punktów jako bonus, gdy wygrasz pojedynek.",
    scPcTag: "🤖 Komputer zaczyna", scPcSub: "pojedynki wygrane z helperem",
    scPcCmp: "vs 39% zgadywania · ≈ 5,4 monety/grę · matematycznie optymalne",
    scMeTag: "🫵 Ty zaczynasz", scMeSub: "helper = klikanie na ślepo",
    scMeCmp: "kolejność jest matematycznie bez znaczenia — nie kombinuj",
    scMixTag: "🎲 mix 50 / 50", scMixSub: "pojedynki wygrane z helperem",
    scMixCmp: "vs 39% zgadywania · ≈ 5,0 monety/grę",
    realCase: "★ co naprawdę dzieje się w grze",
    statsFoot:
      "Podsumowanie: przewaga helpera jest w całości w rundach, w których komputer zaczyna i możesz zareagować na jego kolor. " +
      "Gdy ty zaczynasz, żadne narzędzie nie pokona losu — więc mówi tylko \"graj po kolei\".",
    recMeta: ({ colour }) => `komputer pokazał ${colour}`,
    overText: ({ m, coins, cls }) => `Końcowa przewaga <span class="${cls}">${m}</span> · <strong>${coins}</strong> monet`,
    recordedRound: ({ n }) => `Runda ${n} zapisana.`,
    finalCoins: ({ coins, m }) => `Gotowe — ${coins} monet (przewaga ${m})`,
  },
};

const LANG_KEY = "seer-helper.lang.v1";
let lang = "en";
const listeners = new Set();

(function initLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && STRINGS[saved]) lang = saved;
    else if (typeof navigator !== "undefined") {
      const code = (navigator.language || "").slice(0, 2).toLowerCase();
      if (STRINGS[code]) lang = code;
    }
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
