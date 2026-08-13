/* Focus Companion — app logic (state, timer, rewards, shop, tasks). */

const STORAGE_KEY = "focusCompanion.v1";

const GIFTS = [
  { icon: "🎁", name: "Mystery Box", fish: 3 },
  { icon: "🐠", name: "Little Fish", fish: 1 },
  { icon: "🧶", name: "Yarn Ball", fish: 2 },
  { icon: "🍪", name: "Treat", fish: 2 },
  { icon: "🌟", name: "Shiny Star", fish: 4 },
  { icon: "📚", name: "Old Book", fish: 2 },
];

const TRASH = [
  { icon: "🗑️", name: "Crumpled Paper" },
  { icon: "🥫", name: "Empty Can" },
  { icon: "🧦", name: "Lost Sock" },
];

const DECOR = [
  { id: "rug-blue", name: "Blue Rug", icon: "🟦", price: 5 },
  { id: "rug-red", name: "Red Rug", icon: "🟥", price: 5 },
  { id: "plant", name: "Potted Plant", icon: "🪴", price: 8 },
  { id: "lamp", name: "Warm Lamp", icon: "🛋️", price: 8 },
  { id: "window", name: "Sunset Window", icon: "🌇", price: 12 },
  { id: "shelf", name: "Bookshelf", icon: "📚", price: 12 },
];

const defaultState = () => ({
  companionId: null,
  fish: 0,
  giftsReceived: 0,
  sessionsCompleted: 0,
  focusMinutes: 0,
  streakDays: 0,
  lastSessionDate: null,
  tasks: [],
  activeTaskId: null,
  ownedDecor: [],
  customizations: {},
});

let state = loadState();

function getCustomization(id) {
  return Object.assign(defaultCustomization(), (state.customizations && state.customizations[id]) || {});
}

/* companion id currently being edited on the customize screen, and its unsaved draft */
let customizeTargetId = null;
let draftCustomization = defaultCustomization();

let timer = {
  mode: "pomodoro",
  durationMin: 25,
  remainingSec: 25 * 60,
  elapsedSec: 0,
  running: false,
  tickHandle: null,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------------------------- element refs ---------------------------- */
const el = (id) => document.getElementById(id);
const screenSelect = el("screen-select");
const screenCustomize = el("screen-customize");
const screenFocus = el("screen-focus");
const companionGrid = el("companion-grid");
const chairStage = el("chair-stage");
const roomDecor = el("room-decor");
const activeTaskBanner = el("active-task-banner");
const clockEl = el("clock");
const clockCaption = el("clock-caption");
const btnStart = el("btn-start");
const btnPause = el("btn-pause");
const btnStop = el("btn-stop");
const fishCountEl = el("fish-count");
const taskCountEl = el("task-count");

/* ------------------------------ rendering ------------------------------ */

function renderCompanionGrid() {
  companionGrid.innerHTML = "";
  ALL_COMPANIONS.forEach((c) => {
    const card = document.createElement("button");
    card.className = "companion-card";
    card.innerHTML = `
      <div class="companion-card-art">${renderCompanionArt(c, "idle", getCustomization(c.id))}</div>
      <div class="companion-card-name">${c.name}</div>
      <div class="companion-card-species">${c.species}</div>
      <div class="companion-card-tagline">${c.tagline}</div>
    `;
    card.addEventListener("click", () => openCustomize(c.id, { fromSelect: true }));
    companionGrid.appendChild(card);
  });
}

/* All top-level screens in the app, including Classroom Mode's — kept in one
   place so any entry point can switch screens without leaving a stale one
   visible underneath. */
const ALL_SCREEN_IDS = [
  "screen-select",
  "screen-customize",
  "screen-focus",
  "screen-classroom-home",
  "screen-classroom-teacher-login",
  "screen-my-classes",
  "screen-classroom-host",
  "screen-classroom-join",
  "screen-classroom-teacher",
  "screen-classroom-student",
];

function showOnlyScreen(id) {
  ALL_SCREEN_IDS.forEach((sid) => {
    const node = el(sid);
    if (node) node.classList.toggle("hidden", sid !== id);
  });
}

function showFocusScreen() {
  showOnlyScreen("screen-focus");
  renderChair();
  renderDecor();
  renderActiveTaskBanner();
}

function showSelectScreen() {
  showOnlyScreen("screen-select");
  renderCompanionGrid();
}

function renderChair(companionState = "idle") {
  const c = getCompanion(state.companionId);
  chairStage.innerHTML = renderCompanionArt(c, companionState, getCustomization(state.companionId));
}

/* ---------------------------- customize screen --------------------------- */

function openCustomize(companionId, { fromSelect }) {
  customizeTargetId = companionId;
  draftCustomization = getCustomization(companionId);
  el("customize-title").textContent = `Customize ${getCompanion(companionId).name}`;
  renderCustomizeOptions();
  renderCustomizePreview();

  showOnlyScreen("screen-customize");

  el("customize-back").onclick = () => {
    if (fromSelect) {
      showSelectScreen();
    } else {
      showFocusScreen();
    }
  };
}

function renderCustomizePreview() {
  el("customize-preview").innerHTML = renderCompanionArt(getCompanion(customizeTargetId), "idle", draftCustomization);
}

function renderOptionRow(containerId, options, key, formatLabel) {
  const wrap = el(containerId);
  wrap.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch-btn" + (draftCustomization[key] === opt.id ? " active" : "");
    if (opt.colors) {
      btn.classList.add("swatch-color");
      btn.style.setProperty("--swatch-color", opt.colors.body);
    }
    btn.textContent = formatLabel(opt);
    btn.addEventListener("click", () => {
      draftCustomization[key] = opt.id;
      renderCustomizeOptions();
      renderCustomizePreview();
    });
    wrap.appendChild(btn);
  });
}

