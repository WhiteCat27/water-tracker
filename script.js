const STORAGE_KEY = "water-tracker-v2";
const OLD_STORAGE_KEY = "water-tracker-v1";

const builtInBackgrounds = ["2.webp", "3.webp", "4.webp", "5.webp", "6.webp"];

const defaultState = {
  settings: {
    goal: 3000,
    reminderEnabled: false,
    reminderMinutes: 90,
    customBackgrounds: []
  },
  logs: []
};

const $ = (selector) => document.querySelector(selector);

const els = {
  todayText: $("#todayText"),
  goalText: $("#goalText"),
  totalText: $("#totalText"),
  remainText: $("#remainText"),
  percentText: $("#percentText"),
  progressBar: $("#progressBar"),
  statusText: $("#statusText"),
  lastDrinkText: $("#lastDrinkText"),
  quickActions: $("#quickActions"),
  customForm: $("#customForm"),
  customAmount: $("#customAmount"),
  settingsForm: $("#settingsForm"),
  normalGoal: $("#normalGoal"),
  reminderEnabled: $("#reminderEnabled"),
  reminderMinutes: $("#reminderMinutes"),
  logList: $("#logList"),
  emptyLogText: $("#emptyLogText"),
  clearTodayBtn: $("#clearTodayBtn"),
  historyList: $("#historyList"),
  weekAverageText: $("#weekAverageText"),
  toast: $("#toast"),
  randomBgBtn: $("#randomBgBtn"),
  bgUpload: $("#bgUpload")
};

let state = loadState();
let toastTimer;
let lastReminderDate = "";

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      return normalizeState(saved);
    }

    const old = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
    if (old) {
      return normalizeState({
        settings: {
          goal: 3000,
          reminderEnabled: old.settings?.reminderEnabled || false,
          reminderMinutes: old.settings?.reminderMinutes || 90,
          customBackgrounds: []
        },
        logs: old.logs || []
      });
    }
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }

  return JSON.parse(JSON.stringify(defaultState));
}

