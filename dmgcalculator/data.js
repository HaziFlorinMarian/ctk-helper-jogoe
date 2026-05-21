// Class definitions — public-knowledge approximations.
const CLASSES = {
  warrior_body:      { name: "Warrior · Body",       strCoef: 2, weapon: "sword_2h", magic: false },
  warrior_mental:    { name: "Warrior · Mental",     strCoef: 2, weapon: "sword_1h", magic: false },
  ninja_blade:       { name: "Ninja · Blade",        strCoef: 2, weapon: "dagger",   magic: false },
  ninja_bow:         { name: "Ninja · Bow",          strCoef: 2, weapon: "bow",      magic: false },
  sura_weapon:       { name: "Sura · Weapon",        strCoef: 2, weapon: "sword_1h", magic: false },
  sura_black_magic:  { name: "Sura · Black Magic",   strCoef: 1, weapon: "sword_1h", magic: true  },
  shaman_dragon:     { name: "Shaman · Dragon",      strCoef: 1, weapon: "fan",      magic: true  },
  shaman_healing:    { name: "Shaman · Healing",     strCoef: 1, weapon: "bell",     magic: true  },
  lycan:             { name: "Lycan",                strCoef: 2, weapon: "claw",     magic: false },
};

const REFINE_MULT = [1.00, 1.03, 1.06, 1.09, 1.12, 1.16, 1.20, 1.25, 1.30, 1.40];

const RACES = ["human", "animal", "orc", "mystic", "undead", "devil"];
const ELEMENTS = ["fire", "ice", "lightning", "wind", "earth", "dark"];