function renderCustomizeOptions() {
  renderOptionRow("opt-color", PALETTES, "colorId", (p) => p.name);
  renderOptionRow("opt-size", SIZES, "sizeId", (s) => s.label);
  renderOptionRow("opt-age", AGES, "ageId", (a) => a.label);
  renderOptionRow("opt-temperament", TEMPERAMENTS, "temperamentId", (t) => `${t.icon} ${t.label}`);
}

function renderDecor() {
  roomDecor.innerHTML = state.ownedDecor
    .map((id) => {
      const item = DECOR.find((d) => d.id === id);
      return item ? `<span class="decor-badge" title="${item.name}">${item.icon}</span>` : "";
    })
    .join("");
}

function renderActiveTaskBanner() {
  const task = state.tasks.find((t) => t.id === state.activeTaskId && !t.done);
  activeTaskBanner.innerHTML = task
    ? `<span class="banner-label">Focusing on:</span> ${escapeHTML(task.text)}`
    : "";
}

function renderTopbar() {
  fishCountEl.textContent = state.fish;
  taskCountEl.textContent = state.tasks.filter((t) => !t.done).length;
}

function escapeHTML(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/* -------------------------------- timer -------------------------------- */

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateClockDisplay() {
  if (timer.mode === "pomodoro") {
    clockEl.textContent = formatTime(timer.remainingSec);
  } else {
    clockEl.textContent = formatTime(timer.elapsedSec);
  }
}

function setMode(mode) {
  if (timer.running) return;
  timer.mode = mode;
  document.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  el("duration-row").classList.toggle("hidden", mode !== "pomodoro");
  btnStop.textContent = mode === "pomodoro" ? "Give Up" : "Finish Session";
  resetTimerValues();
  updateClockDisplay();
  clockCaption.textContent = "Ready when you are";
}

function setDuration(min) {
  if (timer.running) return;
  timer.durationMin = min;
  document.querySelectorAll(".dur-btn").forEach((b) => b.classList.toggle("active", Number(b.dataset.min) === min));
  resetTimerValues();
  updateClockDisplay();
}

function resetTimerValues() {
  timer.remainingSec = timer.durationMin * 60;
  timer.elapsedSec = 0;
}

function startTimer() {
  if (timer.running) return;
  timer.running = true;
  btnStart.disabled = true;
  btnPause.disabled = false;
  btnStop.disabled = false;
  document.querySelectorAll(".mode-btn, .dur-btn").forEach((b) => (b.disabled = true));
  clockCaption.textContent = "Focusing…";
  renderChair("focus");
  timer.tickHandle = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!timer.running) return;
  clearInterval(timer.tickHandle);
  timer.running = false;
  btnStart.disabled = false;
  btnStart.textContent = "Resume";
  btnPause.disabled = true;
  clockCaption.textContent = "Paused";
  renderChair("idle");
}

