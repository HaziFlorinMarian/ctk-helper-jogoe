// ===== State =====
const STORE_KEY = "dmgcalc.state.v2";
const state = loadState() || {
  characters: [],
  history: [],
  selectedId: null,
  attackerId: null,
  defenderId: null,
  attack: { mode: "normal", power: 100, grade: 1 },
};

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
}
function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function findCombatant(id) {
  return state.characters.find(c => c.id === id) || MOBS.find(m => m.id === id);
}

// ===== Character list =====
function renderCharList() {
  const ul = document.getElementById("char-list");
  ul.innerHTML = "";
  if (state.characters.length === 0) {
    ul.innerHTML = `<li class="empty small">${t("editEmpty")}</li>`;
    return;
  }
  for (const c of state.characters) {
    const li = document.createElement("li");
    li.className = "entity" + (state.selectedId === c.id ? " active" : "");
    li.innerHTML = `
      <span class="ent-name">${escapeHtml(c.name)}</span>
      <span class="ent-meta">${escapeHtml(L(CLASSES[c.cls]?.name))} · Lv ${c.level}</span>
    `;
    li.addEventListener("click", () => { state.selectedId = c.id; renderAll(); });
    ul.appendChild(li);
  }
}

function renderMobList(filter = "monster") {
  const ul = document.getElementById("mob-list");
  ul.innerHTML = "";
  const list = MOBS.filter(m => filter === "metin" ? m.kind === "metin" : m.kind !== "metin");
  for (const m of list) {
    const li = document.createElement("li");
    li.className = "entity";
    li.innerHTML = `
      <span class="ent-name">${escapeHtml(L(m.name))}</span>
      <span class="ent-meta">${m.kind} · Lv ${m.level} · HP ${m.hp.toLocaleString()}</span>
    `;
    ul.appendChild(li);
  }
}

// ===== Edit form (dynamic from FIELDS catalogue) =====
// Section meta — title comes from i18n key (sec_<group>).
const SECTION_META = {
  identity:         { open: true },
  weapon:           { open: true },
  damageDefense:    { open: false },
  elemental:        { open: false },
  classBonuses:     { open: false },
  weaponDefRupture: { open: false },
  otherBonuses:     { open: false },
  hidden:           { open: false },
  marriage:         { open: false },
  mountPoly:        { open: false },
};

function fieldInput(field, value) {
  const k = field.k;
  const v = value === undefined ? "" : value;
  if (field.type === "class") {
    return `<select data-f="${k}">${
      Object.entries(CLASSES).map(([id, c]) =>
        `<option value="${id}"${id === v ? " selected" : ""}>${escapeHtml(L(c.name))}</option>`).join("")
    }</select>`;
  }
  if (field.type === "weaponType") {
    const opts = [
      ["sword_1h","Sword (1H)"],["sword_2h","Sword (2H)"],["dagger","Dagger"],
      ["bow","Bow"],["bell","Bell"],["fan","Fan"],["claw","Claw"],["lame","Blade (Lame)"],
    ];
    return `<select data-f="${k}">${
      opts.map(([id, n]) => `<option value="${id}"${id === v ? " selected" : ""}>${n}</option>`).join("")
    }</select>`;
  }
  if (field.type === "weaponPreset") {
    const c = state.characters.find(x => x.id === state.selectedId) || {};
    const list = WEAPONS[c.wpnType] || [];
    const opts = list.map(w =>
      `<option value="${w.id}"${w.id === v ? " selected" : ""}>${escapeHtml(L(w.name))} (Lv ${w.level})</option>`).join("");
    return `<select data-f="${k}"><option value="">${t("pickWeapon")}</option>${opts}</select>`;
  }
  if (field.type === "bool") {
    return `<input type="checkbox" data-f="${k}"${v ? " checked" : ""} />`;
  }
  if (field.type === "text") {
    return `<input type="text" data-f="${k}" value="${escapeHtml(v)}" />`;
  }
  return `<input type="number" data-f="${k}" value="${v}" />`;
}

