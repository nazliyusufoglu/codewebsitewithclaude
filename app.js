'use strict';

/* ============================================================
   Günlük Planlayıcı
   Veriler tarayıcının localStorage'ında, gün anahtarına göre tutulur:
     { tasks:  { "2026-09-19": [{ id, text, done }] },
       events: { "2026-09-19": [{ id, time, title, category }] } }
   ============================================================ */

const STORAGE_KEY = 'gunluk-planlayici-v1';
const THEME_KEY = 'gunluk-planlayici-theme';

const CATEGORIES = [
  { id: 'is', label: 'İş', color: 'var(--cat-1)' },
  { id: 'kisisel', label: 'Kişisel', color: 'var(--cat-2)' },
  { id: 'saglik', label: 'Sağlık', color: 'var(--cat-3)' },
];

const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

/* ——— Tarih yardımcıları ———
   Anahtar her zaman yerel saate göre üretilir; toISOString() UTC'ye
   kaydırdığı için gün kaymasına yol açardı. */

const pad2 = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const todayKey = () => toKey(new Date());

const fmtDayLong = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
});
const fmtMonth = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ——— Durum ——— */

function loadState() {
  const empty = { tasks: {}, events: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return empty;
    return {
      tasks: parsed.tasks && typeof parsed.tasks === 'object' ? parsed.tasks : {},
      events: parsed.events && typeof parsed.events === 'object' ? parsed.events : {},
    };
  } catch (err) {
    console.warn('Kayıtlı veri okunamadı, boş başlanıyor.', err);
    return empty;
  }
}

const state = loadState();

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Veri kaydedilemedi.', err);
  }
}

const tasksFor = (key) => state.tasks[key] || [];
const eventsFor = (key) => state.events[key] || [];

let selectedKey = todayKey();
let viewYear = fromKey(selectedKey).getFullYear();
let viewMonth = fromKey(selectedKey).getMonth();

/* ——— DOM ——— */

const el = (id) => document.getElementById(id);

const grid = el('calendar-grid');
const monthTitle = el('calendar-title');
const dayTitle = el('day-title');
const dayEyebrow = el('day-eyebrow');
const taskList = el('task-list');
const eventList = el('event-list');
const taskForm = el('task-form');
const taskInput = el('task-input');
const eventForm = el('event-form');
const eventTime = el('event-time');
const eventTitle = el('event-title');
const eventCategory = el('event-category');
const meter = el('meter');
const meterFill = el('meter-fill');
const progressValue = el('progress-value');
const progressCaption = el('progress-caption');
const statTotal = el('stat-total');
const statDone = el('stat-done');
const statEvents = el('stat-events');
const themeToggle = el('theme-toggle');
const categoryLegend = el('category-legend');

/* ——— Takvim ——— */

function renderCalendar() {
  const first = new Date(viewYear, viewMonth, 1);
  monthTitle.textContent = fmtMonth.format(first);

  // Pazartesi haftanın ilk günü olacak şekilde kaydır (JS'te Pazar = 0).
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(viewYear, viewMonth, 1 - offset);
  const today = todayKey();

  const frag = document.createDocumentFragment();
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    frag.appendChild(buildDayCell(date, today));
  }
  grid.replaceChildren(frag);
}

function buildDayCell(date, today) {
  const key = toKey(date);
  const tasks = tasksFor(key);
  const events = eventsFor(key);
  const open = tasks.filter((t) => !t.done).length;

  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'day';
  cell.dataset.key = key;
  if (date.getMonth() !== viewMonth) cell.classList.add('is-outside');
  if (key === today) cell.classList.add('is-today');
  if (key === selectedKey) cell.classList.add('is-selected');
  cell.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
  cell.setAttribute(
    'aria-label',
    `${fmtDayLong.format(date)} — ${open} bekleyen görev, ${events.length} etkinlik`
  );

  const top = document.createElement('span');
  top.className = 'day-top';

  const num = document.createElement('span');
  num.className = 'day-num';
  num.textContent = date.getDate();
  top.appendChild(num);

  if (open > 0) {
    const badge = document.createElement('span');
    badge.className = 'day-badge';
    badge.textContent = open;
    top.appendChild(badge);
  }
  cell.appendChild(top);

  // Her kategori için en fazla bir nokta — hücre bir sürü noktayla dolmasın.
  const dots = document.createElement('span');
  dots.className = 'day-dots';
  const seen = new Set();
  for (const ev of events) {
    const cat = categoryById(ev.category);
    if (seen.has(cat.id)) continue;
    seen.add(cat.id);
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = cat.color;
    dots.appendChild(dot);
  }
  cell.appendChild(dots);

  return cell;
}

function selectDate(key, opts = {}) {
  selectedKey = key;
  const d = fromKey(key);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  renderCalendar();
  renderDay();
  if (opts.focus) {
    const cell = grid.querySelector(`.day[data-key="${key}"]`);
    if (cell) cell.focus();
  }
}

/* ——— Seçili gün ——— */

function renderDay() {
  const date = fromKey(selectedKey);
  dayTitle.textContent = fmtDayLong.format(date);
  dayEyebrow.textContent = selectedKey === todayKey() ? 'Bugün' : 'Seçili gün';

  renderTasks();
  renderEvents();
  renderProgress();
}

function renderProgress() {
  const tasks = tasksFor(selectedKey);
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  progressValue.textContent = pct;
  progressCaption.textContent =
    total === 0 ? 'Bu gün için henüz görev yok' : `${total} görevin ${done} tanesi tamamlandı`;

  meterFill.style.width = `${pct}%`;
  meter.setAttribute('aria-valuenow', pct);
  meter.classList.toggle('is-complete', total > 0 && done === total);

  statTotal.textContent = total;
  statDone.textContent = done;
  statEvents.textContent = eventsFor(selectedKey).length;
}

