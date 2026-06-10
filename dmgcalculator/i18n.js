// Lightweight i18n for the damage calculator. Mirrors the pattern in ../ctk/i18n.js
// but plain script (no ES modules) since the rest of the app is global-script too.

const STRINGS = {
  en: {
    // Top bar
    appTitle: "Metin2 Damage Calculator",
    export: "Export",
    import: "Import",
    // Sections
    secCharMgmt: "Character Management",
    secBattle: "Battle Creation",
    secHistory: "Battle History",
    // Cards
    charList: "Character List",
    createChar: "+ Create a Character",
    monsterList: "Monster List",
    monsters: "Monsters",
    stones: "Stones",
    editChar: "Edit a Character",
    editEmpty: "Select a character to edit, or create one.",
    duplicate: "Duplicate",
    delete: "Delete",
    // Battle area
    whoDeals: "Who deals the damage?",
    whoTakes: "Who takes the damage?",
    chooseAttack: "Choose an attack",
    simulate: "⚔ Simulate the Battle",
    attackNormal: "Normal hit",
    attackSkill: "Skill",
    attackMounted: "Mounted",
    power: "Power %",
    grade: "Grade",
    // Results
    min: "Min",
    average: "Average",
    max: "Max",
    crit: "Crit (max)",
    hitsToKill: "Hits to kill",
    distribution: "Damage distribution",
    // History
    attacker: "Attacker",
    opponent: "Opponent",
    attack: "Attack",
    avg: "Average",
    clearHistory: "Clear history",
    historyEmpty: "No battle yet — pick two combatants and hit Simulate the Battle.",
    // Picker modal
    pickerTitle: "Select a combatant",
    cancel: "Cancel",
    characters: "Characters",
    // Edit-form sections
    sec_identity: "Identity",
    sec_weapon: "Weapon",
    sec_damageDefense: "Damage / Defense",
    sec_elemental: "Elemental Bonus",
    sec_classBonuses: "Class Bonuses & Parries",
    sec_weaponDefRupture: "Weapon Defenses & Ruptures",
    sec_otherBonuses: "Other Bonuses",
    sec_hidden: "Hidden Bonuses",
    sec_marriage: "Marriage / Love Items",
    sec_mountPoly: "Mount & Polymorph",
    // Footer
    footerNote: "Clean-room reimplementation inspired by the Metin2 community damage simulator. Formulas approximate — small differences from live are expected.",
    pickWeapon: "— pick a weapon —",
    confirmDeleteChar: "Delete this character?",
    confirmClearHistory: "Clear all battle history?",
    invalidFile: "Invalid file.",
    pickBoth: "Pick both an attacker and a defender first.",
    attackerMustBeChar: "Attacker must be a character (monsters as attackers aren't supported yet).",
  },
  de: {
    appTitle: "Metin2 Schadens-Rechner",
    export: "Exportieren",
    import: "Importieren",
    secCharMgmt: "Charakter-Verwaltung",
    secBattle: "Kampf-Erstellung",
    secHistory: "Kampf-Verlauf",
    charList: "Charakter-Liste",
    createChar: "+ Charakter erstellen",
    monsterList: "Monster-Liste",
    monsters: "Monster",
    stones: "Steine",
    editChar: "Charakter bearbeiten",
    editEmpty: "Wähle einen Charakter zum Bearbeiten, oder erstelle einen neuen.",
    duplicate: "Duplizieren",
    delete: "Löschen",
    whoDeals: "Wer macht den Schaden?",
    whoTakes: "Wer bekommt den Schaden?",
    chooseAttack: "Angriff wählen",
    simulate: "⚔ Kampf simulieren",
    attackNormal: "Normaler Treffer",
    attackSkill: "Fertigkeit",
    attackMounted: "Berittener Angriff",
    power: "Stärke %",
    grade: "Stufe",
    min: "Min",
    average: "Durchschnitt",
    max: "Max",
    crit: "Krit. (max)",
    hitsToKill: "Treffer zum Töten",
    distribution: "Schadens-Verteilung",
    attacker: "Angreifer",
    opponent: "Gegner",
    attack: "Angriff",
    avg: "Durchschnitt",
    clearHistory: "Verlauf löschen",
    historyEmpty: "Noch kein Kampf — wähle zwei Kämpfer und klicke auf Kampf simulieren.",
    pickerTitle: "Kämpfer wählen",
    cancel: "Abbrechen",
    characters: "Charaktere",
    sec_identity: "Identität",
    sec_weapon: "Waffe",
    sec_damageDefense: "Schaden / Verteidigung",
    sec_elemental: "Element-Bonus",
    sec_classBonuses: "Klassen-Boni & Parade",
    sec_weaponDefRupture: "Waffen-Verteidigung & Bruch",
    sec_otherBonuses: "Weitere Boni",
    sec_hidden: "Versteckte Boni",
    sec_marriage: "Hochzeits-Items",
    sec_mountPoly: "Reittier & Verwandlung",
    footerNote: "Saubere Neu-Implementierung inspiriert vom Metin2 Schadenssimulator der Community. Formeln sind Näherungen — kleine Abweichungen zum Live-Spiel sind zu erwarten.",
    pickWeapon: "— Waffe wählen —",
    confirmDeleteChar: "Diesen Charakter löschen?",
    confirmClearHistory: "Den ganzen Kampf-Verlauf löschen?",
    invalidFile: "Ungültige Datei.",
    pickBoth: "Wähle zuerst einen Angreifer und einen Verteidiger.",
    attackerMustBeChar: "Angreifer muss ein Charakter sein (Monster als Angreifer wird noch nicht unterstützt).",
  },
};

const LANG_KEY = "dmgcalc.lang";
function detectInitial() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && STRINGS[saved]) return saved;
  } catch {}
  const browser = (typeof navigator !== "undefined" ? navigator.language : "en").toLowerCase();
  if (browser.startsWith("de")) return "de";
  return "en";
}

let currentLang = detectInitial();
function getLang() { return currentLang; }
function setLang(lang) {
  if (!STRINGS[lang]) return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  document.documentElement.lang = lang;
  applyToDOM();
  if (typeof renderAll === "function") renderAll();
}

function t(key) {
  return STRINGS[currentLang][key] ?? STRINGS.en[key] ?? key;
}

// Pull localized string from a value that may be {en, de} or a plain string.
function L(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return v[currentLang] || v.en || Object.values(v)[0] || "";
}

function applyToDOM(root) {
  const r = root || document;
  if (!root) document.documentElement.lang = currentLang;
  r.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  r.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  r.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.setAttribute("title", t(el.dataset.i18nTitle));
  });
}