function normalizeState(saved) {
  return {
    ...defaultState,
    ...saved,
    settings: { ...defaultState.settings, ...(saved?.settings || {}) },
    logs: Array.isArray(saved?.logs) ? saved.logs : []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function currentGoal() {
  return Number(state.settings.goal) || 3000;
}

function todayLogs() {
  const key = todayKey();
  return state.logs
    .filter((log) => log.date === key)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function todayTotal() {
  return todayLogs().reduce((sum, log) => sum + Number(log.amount), 0);
}

function addLog(amount) {
  const cleanAmount = Math.round(Number(amount));
  if (!Number.isFinite(cleanAmount) || cleanAmount <= 0 || cleanAmount > 3000) {
    showToast("请输入 1 到 3000 之间的饮水量。");
    return;
  }

  const now = new Date();
  state.logs.push({
    id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: todayKey(now),
    time: formatTime(now),
    amount: cleanAmount,
    createdAt: now.getTime()
  });

  saveState();
  render();
  showToast(`已记录 ${cleanAmount} mL。`);
}

function deleteLog(id) {
  state.logs = state.logs.filter((log) => log.id !== id);
  saveState();
  render();
}

function clearToday() {
  const logs = todayLogs();
  if (!logs.length) return;
  if (!confirm("确定清空今天的饮水记录吗？")) return;
  const key = todayKey();
  state.logs = state.logs.filter((log) => log.date !== key);
  saveState();
  render();
  showToast("今天的记录已清空。");
}

function saveSettings(event) {
  event.preventDefault();
  state.settings.goal = clampGoal(els.normalGoal.value);
  state.settings.reminderEnabled = els.reminderEnabled.checked;
  state.settings.reminderMinutes = Number(els.reminderMinutes.value);
  saveState();
  render();
  showToast("设置已保存。");
}

function clampGoal(value) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return 3000;
  return Math.min(8000, Math.max(500, number));
}

function render() {
  renderSummary();
  renderSettings();
  renderLogs();
  renderHistory();
}

function renderSummary() {
  const goal = currentGoal();
  const total = todayTotal();
  const remain = Math.max(goal - total, 0);
  const percent = goal > 0 ? Math.round((total / goal) * 100) : 0;
  const cappedPercent = Math.min(percent, 100);

  els.todayText.textContent = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
  els.goalText.textContent = `${goal} mL`;
  els.totalText.textContent = `${total} mL`;
  els.remainText.textContent = `${remain} mL`;
  els.percentText.textContent = `${percent}%`;
  els.progressBar.style.width = `${cappedPercent}%`;

  if (total >= goal) {
    els.statusText.textContent = "今天已经喝够啦，目标达成。";
  } else if (remain <= 400) {
    els.statusText.textContent = `再来一个 400 mL 小杯，今天就很漂亮。`;
  } else if (remain <= 600) {
    els.statusText.textContent = `快完成了，再喝一个 600 mL 大杯就差不多。`;
  } else if (total > 0) {
    els.statusText.textContent = `已经喝了 ${total} mL，离 ${goal} mL 还差 ${remain} mL。`;
  } else {
    els.statusText.textContent = "今天刚开始，先用你的杯子喝一杯吧。";
  }

  const latest = todayLogs()[0];
  els.lastDrinkText.textContent = latest ? `上次 ${latest.time}` : "还没有记录";
}

function renderSettings() {
  els.normalGoal.value = state.settings.goal;
  els.reminderEnabled.checked = state.settings.reminderEnabled;
  els.reminderMinutes.value = String(state.settings.reminderMinutes);
}

function renderLogs() {
  const logs = todayLogs();
  els.logList.innerHTML = "";
  els.emptyLogText.hidden = logs.length > 0;

  for (const log of logs) {
    const item = document.createElement("li");
    item.className = "log-item";
    item.innerHTML = `
      <span class="log-time">${log.time}</span>
      <span class="log-amount">${log.amount} mL</span>
      <button class="delete-button" type="button" title="删除记录" aria-label="删除 ${log.time} 的记录">×</button>
    `;
    item.querySelector("button").addEventListener("click", () => deleteLog(log.id));
    els.logList.appendChild(item);
  }
}

function renderHistory() {
  const days = getRecentDays(7);
  const goal = currentGoal();
  const totals = days.map((day) => {
    const total = state.logs
      .filter((log) => log.date === day.key)
      .reduce((sum, log) => sum + Number(log.amount), 0);
    return { ...day, total };
  });
  const average = Math.round(totals.reduce((sum, day) => sum + day.total, 0) / totals.length);

  els.weekAverageText.textContent = `平均 ${average} mL`;
  els.historyList.innerHTML = "";

  for (const day of totals) {
    const percent = goal > 0 ? Math.min(100, Math.round((day.total / goal) * 100)) : 0;
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <span class="history-date">${day.label}</span>
      <span class="history-track"><span class="history-fill" style="width:${percent}%"></span></span>
      <span class="history-total">${day.total} mL</span>
    `;
    els.historyList.appendChild(row);
  }
}

function getRecentDays(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    return {
      key: todayKey(date),
      label: date.toLocaleDateString("zh-CN", { weekday: "short" })
    };
  });
}

function pickRandomBackground() {
  const pool = [...builtInBackgrounds, ...state.settings.customBackgrounds];
  if (!pool.length) return;
  const image = pool[Math.floor(Math.random() * pool.length)];
  document.documentElement.style.setProperty("--bg-image", `url("${image}")`);
}

function addCustomBackgrounds(files) {
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return;

  Promise.all(imageFiles.map(readFileAsDataUrl)).then((images) => {
    state.settings.customBackgrounds.push(...images);
    state.settings.customBackgrounds = state.settings.customBackgrounds.slice(-8);
    saveState();
    pickRandomBackground();
    showToast(`已添加 ${images.length} 张背景图。`);
  }).catch(() => showToast("背景图片读取失败。"));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function checkReminder() {
  if (!state.settings.reminderEnabled) return;
  const logs = todayLogs();
  const latest = logs[0];
  const now = Date.now();
  const interval = Number(state.settings.reminderMinutes) * 60 * 1000;
  const referenceTime = latest?.createdAt || new Date(todayKey()).getTime();
  const reminderKey = `${todayKey()}-${Math.floor(now / interval)}`;

  if (now - referenceTime >= interval && lastReminderDate !== reminderKey) {
    lastReminderDate = reminderKey;
    showToast(`距离上次喝水已超过 ${state.settings.reminderMinutes} 分钟，建议喝一个 400 mL 小杯。`);
  }
}

function bindEvents() {
  els.quickActions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-amount]");
    if (!button) return;
    addLog(button.dataset.amount);
  });

  els.customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addLog(els.customAmount.value);
    els.customAmount.value = "";
  });

  els.settingsForm.addEventListener("submit", saveSettings);
  els.clearTodayBtn.addEventListener("click", clearToday);
  els.randomBgBtn.addEventListener("click", () => {
    pickRandomBackground();
    showToast("背景已随机切换。");
  });
  els.bgUpload.addEventListener("change", (event) => addCustomBackgrounds(event.target.files));
}

pickRandomBackground();
bindEvents();
render();
setInterval(checkReminder, 60 * 1000);
