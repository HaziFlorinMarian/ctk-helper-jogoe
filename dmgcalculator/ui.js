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
    ul.innerHTML = '<li class="empty small">No characters yet.</li>';
    return;
  }
  for (const c of state.characters) {
    const li = document.createElement("li");
    li.className = "entity" + (state.selectedId === c.id ? " active" : "");
    li.innerHTML = `
      <span class="ent-name">${escapeHtml(c.name)}</span>
      <span class="ent-meta">${CLASSES[c.cls]?.name || ""} · Lv ${c.level}</span>
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
      <span class="ent-name">${escapeHtml(m.name)}</span>
      <span class="ent-meta">${m.kind} · Lv ${m.level} · HP ${m.hp.toLocaleString()}</span>
    `;
    ul.appendChild(li);
  }
}

// ===== Edit form =====
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
  form.querySelectorAll("[data-f]").forEach(el => {
    const k = el.dataset.f;
    if (c[k] !== undefined) el.value = c[k];
  });
}

function bindEditForm() {
  document.getElementById("edit-form").addEventListener("input", e => {
    const k = e.target.dataset.f;
    if (!k) return;
    const c = state.characters.find(x => x.id === state.selectedId);
    if (!c) return;
    const v = e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    c[k] = v;
    saveState();
    renderCharList();
    renderSlots();
  });
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
  if (!confirm("Delete this character?")) return;
  state.characters = state.characters.filter(c => c.id !== state.selectedId);
  if (state.attackerId === state.selectedId) state.attackerId = null;
  if (state.defenderId === state.selectedId) state.defenderId = null;
  state.selectedId = null;
  saveState();
  renderAll();
});

// ===== Monster filter buttons =====
document.getElementById("btn-pick-monster").addEventListener("click", () => renderMobList("monster"));
document.getElementById("btn-pick-stone").addEventListener("click", () => renderMobList("metin"));

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
      <div class="combatant-label">${role === "attacker" ? "Who deals the damage?" : "Who takes the damage?"}</div>
    `;
  } else {
    slot.classList.add("filled");
    const sub = c.kind === "character"
      ? `${CLASSES[c.cls]?.name || ""} · Lv ${c.level}`
      : `${c.kind} · Lv ${c.level}`;
    slot.innerHTML = `
      <div class="combatant-name">${escapeHtml(c.name)}</div>
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
    ? [["Characters", state.characters]]
    : [["Characters", state.characters], ["Monsters", MOBS.filter(m => m.kind !== "metin")], ["Stones", MOBS.filter(m => m.kind === "metin")]];

  for (const [title, items] of sections) {
    if (!items.length) continue;
    const h = document.createElement("h4");
    h.textContent = title;
    list.appendChild(h);
    for (const it of items) {
      const btn = document.createElement("button");
      btn.className = "picker-item";
      btn.innerHTML = `<strong>${escapeHtml(it.name)}</strong>
        <span>${it.kind === "character" ? (CLASSES[it.cls]?.name || "") : it.kind} · Lv ${it.level}</span>`;
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
    alert("Pick both an attacker and a defender first.");
    return;
  }
  if (atk.kind !== "character") {
    alert("Attacker must be a character (monsters as attackers aren't supported yet).");
    return;
  }
  const attack = { ...state.attack };
  const det = deterministic(atk, def, attack);
  const sim = simulate(atk, def, attack, 20000);

  showLatest(atk, def, attack, det, sim);
  state.history.unshift({
    ts: Date.now(),
    attacker: atk.name, defender: def.name,
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
    tbody.innerHTML = `<tr id="history-empty"><td colspan="7" class="empty">No battle yet — pick two combatants and hit <em>Simulate the Battle</em>.</td></tr>`;
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
  if (!confirm("Clear all battle history?")) return;
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
  } catch { alert("Invalid file."); }
});

// ===== Helpers =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function renderAll() {
  renderCharList();
  renderEditForm();
  renderSlots();
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