function renderEditForm() {
  const empty = document.getElementById("edit-empty");
  const form = document.getElementById("edit-form");
  const c = state.characters.find(x => x.id === state.selectedId);
  if (!c) {
    empty.classList.remove("hidden");
    form.classList.add("hidden");
    return;
  }
  empty.classList.add("hidden");
  form.classList.remove("hidden");

  const container = document.getElementById("edit-sections");
  let html = "";
  for (const [group, meta] of Object.entries(SECTION_META)) {
    const fields = FIELDS[group] || [];
    if (!fields.length) continue;
    html += `<details${meta.open ? " open" : ""}><summary>${t("sec_" + group)}</summary><div class="grid">`;
    for (const f of fields) {
      html += `<label>${escapeHtml(L(f.label))} ${fieldInput(f, c[f.k])}</label>`;
    }
    html += `</div></details>`;
  }
  container.innerHTML = html;
}

function bindEditForm() {
  const form = document.getElementById("edit-form");
  const handler = e => {
    const k = e.target.dataset.f;
    if (!k) return;
    const c = state.characters.find(x => x.id === state.selectedId);
    if (!c) return;
    let v;
    if (e.target.type === "checkbox") v = e.target.checked;
    else if (e.target.type === "number") v = parseFloat(e.target.value) || 0;
    else v = e.target.value;
    c[k] = v;

    // Auto-fill on weapon preset change.
    if (k === "wpnPreset" && v) {
      const w = (WEAPONS[c.wpnType] || []).find(x => x.id === v);
      if (w) {
        c.wpnMin = w.min;
        c.wpnMax = w.max;
        c.wpnMagic = w.magic;
      }
      renderEditForm();
    }
    // Reset preset when weapon type changes (list no longer matches).
    if (k === "wpnType") {
      c.wpnPreset = "";
      renderEditForm();
    }

    saveState();
    renderCharList();
    renderSlots();
  };
  form.addEventListener("input", handler);
  form.addEventListener("change", handler);
}

document.getElementById("btn-new-char").addEventListener("click", () => {
  const c = newCharacter("Character " + (state.characters.length + 1));
  state.characters.push(c);
  state.selectedId = c.id;
  saveState();
  renderAll();
});

document.getElementById("btn-duplicate").addEventListener("click", () => {
  const src = state.characters.find(c => c.id === state.selectedId);
  if (!src) return;
  const copy = { ...src, id: "char_" + Math.random().toString(36).slice(2, 9), name: src.name + " (copy)" };
  state.characters.push(copy);
  state.selectedId = copy.id;
  saveState();
  renderAll();
});

document.getElementById("btn-delete").addEventListener("click", () => {
  if (!confirm(t("confirmDeleteChar"))) return;
  state.characters = state.characters.filter(c => c.id !== state.selectedId);
  if (state.attackerId === state.selectedId) state.attackerId = null;
  if (state.defenderId === state.selectedId) state.defenderId = null;
  state.selectedId = null;
  saveState();
  renderAll();
});

// ===== Monster filter buttons =====
document.getElementById("btn-pick-monster").addEventListener("click", () => { mobFilter = "monster"; renderMobList(mobFilter); });
document.getElementById("btn-pick-stone").addEventListener("click", () => { mobFilter = "metin"; renderMobList(mobFilter); });

// ===== Battle combatant slots =====
function renderSlots() {
  renderSlot("attacker", state.attackerId);
  renderSlot("defender", state.defenderId);
}
function renderSlot(role, id) {
  const slot = document.getElementById("slot-" + role);
  const c = findCombatant(id);
  if (!c) {
    slot.classList.remove("filled");
    slot.innerHTML = `
      <div class="combatant-placeholder">+</div>
      <div class="combatant-label">${t(role === "attacker" ? "whoDeals" : "whoTakes")}</div>
    `;
  } else {
    slot.classList.add("filled");
    const displayName = c.kind === "character" ? c.name : L(c.name);
    const sub = c.kind === "character"
      ? `${escapeHtml(L(CLASSES[c.cls]?.name))} · Lv ${c.level}`
      : `${c.kind} · Lv ${c.level}`;
    slot.innerHTML = `
      <div class="combatant-name">${escapeHtml(displayName)}</div>
      <div class="combatant-sub">${sub}</div>
      <button class="combatant-clear" title="Remove">×</button>
    `;
    slot.querySelector(".combatant-clear").addEventListener("click", e => {
      e.stopPropagation();
      if (role === "attacker") state.attackerId = null; else state.defenderId = null;
      saveState(); renderSlots();
    });
  }
}