function tick() {
  if (timer.mode === "pomodoro") {
    timer.remainingSec--;
    if (timer.remainingSec <= 0) {
      timer.remainingSec = 0;
      updateClockDisplay();
      completeSession(true);
      return;
    }
  } else {
    timer.elapsedSec++;
  }
  updateClockDisplay();
}

function stopTimer() {
  clearInterval(timer.tickHandle);
  if (timer.mode === "countup") {
    const success = timer.elapsedSec >= 60;
    completeSession(success);
  } else {
    completeSession(false);
  }
}

function completeSession(success) {
  clearInterval(timer.tickHandle);
  const actualMinutes =
    timer.mode === "pomodoro"
      ? timer.remainingSec === 0
        ? timer.durationMin
        : Math.floor((timer.durationMin * 60 - timer.remainingSec) / 60)
      : Math.floor(timer.elapsedSec / 60);

  timer.running = false;
  btnStart.disabled = false;
  btnStart.textContent = "Start Focus";
  btnPause.disabled = true;
  btnStop.disabled = true;
  document.querySelectorAll(".mode-btn, .dur-btn").forEach((b) => (b.disabled = false));

  if (success) {
    state.sessionsCompleted++;
    state.focusMinutes += actualMinutes;
    updateStreak();
    const gift = GIFTS[Math.floor(Math.random() * GIFTS.length)];
    state.fish += gift.fish;
    state.giftsReceived++;
    saveState();
    renderTopbar();
    renderChair("idle");
    clockCaption.textContent = "Ready when you are";
    resetTimerValues();
    updateClockDisplay();
    showReward(true, gift, actualMinutes);
  } else {
    if (actualMinutes > 0) {
      state.focusMinutes += actualMinutes;
    }
    saveState();
    renderTopbar();
    renderChair("idle");
    clockCaption.textContent = "Ready when you are";
    resetTimerValues();
    updateClockDisplay();
    const trash = TRASH[Math.floor(Math.random() * TRASH.length)];
    showReward(false, trash, actualMinutes);
  }
}

function updateStreak() {
  const today = new Date().toDateString();
  if (state.lastSessionDate === today) {
    // already counted today
  } else {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    state.streakDays = state.lastSessionDate === yesterday ? state.streakDays + 1 : 1;
    state.lastSessionDate = today;
  }
}

/* ------------------------------- reward UI ------------------------------ */

function showReward(success, item, minutes) {
  el("reward-icon").textContent = item.icon;
  if (success) {
    el("reward-title").textContent = "Session complete!";
    el("reward-desc").textContent = `${minutes} min focused. Your companion brought you ${item.name}${
      item.fish ? ` (+${item.fish} 🐟)` : ""
    }.`;
  } else {
    el("reward-title").textContent = "Session abandoned";
    el("reward-desc").textContent = `You left early, so your companion only found ${item.name}. No fish this time.`;
  }
  el("modal-reward").classList.remove("hidden");
}

/* -------------------------------- shop UI ------------------------------- */

function renderShop() {
  const grid = el("shop-grid");
  el("shop-fish-count").textContent = state.fish;
  grid.innerHTML = "";
  DECOR.forEach((item) => {
    const owned = state.ownedDecor.includes(item.id);
    const card = document.createElement("div");
    card.className = "shop-card" + (owned ? " owned" : "");
    card.innerHTML = `
      <div class="shop-icon">${item.icon}</div>
      <div class="shop-name">${item.name}</div>
      <div class="shop-price">${owned ? "Owned" : `🐟 ${item.price}`}</div>
      <button class="ctrl-btn ${owned ? "" : "primary"}" ${owned ? "disabled" : ""}>${owned ? "In room" : "Buy"}</button>
    `;
    if (!owned) {
      card.querySelector("button").addEventListener("click", () => buyDecor(item));
    }
    grid.appendChild(card);
  });
}

function buyDecor(item) {
  if (state.fish < item.price) return;
  state.fish -= item.price;
  state.ownedDecor.push(item.id);
  saveState();
  renderTopbar();
  renderDecor();
  renderShop();
}

/* -------------------------------- tasks UI ------------------------------- */