function emptyRow(text) {
  const li = document.createElement('li');
  li.className = 'empty';
  li.textContent = text;
  return li;
}

function removeButton(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'remove';
  btn.setAttribute('aria-label', label);
  btn.textContent = '×';
  btn.addEventListener('click', onClick);
  return btn;
}

function renderTasks() {
  const tasks = tasksFor(selectedKey);
  if (tasks.length === 0) {
    taskList.replaceChildren(emptyRow('Bu güne henüz görev eklenmedi.'));
    return;
  }

  const frag = document.createDocumentFragment();
  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = 'row' + (task.done ? ' is-done' : '');

    const label = document.createElement('label');
    label.className = 'task-label';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = Boolean(task.done);
    box.addEventListener('change', () => toggleTask(task.id, box.checked));

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    label.append(box, text);
    li.append(label, removeButton(`"${task.text}" görevini sil`, () => removeTask(task.id)));
    frag.appendChild(li);
  }
  taskList.replaceChildren(frag);
}

function renderEvents() {
  const events = eventsFor(selectedKey);
  if (events.length === 0) {
    eventList.replaceChildren(emptyRow('Bu güne henüz etkinlik planlanmadı.'));
    return;
  }

  const frag = document.createDocumentFragment();
  for (const ev of events) {
    const cat = categoryById(ev.category);

    const li = document.createElement('li');
    li.className = 'row';

    const time = document.createElement('span');
    time.className = 'event-time';
    time.textContent = ev.time;

    const main = document.createElement('span');
    main.className = 'event-main';

    const title = document.createElement('span');
    title.className = 'event-title';
    title.textContent = ev.title;

    // Kategori adı yazıyla da yazılır; kimlik yalnızca renge bırakılmaz.
    const catWrap = document.createElement('span');
    catWrap.className = 'event-cat';
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = cat.color;
    const catName = document.createElement('span');
    catName.textContent = cat.label;
    catWrap.append(dot, catName);

    main.append(title, catWrap);
    li.append(time, main, removeButton(`"${ev.title}" etkinliğini sil`, () => removeEvent(ev.id)));
    frag.appendChild(li);
  }
  eventList.replaceChildren(frag);
}

/* ——— Veri işlemleri ——— */

function refresh() {
  save();
  renderCalendar();
  renderDay();
}

function addTask(text) {
  if (!state.tasks[selectedKey]) state.tasks[selectedKey] = [];
  state.tasks[selectedKey].push({ id: uid(), text, done: false });
  refresh();
}

function toggleTask(id, done) {
  const task = tasksFor(selectedKey).find((t) => t.id === id);
  if (!task) return;
  task.done = done;
  refresh();
}

function removeTask(id) {
  const left = tasksFor(selectedKey).filter((t) => t.id !== id);
  if (left.length) state.tasks[selectedKey] = left;
  else delete state.tasks[selectedKey];
  refresh();
}

function addEvent(time, title, category) {
  if (!state.events[selectedKey]) state.events[selectedKey] = [];
  state.events[selectedKey].push({ id: uid(), time, title, category });
  state.events[selectedKey].sort((a, b) => a.time.localeCompare(b.time));
  refresh();
}

function removeEvent(id) {
  const left = eventsFor(selectedKey).filter((e) => e.id !== id);
  if (left.length) state.events[selectedKey] = left;
  else delete state.events[selectedKey];
  refresh();
}

/* ——— Olaylar ——— */

grid.addEventListener('click', (e) => {
  const cell = e.target.closest('.day');
  if (cell) selectDate(cell.dataset.key);
});

grid.addEventListener('keydown', (e) => {
  const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  const step = steps[e.key];
  if (step === undefined) return;
  e.preventDefault();
  const d = fromKey(selectedKey);
  d.setDate(d.getDate() + step);
  selectDate(toKey(d), { focus: true });
});

el('prev-month').addEventListener('click', () => {
  const d = new Date(viewYear, viewMonth - 1, 1);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  renderCalendar();
});

el('next-month').addEventListener('click', () => {
  const d = new Date(viewYear, viewMonth + 1, 1);
  viewYear = d.getFullYear();
  viewMonth = d.getMonth();
  renderCalendar();
});

el('today-btn').addEventListener('click', () => selectDate(todayKey()));

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;
  addTask(text);
  taskForm.reset();
  taskInput.focus();
});

eventForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = eventTitle.value.trim();
  const time = eventTime.value;
  if (!title || !time) return;
  addEvent(time, title, eventCategory.value);
  eventForm.reset();
  eventTime.focus();
});

/* ——— Tema ——— */

function currentTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeLabel() {
  themeToggle.setAttribute(
    'aria-label',
    currentTheme() === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'
  );
}

themeToggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (err) {
    /* kaydedilemezse tema yine de bu oturumda geçerli */
  }
  syncThemeLabel();
});

/* ——— Başlangıç ——— */

function initCategories() {
  const legendFrag = document.createDocumentFragment();
  const optionFrag = document.createDocumentFragment();

  for (const cat of CATEGORIES) {
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = cat.color;
    const name = document.createElement('span');
    name.textContent = cat.label;
    li.append(dot, name);
    legendFrag.appendChild(li);

    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.label;
    optionFrag.appendChild(opt);
  }

  categoryLegend.replaceChildren(legendFrag);
  eventCategory.replaceChildren(optionFrag);
}

initCategories();
syncThemeLabel();
renderCalendar();
renderDay();