document.getElementById("slot-attacker").addEventListener("click", e => {
  if (e.target.classList.contains("combatant-clear")) return;
  openPicker("attacker");
});
document.getElementById("slot-defender").addEventListener("click", e => {
  if (e.target.classList.contains("combatant-clear")) return;
  openPicker("defender");
});

// ===== Picker modal =====
function openPicker(role) {
  const modal = document.getElementById("picker");
  const list = document.getElementById("picker-list");
  list.innerHTML = "";

  const sections = role === "attacker"
    ? [[t("characters"), state.characters]]
    : [[t("characters"), state.characters], [t("monsters"), MOBS.filter(m => m.kind !== "metin")], [t("stones"), MOBS.filter(m => m.kind === "metin")]];

  for (const [title, items] of sections) {
    if (!items.length) continue;
    const h = document.createElement("h4");
    h.textContent = title;
    list.appendChild(h);
    for (const it of items) {
      const btn = document.createElement("button");
      btn.className = "picker-item";
      const itName = it.kind === "character" ? it.name : L(it.name);
      btn.innerHTML = `<strong>${escapeHtml(itName)}</strong>
        <span>${escapeHtml(it.kind === "character" ? L(CLASSES[it.cls]?.name) : it.kind)} · Lv ${it.level}</span>`;
      btn.addEventListener("click", () => {
        if (role === "attacker") state.attackerId = it.id; else state.defenderId = it.id;
        saveState();
        renderSlots();
        modal.classList.add("hidden");
      });
      list.appendChild(btn);
    }
  }
  modal.classList.remove("hidden");
}
document.getElementById("picker-close").addEventListener("click", () =>
  document.getElementById("picker").classList.add("hidden"));
document.getElementById("picker").addEventListener("click", e => {
  if (e.target.id === "picker") e.target.classList.add("hidden");
});

// ===== Attack mode picker =====
document.querySelectorAll(".atk-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".atk-btn").forEach(b => b.classList.toggle("active", b === btn));
    state.attack.mode = btn.dataset.mode;
    document.getElementById("skill-extras").style.display =
      state.attack.mode === "skill" ? "flex" : "none";
    saveState();
  });
});
document.getElementById("skill-power").addEventListener("input", e => {
  state.attack.power = parseFloat(e.target.value) || 0;
  saveState();
});
document.getElementById("skill-grade").addEventListener("change", e => {
  state.attack.grade = parseFloat(e.target.value) || 1;
  saveState();
});

// ===== Simulate =====
document.getElementById("btn-simulate").addEventListener("click", () => {
  const atk = findCombatant(state.attackerId);
  const def = findCombatant(state.defenderId);
  if (!atk || !def) {
    alert(t("pickBoth"));
    return;
  }
  if (atk.kind !== "character") {
    alert(t("attackerMustBeChar"));
    return;
  }
  const attack = { ...state.attack };
  const det = deterministic(atk, def, attack);
  const sim = simulate(atk, def, attack, 20000);

  showLatest(atk, def, attack, det, sim);
  state.history.unshift({
    ts: Date.now(),
    attacker: atk.kind === "character" ? atk.name : L(atk.name),
    defender: def.kind === "character" ? def.name : L(def.name),
    mode: attack.mode,
    avg: sim.avg, min: det.min, max: det.max,
  });
  if (state.history.length > 50) state.history.pop();
  saveState();
  renderHistory();
});