// Built-in monsters / bosses / metin stones. Stat values are scaled approximations
// based on public game progression — tune as needed for your server.
const MOBS = [
  // ===== Map 1 — animals & wolves =====
  { id: "wild_dog",        name: "Wild Dog",           kind: "monster", race: "animal", level: 1,   hp: 100,     def: 5,   mdef: 2   },
  { id: "stray_dog",       name: "Stray Dog",          kind: "monster", race: "animal", level: 3,   hp: 180,     def: 8,   mdef: 3   },
  { id: "wolf_cub",        name: "Wolf Cub",           kind: "monster", race: "animal", level: 5,   hp: 280,     def: 12,  mdef: 5   },
  { id: "wild_boar",       name: "Wild Boar",          kind: "monster", race: "animal", level: 8,   hp: 600,     def: 18,  mdef: 8   },
  { id: "grey_wolf",       name: "Grey Wolf",          kind: "monster", race: "animal", level: 12,  hp: 1100,    def: 28,  mdef: 12  },
  { id: "black_wolf",      name: "Black Wolf",         kind: "monster", race: "animal", level: 17,  hp: 1900,    def: 40,  mdef: 18  },
  { id: "wolf_chief",      name: "Wolf Chief",         kind: "boss",    race: "animal", level: 18,  hp: 60000,   def: 80,  mdef: 40  },
  { id: "bandit",          name: "Bandit",             kind: "monster", race: "human",  level: 10,  hp: 800,     def: 22,  mdef: 10  },
  { id: "bandit_archer",   name: "Bandit Archer",      kind: "monster", race: "human",  level: 14,  hp: 1300,    def: 30,  mdef: 14  },
  { id: "bandit_leader",   name: "Bandit Leader",      kind: "boss",    race: "human",  level: 20,  hp: 80000,   def: 95,  mdef: 50  },

  // ===== Map 1 — orcs =====
  { id: "orc",             name: "Orc",                kind: "monster", race: "orc",    level: 18,  hp: 2200,    def: 45,  mdef: 20  },
  { id: "orc_warrior",     name: "Orc Warrior",        kind: "monster", race: "orc",    level: 22,  hp: 3400,    def: 60,  mdef: 28  },
  { id: "orc_archer",      name: "Orc Archer",         kind: "monster", race: "orc",    level: 25,  hp: 4500,    def: 70,  mdef: 32  },
  { id: "orc_warlord",     name: "Orc Warlord",        kind: "monster", race: "orc",    level: 28,  hp: 6500,    def: 90,  mdef: 45  },
  { id: "orc_lord",        name: "Orc Lord",           kind: "boss",    race: "orc",    level: 30,  hp: 180000,  def: 140, mdef: 80  },
  { id: "dark_ghost",      name: "Dark Ghost",         kind: "monster", race: "undead", level: 24,  hp: 4000,    def: 70,  mdef: 50  },

  // ===== Map 2 — desert & ghosts =====
  { id: "esoteric_seeker", name: "Esoteric Seeker",    kind: "monster", race: "mystic", level: 30,  hp: 7500,    def: 110, mdef: 80  },
  { id: "esoteric_assassin",name:"Esoteric Assassin",  kind: "monster", race: "mystic", level: 34,  hp: 10500,   def: 140, mdef: 95  },
  { id: "esoteric_pikeman",name: "Esoteric Pikeman",   kind: "monster", race: "mystic", level: 36,  hp: 12500,   def: 160, mdef: 105 },
  { id: "esoteric_warlord",name: "Esoteric Warlord",   kind: "boss",    race: "mystic", level: 40,  hp: 250000,  def: 230, mdef: 160 },
  { id: "scarecrow",       name: "Scarecrow",          kind: "monster", race: "undead", level: 32,  hp: 9000,    def: 130, mdef: 90  },
  { id: "ghost_warrior",   name: "Ghost Warrior",      kind: "monster", race: "undead", level: 38,  hp: 15000,   def: 180, mdef: 130 },

  // ===== Map 3 — Yongbi desert =====
  { id: "razor_claw",      name: "Razor Claw",         kind: "monster", race: "animal", level: 42,  hp: 18500,   def: 210, mdef: 130 },
  { id: "desert_bandit",   name: "Desert Bandit",      kind: "monster", race: "human",  level: 44,  hp: 21000,   def: 230, mdef: 150 },
  { id: "salamander",      name: "Salamander",         kind: "monster", race: "mystic", level: 46,  hp: 24000,   def: 250, mdef: 170 },
  { id: "snake_lady",      name: "Snake Lady",         kind: "boss",    race: "mystic", level: 50,  hp: 420000,  def: 320, mdef: 240 },
  { id: "death_reaper",    name: "Death Reaper",       kind: "monster", race: "undead", level: 48,  hp: 28000,   def: 290, mdef: 200 },
  { id: "demon_spider",    name: "Demon Spider",       kind: "monster", race: "mystic", level: 52,  hp: 35000,   def: 320, mdef: 220 },

  // ===== Spider Dungeon =====
  { id: "spider_baby",     name: "Spider Baby",        kind: "monster", race: "mystic", level: 50,  hp: 30000,   def: 290, mdef: 200 },
  { id: "spider_arrow",    name: "Spider Arrow",       kind: "monster", race: "mystic", level: 55,  hp: 42000,   def: 340, mdef: 240 },
  { id: "spider_queen",    name: "Spider Queen",       kind: "boss",    race: "mystic", level: 60,  hp: 1500000, def: 480, mdef: 360 },

  // ===== Demon Tower / Devil's Tower =====
  { id: "tower_zombie",    name: "Tower Zombie",       kind: "monster", race: "undead", level: 55,  hp: 45000,   def: 360, mdef: 260 },
  { id: "tower_phantom",   name: "Tower Phantom",      kind: "monster", race: "undead", level: 60,  hp: 60000,   def: 410, mdef: 300 },
  { id: "tower_demon",     name: "Tower Demon",        kind: "monster", race: "devil",  level: 65,  hp: 80000,   def: 470, mdef: 340 },
  { id: "tartaros",        name: "Demon King · Tartaros", kind: "boss", race: "devil",  level: 70,  hp: 3500000, def: 700, mdef: 520 },

  // ===== Snake Field / Ice Land =====
  { id: "ice_witch",       name: "Ice Witch",          kind: "monster", race: "mystic", level: 70,  hp: 95000,   def: 530, mdef: 420 },
  { id: "ice_golem",       name: "Ice Golem",          kind: "monster", race: "mystic", level: 75,  hp: 130000,  def: 620, mdef: 450 },
  { id: "frost_giant",     name: "Frost Giant",        kind: "monster", race: "mystic", level: 78,  hp: 160000,  def: 680, mdef: 470 },
  { id: "snow_witch",      name: "Boss · Snow Witch",  kind: "boss",    race: "mystic", level: 80,  hp: 4500000, def: 820, mdef: 640 },
  { id: "nemere",          name: "Boss · Nemere",      kind: "boss",    race: "devil",  level: 95,  hp: 7000000, def: 1050, mdef: 820 },

  // ===== Sungzi / Devil's Catacomb =====
  { id: "skeleton_soldier",name: "Skeleton Soldier",   kind: "monster", race: "undead", level: 80,  hp: 180000,  def: 720, mdef: 500 },
  { id: "skeleton_warrior",name: "Skeleton Warrior",   kind: "monster", race: "undead", level: 84,  hp: 220000,  def: 780, mdef: 540 },
  { id: "skeleton_lord",   name: "Skeleton Lord",      kind: "monster", race: "undead", level: 88,  hp: 270000,  def: 850, mdef: 590 },
  { id: "death_horse",     name: "Death Horse",        kind: "monster", race: "undead", level: 90,  hp: 310000,  def: 900, mdef: 620 },
  { id: "death_rider",     name: "Boss · Death Rider", kind: "boss",    race: "undead", level: 95,  hp: 6000000, def: 1000, mdef: 780 },

  // ===== Razador's Lair / Beran-Setaou =====
  { id: "fire_imp",        name: "Fire Imp",           kind: "monster", race: "devil",  level: 95,  hp: 350000,  def: 950, mdef: 700 },
  { id: "lava_minion",     name: "Lava Minion",        kind: "monster", race: "devil",  level: 100, hp: 450000,  def: 1050, mdef: 780 },
  { id: "razador",         name: "Boss · Razador",     kind: "boss",    race: "devil",  level: 105, hp: 9000000, def: 1300, mdef: 980 },
  { id: "beran_setaou",    name: "Boss · Beran-Setaou",kind: "boss",    race: "devil",  level: 105, hp: 9500000, def: 1320, mdef: 1000 },

  // ===== High-end & raid bosses =====
  { id: "bairog",          name: "Boss · Bairog",      kind: "boss",    race: "devil",  level: 110, hp: 12000000, def: 1450, mdef: 1100 },
  { id: "aqua_dragon",     name: "Boss · Aqua Dragon", kind: "boss",    race: "mystic", level: 110, hp: 12000000, def: 1400, mdef: 1200 },
  { id: "meley",           name: "Boss · Meley",       kind: "boss",    race: "devil",  level: 115, hp: 18000000, def: 1600, mdef: 1300 },

  // ===== Metin stones (by tier) =====
  { id: "stone_quietude",  name: "Metin of Quietude",  kind: "metin",   race: "none",   level: 12,  hp: 2400,    def: 35,  mdef: 25  },
  { id: "stone_bravery",   name: "Metin of Bravery",   kind: "metin",   race: "none",   level: 18,  hp: 4500,    def: 60,  mdef: 40  },
  { id: "stone_restraint", name: "Metin of Restraint", kind: "metin",   race: "none",   level: 24,  hp: 7000,    def: 90,  mdef: 60  },
  { id: "stone_soul",      name: "Metin of Soul",      kind: "metin",   race: "none",   level: 30,  hp: 11000,   def: 130, mdef: 90  },
  { id: "stone_pain",      name: "Metin of Pain",      kind: "metin",   race: "none",   level: 36,  hp: 16000,   def: 170, mdef: 120 },
  { id: "stone_chaos",     name: "Metin of Chaos",     kind: "metin",   race: "none",   level: 42,  hp: 24000,   def: 220, mdef: 160 },
  { id: "stone_death",     name: "Metin of Death",     kind: "metin",   race: "none",   level: 48,  hp: 34000,   def: 280, mdef: 200 },
  { id: "stone_greed",     name: "Metin of Greed",     kind: "metin",   race: "none",   level: 55,  hp: 50000,   def: 350, mdef: 250 },
  { id: "stone_madness",   name: "Metin of Madness",   kind: "metin",   race: "none",   level: 62,  hp: 72000,   def: 430, mdef: 310 },
  { id: "stone_crime",     name: "Metin of Crime",     kind: "metin",   race: "none",   level: 70,  hp: 105000,  def: 530, mdef: 380 },
  { id: "stone_murder",    name: "Metin of Murder",    kind: "metin",   race: "none",   level: 78,  hp: 150000,  def: 640, mdef: 460 },
  { id: "stone_possession",name: "Metin of Possession",kind: "metin",   race: "none",   level: 86,  hp: 215000,  def: 760, mdef: 550 },
  { id: "stone_curse",     name: "Metin of Curse",     kind: "metin",   race: "none",   level: 95,  hp: 320000,  def: 900, mdef: 660 },
  { id: "stone_oblivion",  name: "Metin of Oblivion",  kind: "metin",   race: "none",   level: 100, hp: 450000,  def: 1050, mdef: 780 },
  { id: "stone_devil",     name: "Metin of the Devil", kind: "metin",   race: "none",   level: 105, hp: 600000,  def: 1200, mdef: 900 },
];

// Empty character template.
function newCharacter(name) {
  return {
    id: "char_" + Math.random().toString(36).slice(2, 9),
    kind: "character",
    name: name || "New Character",
    cls: "warrior_body",
    level: 120,
    str: 90, dex: 48, vit: 48, int: 48,
    wpnType: "sword_2h", wpnMin: 120, wpnMax: 180, wpnMagic: 0, wpnRefine: 9, wpnAtkVal: 60,
    hp: 5000, def: 400, mdef: 200, dr: 0,
    rFire: 0, rIce: 0, rLightning: 0, rWind: 0, rEarth: 0, rDark: 0,
    bAvg: 20, bSkill: 20, bAtkPct: 9, bAtkFlat: 40,
    bMonsters: 20, bBoss: 0, bMetin: 20, bCrit: 10, bPierce: 10,
    bRHuman: 0, bRAnimal: 0, bROrc: 0, bRMystic: 0, bRUndead: 0, bRDevil: 0,
    eFire: 0, eIce: 0, eLightning: 0, eWind: 0, eEarth: 0, eDark: 0,
  };
}
