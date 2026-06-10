// Damage calc — operates on character/mob objects.

function targetKind(t) {
  if (t.kind === "metin") return "metin";
  if (t.kind === "boss")  return "boss";
  if (t.kind === "monster") return "monster";
  return "player";
}

// Map defender race string to the attacker bonus field that boosts vs that race.
const RACE_TO_BONUS = {
  human:   "strongHalfHumans",
  animal:  "strongAnimals",
  orc:     "strongOrcs",
  mystic:  "strongMystics",
  undead:  "strongUndead",
  devil:   "strongDevils",
  insect:  "strongInsects",
  desert:  "strongDesert",
  zodiac:  "strongZodiac",
  dragon:  "strongDragons",
};

const num = (o, k) => Number(o[k]) || 0;

function rollDamage(attacker, defender, attack, opts = {}) {
  const cls = CLASSES[attacker.cls] || CLASSES.warrior_body;
  const useMagic = cls.magic;
  const refine = REFINE_MULT[Math.max(0, Math.min(9, attacker.wpnRefine | 0))];

  const statAtk = cls.strCoef * num(attacker, "str") + (useMagic ? 2 * num(attacker, "int") : 0);
  const wMin = num(attacker, "wpnMin") * refine;
  const wMax = num(attacker, "wpnMax") * refine;
  const wRoll = opts.fixed === "min" ? wMin
              : opts.fixed === "max" ? wMax
              : wMin + Math.random() * (wMax - wMin);
  const magicRoll = useMagic ? num(attacker, "wpnMagic") * refine : 0;

  // Flat attack: Attack Value (bonus) + weapon attack value + melee/magic attack flat.
  const flat = num(attacker, "atkValueFlat")
             + num(attacker, "meleeMagicAtk")
             + (useMagic ? num(attacker, "magicAtk") + num(attacker, "magicAtkBonus") : 0);

  // Elemental "Power of X" flat, reduced by defender's elemental resistance %.
  const elemPairs = [
    ["powFire", "resFire"], ["powIce", "resIce"], ["powLightning", "resLightning"],
    ["powWind", "resWind"], ["powEarth", "resEarth"], ["powDark", "resDark"],
  ];
  let elemFlat = 0;
  for (const [pk, rk] of elemPairs) {
    elemFlat += num(attacker, pk) * (1 - num(defender, rk) / 100);
  }

  let atk = statAtk + wRoll + magicRoll + flat + elemFlat;
  atk *= 1 + num(attacker, "atkValuePct") / 100;

  // Attack mode multipliers.
  if (attack.mode === "skill") {
    atk *= (attack.power / 100) * attack.grade;
    atk *= 1 + num(attacker, "skillDamage") / 100;
    atk *= 1 - num(defender, "resSkillDamage") / 100;
  } else {
    atk *= 1 + num(attacker, "avgDamage") / 100;
    atk *= 1 - num(defender, "resAvgDamage") / 100;
  }

  // Target type bonuses.
  const tk = targetKind(defender);
  if (tk === "monster" || tk === "boss") {
    atk *= 1 + num(attacker, "strongMonsters") / 100;
  }
  if (tk === "boss") {
    if (attack.mode === "skill") atk *= 1 + num(attacker, "bossDmgSkill") / 100;
    else                          atk *= 1 + num(attacker, "bossDmgAtk")   / 100;
  }
  if (tk === "metin") atk *= 1 + num(attacker, "strongMetin") / 100;

  // Race bonus (defender.race -> attacker bonus field).
  const race = defender.race;
  const raceField = RACE_TO_BONUS[race];
  if (raceField) atk *= 1 + num(attacker, raceField) / 100;

  // Magic-attack defender penalty: magic resistance / anti-magic reduce magic atk.
  if (useMagic) {
    atk *= 1 - num(defender, "magicResistance") / 100;
    atk *= 1 - num(defender, "antiMagic") / 100;
  }

  // Subtract defender defense. Mobs use `def`/`mdef`; characters use `defValueFlat`.
  const physDef = (defender.def !== undefined ? defender.def : num(defender, "defValueFlat"));
  const magDef  = (defender.mdef !== undefined ? defender.mdef : num(defender, "defValueFlat"));
  let defVal = (useMagic ? magDef : physDef) * (1 + num(defender, "defValuePct") / 100);

  let dmg = atk - defVal;
  if (dmg < 1) dmg = 1;
  dmg *= 1 - num(defender, "dr") / 100;

  let critted = false, pierced = false;
  const critChance  = Math.max(0, num(attacker, "critChance")   - num(defender, "resCrit"));
  const pierceChance= Math.max(0, num(attacker, "piercingHit")  - num(defender, "resPierce"));

  if (opts.proc === "crit")   { dmg *= 2; critted = true; }
  else if (opts.proc === "pierce") { dmg += defVal * (1 - num(defender, "dr") / 100); pierced = true; }
  else if (!opts.noProc) {
    if (Math.random() * 100 < critChance)   { dmg *= 2; critted = true; }
    if (Math.random() * 100 < pierceChance) { dmg += defVal * (1 - num(defender, "dr") / 100); pierced = true; }
  }

  return { dmg: Math.max(1, Math.round(dmg)), critted, pierced };
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function simulate(attacker, defender, attack, n = 20000) {
  const samples = new Array(n);
  let sum = 0, min = Infinity, max = 0;
  for (let i = 0; i < n; i++) {
    const r = rollDamage(attacker, defender, attack).dmg;
    samples[i] = r;
    sum += r;
    if (r < min) min = r;
    if (r > max) max = r;
  }
  return { samples, min, max, avg: Math.round(sum / n) };
}

function deterministic(attacker, defender, attack) {
  return {
    min: rollDamage(attacker, defender, attack, { fixed: "min", noProc: true }).dmg,
    max: rollDamage(attacker, defender, attack, { fixed: "max", noProc: true }).dmg,
    crit: rollDamage(attacker, defender, attack, { fixed: "max", noProc: true, proc: "crit" }).dmg,
    pierce: rollDamage(attacker, defender, attack, { fixed: "max", noProc: true, proc: "pierce" }).dmg,
  };
}