function showLatest(atk, def, attack, det, sim) {
  document.getElementById("latest-result").classList.remove("hidden");
  document.getElementById("out-min").textContent = det.min.toLocaleString();
  document.getElementById("out-max").textContent = det.max.toLocaleString();
  document.getElementById("out-avg").textContent = sim.avg.toLocaleString();
  document.getElementById("out-crit").textContent = det.crit.toLocaleString();
  const htk = def.hp > 0 ? Math.ceil(def.hp / Math.max(1, sim.avg)) : 0;
  document.getElementById("out-htk").textContent = htk.toLocaleString();
  drawChart(sim.samples, sim.min, sim.max);
}

function drawChart(samples, min, max) {
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = 160;
  ctx.clearRect(0, 0, w, h);
  if (max <= min) return;
  const bins = 60;
  const buckets = new Array(bins).fill(0);
  const span = max - min;
  for (const s of samples) {
    let idx = Math.floor((s - min) / span * bins);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    buckets[idx]++;
  }
  const peak = Math.max(...buckets);
  const bw = w / bins;
  ctx.fillStyle = "#8b2a1f";
  for (let i = 0; i < bins; i++) {
    const bh = (buckets[i] / peak) * (h - 24);
    ctx.fillRect(i * bw + 1, h - bh - 14, bw - 2, bh);
  }
  ctx.fillStyle = "#7a6a4a";
  ctx.font = "11px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(min.toLocaleString(), 4, h - 2);
  ctx.textAlign = "right";
  ctx.fillText(max.toLocaleString(), w - 4, h - 2);
}

// ===== History =====
function renderHistory() {
  const tbody = document.getElementById("history-body");
  tbody.innerHTML = "";
  if (state.history.length === 0) {
    tbody.innerHTML = `<tr id="history-empty"><td colspan="7" class="empty">${t("historyEmpty")}</td></tr>`;
    return;
  }
  state.history.forEach((h, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(h.attacker)}</td>
      <td>${escapeHtml(h.defender)}</td>
      <td>${h.mode}</td>
      <td><strong>${h.avg.toLocaleString()}</strong></td>
      <td>${h.min.toLocaleString()}</td>
      <td>${h.max.toLocaleString()}</td>
      <td><button class="row-del" data-i="${idx}">×</button></td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll(".row-del").forEach(b => b.addEventListener("click", e => {
    state.history.splice(parseInt(e.target.dataset.i, 10), 1);
    saveState(); renderHistory();
  }));
}
document.getElementById("btn-clear-history").addEventListener("click", () => {
  if (!confirm(t("confirmClearHistory"))) return;
  state.history = [];
  saveState(); renderHistory();
});

// ===== Export / Import =====
document.getElementById("btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dmgcalc-state.json";
  a.click();
});
document.getElementById("btn-import").addEventListener("click", () => document.getElementById("file-import").click());
document.getElementById("file-import").addEventListener("change", async e => {
  const f = e.target.files[0];
  if (!f) return;
  const txt = await f.text();
  try {
    const data = JSON.parse(txt);
    Object.assign(state, data);
    saveState(); renderAll();
  } catch { alert(t("invalidFile")); }
});

// ===== Language switcher =====
document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => setLang(btn.dataset.lang));
});
function refreshLangButtons() {
  document.querySelectorAll(".lang-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.lang === getLang()));
}

// ===== Helpers =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

let mobFilter = "monster";
function renderAll() {
  applyToDOM();
  refreshLangButtons();
  renderCharList();
  renderEditForm();
  renderSlots();
  renderMobList(mobFilter);
  renderHistory();
}

// Init
renderMobList("monster");
renderAll();
bindEditForm();
// Restore attack picker
document.querySelectorAll(".atk-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === state.attack.mode));
if (state.attack.mode === "skill") document.getElementById("skill-extras").style.display = "flex";
document.getElementById("skill-power").value = state.attack.power;
document.getElementById("skill-grade").value = state.attack.grade;
