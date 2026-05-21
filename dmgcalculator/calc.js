// Damage calc — operates on character/mob objects.

function targetKind(t) {
  if (t.kind === "metin") return "metin";
  if (t.kind === "boss")  return "boss";
  if (t.kind === "monster") return "monster";
  return "player";
}

function rollDamage(attacker, defender, attack, opts = {}) {
  const cls = CLASSES[attacker.cls] || CLASSES.warrior_body;
  const useMagic = cls.magic;
  const refine = REFINE_MULT[Math.max(0, Math.min(9, attacker.wpnRefine | 0))];

  const statAtk = cls.strCoef * attacker.str + (useMagic ? 2 * attacker.int : 0);
  const wMin = attacker.wpnMin * refine;
  const wMax = attacker.wpnMax * refine;
  const wRoll = opts.fixed === "min" ? wMin
              : opts.fixed === "max" ? wMax
              : wMin + Math.random() * (wMax - wMin);
  const magicRoll = useMagic ? attacker.wpnMagic * refine : 0;

  const flat = attacker.bAtkFlat + attacker.wpnAtkVal;

  // Elemental flat vs target resistances (defender may not define resistances → 0).
  let elemFlat = 0;
  for (const e of ELEMENTS) {
    const flatBonus = attacker["e" + cap(e)] || 0;
    const resist = defender["r" + cap(e)] || 0;
    elemFlat += flatBonus * (1 - resist / 100);
  }

  let atk = statAtk + wRoll + magicRoll + flat + elemFlat;
  atk *= 1 + attacker.bAtkPct / 100;

  // Attack mode.
  if (attack.mode === "skill") {
    atk *= (attack.power / 100) * attack.grade;
    atk *= 1 + attacker.bSkill / 100;
  } else {
    atk *= 1 + attacker.bAvg / 100;
  }

  // Target type.
  const tk = targetKind(defender);
  if (tk === "monster") atk *= 1 + attacker.bMonsters / 100;
  if (tk === "boss")    atk *= 1 + (attacker.bMonsters + attacker.bBoss) / 100;
  if (tk === "metin")   atk *= 1 + attacker.bMetin / 100;

  // Race bonus.
  const race = defender.race;
  if (race && race !== "none") {
    const racePct = attacker["bR" + cap(race)] || 0;
    atk *= 1 + racePct / 100;
  }

  const def = useMagic ? (defender.mdef || 0) : (defender.def || 0);
  let dmg = atk - def;
  if (dmg < 1) dmg = 1;
  dmg *= 1 - (defender.dr || 0) / 100;

  let critted = false, pierced = false;
  if (opts.proc === "crit") { dmg *= 2; critted = true; }
  else if (opts.proc === "pierce") { dmg += def * (1 - (defender.dr || 0) / 100); pierced = true; }
  else if (!opts.noProc) {
    if (Math.random() * 100 < attacker.bCrit)   { dmg *= 2; critted = true; }
    if (Math.random() * 100 < attacker.bPierce) { dmg += def * (1 - (defender.dr || 0) / 100); pierced = true; }
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