function renderTasks() {
  const list = el("task-list");
  list.innerHTML = "";
  if (state.tasks.length === 0) {
    list.innerHTML = `<li class="task-empty">No tasks yet. Add one to focus on.</li>`;
  }
  state.tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = "task-item" + (t.done ? " done" : "") + (t.id === state.activeTaskId ? " active" : "");
    li.innerHTML = `
      <input type="checkbox" ${t.done ? "checked" : ""} />
      <span class="task-text">${escapeHTML(t.text)}</span>
      <button class="task-focus-btn" title="Set as active task">🎯</button>
      <button class="task-del-btn" title="Delete">✕</button>
    `;
    li.querySelector('input[type="checkbox"]').addEventListener("change", (e) => {
      t.done = e.target.checked;
      if (t.done && state.activeTaskId === t.id) state.activeTaskId = null;
      saveState();
      renderTasks();
      renderTopbar();
      renderActiveTaskBanner();
    });
    li.querySelector(".task-focus-btn").addEventListener("click", () => {
      state.activeTaskId = t.id === state.activeTaskId ? null : t.id;
      saveState();
      renderTasks();
      renderActiveTaskBanner();
    });
    li.querySelector(".task-del-btn").addEventListener("click", () => {
      state.tasks = state.tasks.filter((x) => x.id !== t.id);
      if (state.activeTaskId === t.id) state.activeTaskId = null;
      saveState();
      renderTasks();
      renderTopbar();
      renderActiveTaskBanner();
    });
    list.appendChild(li);
  });
}

/* -------------------------------- stats UI ------------------------------- */

function renderStats() {
  el("stat-sessions").textContent = state.sessionsCompleted;
  el("stat-minutes").textContent = state.focusMinutes;
  el("stat-streak").textContent = state.streakDays;
  el("stat-gifts").textContent = state.giftsReceived;
}

/* -------------------------------- modals -------------------------------- */

function openModal(id) {
  el(id).classList.remove("hidden");
}
function closeModal(id) {
  el(id).classList.add("hidden");
}

/* -------------------------------- events -------------------------------- */

function wireEvents() {
  document.querySelectorAll(".mode-btn").forEach((b) =>
    b.addEventListener("click", () => setMode(b.dataset.mode))
  );
  document.querySelectorAll(".dur-btn").forEach((b) =>
    b.addEventListener("click", () => setDuration(Number(b.dataset.min)))
  );

  btnStart.addEventListener("click", () => {
    btnStart.textContent = "Start Focus";
    startTimer();
  });
  btnPause.addEventListener("click", pauseTimer);
  btnStop.addEventListener("click", stopTimer);

  el("btn-switch").addEventListener("click", () => {
    if (timer.running) {
      const ok = confirm("A session is running. Switching companions will give up this session. Continue?");
      if (!ok) return;
      clearInterval(timer.tickHandle);
      timer.running = false;
      resetTimerValues();
      updateClockDisplay();
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnStop.disabled = true;
    }
    showSelectScreen();
  });

  el("customize-confirm").addEventListener("click", () => {
    state.customizations[customizeTargetId] = { ...draftCustomization };
    state.companionId = customizeTargetId;
    saveState();
    showFocusScreen();
  });

  el("btn-customize").addEventListener("click", () => {
    if (!state.companionId) {
      showSelectScreen();
      return;
    }
    openCustomize(state.companionId, { fromSelect: false });
  });

  el("btn-shop").addEventListener("click", () => {
    renderShop();
    openModal("modal-shop");
  });
  el("shop-close").addEventListener("click", () => closeModal("modal-shop"));

  el("btn-tasks").addEventListener("click", () => {
    renderTasks();
    openModal("modal-tasks");
  });
  el("tasks-close").addEventListener("click", () => closeModal("modal-tasks"));

  el("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = el("task-input");
    const text = input.value.trim();
    if (!text) return;
    state.tasks.push({ id: crypto.randomUUID(), text, done: false });
    input.value = "";
    saveState();
    renderTasks();
    renderTopbar();
  });

  el("btn-stats").addEventListener("click", () => {
    renderStats();
    openModal("modal-stats");
  });
  el("stats-close").addEventListener("click", () => closeModal("modal-stats"));

  el("reward-close").addEventListener("click", () => closeModal("modal-reward"));

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.classList.add("hidden");
    });
  });

  el("btn-fish").addEventListener("click", () => {
    renderShop();
    openModal("modal-shop");
  });
}

/* -------------------------------- init -------------------------------- */

function init() {
  wireEvents();
  renderTopbar();
  setMode("pomodoro");
  setDuration(25);
  if (state.companionId) {
    showFocusScreen();
  } else {
    showSelectScreen();
  }
}

init();
