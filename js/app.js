/**
 * Personal Dashboard — app.js
 *
 * All application logic lives here. The file is structured as six
 * self-contained module objects, each owning its own state, DOM
 * interactions, and localStorage I/O.
 *
 * Initialisation order (see bottom of file):
 *   ThemeModule   → first, prevents flash-of-wrong-theme
 *   GreetingModule
 *   NameModule
 *   TimerModule
 *   TodoModule
 *   QuickLinksModule
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   UTILITY HELPERS
════════════════════════════════════════════════════════════════════════ */

/**
 * Thin wrapper around localStorage that silently falls back to an
 * in-memory store when storage is unavailable (e.g. private browsing).
 */
const Storage = (() => {
  const _mem = {};
  let _available = true;

  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
  } catch (_) {
    _available = false;
  }

  return {
    get(key) {
      if (_available) {
        try { return localStorage.getItem(key); } catch (_) { /* fall through */ }
      }
      return Object.prototype.hasOwnProperty.call(_mem, key) ? _mem[key] : null;
    },
    set(key, value) {
      if (_available) {
        try { localStorage.setItem(key, value); return; } catch (_) { /* fall through */ }
      }
      _mem[key] = value;
    },
    remove(key) {
      if (_available) {
        try { localStorage.removeItem(key); return; } catch (_) { /* fall through */ }
      }
      delete _mem[key];
    }
  };
})();

/** Zero-pad a number to at least `width` digits. */
function pad(n, width = 2) {
  return String(n).padStart(width, '0');
}


/* ═══════════════════════════════════════════════════════════════════════
   MODULE 1 — ThemeModule
   Manages the dark/light theme toggle.
════════════════════════════════════════════════════════════════════════ */
const ThemeModule = {
  STORAGE_KEY: 'theme',
  DEFAULT: 'dark',

  /**
   * Determine the theme to apply on load.
   * @param {string|null} stored - Value from localStorage.
   * @returns {'dark'|'light'}
   */
  getInitialTheme(stored) {
    return stored === 'light' ? 'light' : 'dark';
  },

  /**
   * Return the opposite theme.
   * @param {'dark'|'light'} current
   * @returns {'dark'|'light'}
   */
  toggleTheme(current) {
    return current === 'dark' ? 'light' : 'dark';
  },

  /**
   * Apply a theme by setting `data-theme` on <html>.
   * @param {'dark'|'light'} theme
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  /**
   * Persist the current theme choice.
   * @param {'dark'|'light'} theme
   */
  persist(theme) {
    Storage.set(this.STORAGE_KEY, theme);
  },

  init() {
    const stored = Storage.get(this.STORAGE_KEY);
    let current = this.getInitialTheme(stored);

    // Apply before first paint to avoid FOUC
    this.applyTheme(current);

    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      current = this.toggleTheme(current);
      this.applyTheme(current);
      this.persist(current);
    });
  }
};


/* ═══════════════════════════════════════════════════════════════════════
   MODULE 2 — GreetingModule
   Displays the live clock, date, and personalised greeting.
════════════════════════════════════════════════════════════════════════ */
const GreetingModule = {
  _intervalId: null,

  /**
   * Format a Date as zero-padded HH:MM:SS.
   * @param {Date} date
   * @returns {string}
   */
  formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },

  /**
   * Format a Date as a human-readable string, e.g. "Monday, 7 September 2025".
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  },

  /**
   * Return the time-of-day greeting prefix for a given hour (0–23).
   * @param {number} hour
   * @returns {'Good Morning'|'Good Afternoon'|'Good Evening'}
   */
  getGreetingPrefix(hour) {
    if (hour >= 5 && hour <= 11)  return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening';
  },

  /**
   * Compose the full greeting string.
   * @param {string} prefix - e.g. "Good Morning"
   * @param {string|null} name - stored user name, or null/empty
   * @returns {string}
   */
  buildGreeting(prefix, name) {
    return (name && name.trim()) ? `${prefix}, ${name.trim()}` : prefix;
  },

  /**
   * Called every second — reads current time and updates DOM.
   */
  tick() {
    const now = new Date();
    const clockEl    = document.getElementById('clock');
    const dateEl     = document.getElementById('date');
    const greetingEl = document.getElementById('greeting');

    if (clockEl)    clockEl.textContent    = this.formatTime(now);
    if (dateEl)     dateEl.textContent     = this.formatDate(now);
    if (greetingEl) {
      const prefix = this.getGreetingPrefix(now.getHours());
      const name   = Storage.get('userName');
      greetingEl.textContent = this.buildGreeting(prefix, name);
    }
  },

  /**
   * Refresh only the greeting text (called by NameModule after a save).
   * @param {string|null} name
   */
  updateName(name) {
    const greetingEl = document.getElementById('greeting');
    if (!greetingEl) return;
    const prefix = this.getGreetingPrefix(new Date().getHours());
    greetingEl.textContent = this.buildGreeting(prefix, name);
  },

  init() {
    // Run once immediately so there's no blank state on load
    this.tick();
    // Bind tick so `this` stays correct inside setInterval
    this._intervalId = setInterval(() => this.tick(), 1000);
  }
};


/* ═══════════════════════════════════════════════════════════════════════
   MODULE 3 — NameModule
   Manages the custom user-name input (Bonus Challenge 1).
════════════════════════════════════════════════════════════════════════ */
const NameModule = {
  STORAGE_KEY: 'userName',

  /** @returns {string|null} */
  load() {
    return Storage.get(this.STORAGE_KEY);
  },

  /**
   * Persist (or remove) the name and refresh the greeting.
   * @param {string} value
   */
  save(value) {
    const trimmed = value.trim();
    if (trimmed) {
      Storage.set(this.STORAGE_KEY, trimmed);
      GreetingModule.updateName(trimmed);
    } else {
      Storage.remove(this.STORAGE_KEY);
      GreetingModule.updateName(null);
    }
  },

  init() {
    const input  = document.getElementById('name-input');
    const saveBtn = document.getElementById('name-save');
    if (!input || !saveBtn) return;

    // Pre-populate with stored value
    const stored = this.load();
    if (stored) input.value = stored;

    // Save on button click
    saveBtn.addEventListener('click', () => this.save(input.value));

    // Save on Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.save(input.value);
    });
  }
};


/* ═══════════════════════════════════════════════════════════════════════
   MODULE 4 — TimerModule
   Manages the Pomodoro countdown timer (+ Bonus Challenge 2).
════════════════════════════════════════════════════════════════════════ */
const TimerModule = {
  STORAGE_KEY: 'pomodoroDuration',
  DEFAULT_MINUTES: 25,

  _intervalId: null,
  _remainingSeconds: 0,
  _isRunning: false,

  // ── Helpers ──────────────────────────────────────────────────────────

  /**
   * Read stored duration (minutes) from localStorage, default 25.
   * @returns {number}
   */
  loadDuration() {
    const raw = Storage.get(this.STORAGE_KEY);
    if (raw === null) return this.DEFAULT_MINUTES;
    const parsed = parseInt(raw, 10);
    return (!isNaN(parsed) && parsed >= 1 && parsed <= 120) ? parsed : this.DEFAULT_MINUTES;
  },

  /**
   * Format a total-seconds value as zero-padded MM:SS.
   * @param {number} totalSeconds
   * @returns {string}
   */
  formatTimer(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${pad(mins)}:${pad(secs)}`;
  },

  /**
   * Validate a raw string/number input for a Pomodoro duration.
   * Returns the parsed integer if valid (whole number, 1–120), else null.
   * @param {string|number} rawInput
   * @returns {number|null}
   */
  validateDuration(rawInput) {
    const str = String(rawInput).trim();
    // Must be a whole number (no decimals)
    if (!/^\d+$/.test(str)) return null;
    const n = parseInt(str, 10);
    if (n < 1 || n > 120) return null;
    return n;
  },

  /**
   * Enable/disable Start and Stop buttons based on running state.
   * @param {boolean} isRunning
   */
  setButtonStates(isRunning) {
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = isRunning;
    if (stopBtn)  stopBtn.disabled  = !isRunning;
  },

  // ── Action methods ────────────────────────────────────────────────────

  /**
   * Decrement remaining time, update display, fire alert at zero.
   */
  tick() {
    this._remainingSeconds -= 1;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = this.formatTimer(this._remainingSeconds);

    if (this._remainingSeconds <= 0) {
      this.stop();
      // Brief timeout so the display can update to 00:00 before alert blocks
      setTimeout(() => alert('⏰ Time is up! Great work — take a break.'), 50);
    }
  },

  /**
   * Start the countdown.
   */
  start() {
    if (this._isRunning) return;
    this._isRunning = true;
    this.setButtonStates(true);
    this._intervalId = setInterval(() => this.tick(), 1000);
  },

  /**
   * Pause the countdown.
   */
  stop() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._isRunning = false;
    this.setButtonStates(false);
  },

  /**
   * Stop and restore to the full loaded duration.
   */
  reset() {
    this.stop();
    this._remainingSeconds = this.loadDuration() * 60;
    const display = document.getElementById('timer-display');
    if (display) display.textContent = this.formatTimer(this._remainingSeconds);
  },

  /**
   * Validate, persist, and reset the timer with a new duration.
   * Shows an inline error message for invalid input.
   * @param {string} rawInput
   */
  saveDuration(rawInput) {
    const errorEl = document.getElementById('duration-error');
    const validated = this.validateDuration(rawInput);

    if (validated === null) {
      if (errorEl) errorEl.textContent = 'Please enter a whole number between 1 and 120.';
      return;
    }

    if (errorEl) errorEl.textContent = '';
    Storage.set(this.STORAGE_KEY, String(validated));
    // Reflect new duration immediately
    this.reset();

    // Update the duration input to show the saved value
    const durationInput = document.getElementById('duration-input');
    if (durationInput) durationInput.value = validated;
  },

  init() {
    const minutes = this.loadDuration();
    this._remainingSeconds = minutes * 60;

    const display = document.getElementById('timer-display');
    if (display) display.textContent = this.formatTimer(this._remainingSeconds);

    // Pre-populate duration input
    const durationInput = document.getElementById('duration-input');
    const storedDuration = Storage.get(this.STORAGE_KEY);
    if (durationInput && storedDuration) durationInput.value = storedDuration;

    // Button bindings
    const startBtn    = document.getElementById('timer-start');
    const stopBtn     = document.getElementById('timer-stop');
    const resetBtn    = document.getElementById('timer-reset');
    const durationSave = document.getElementById('duration-save');

    if (startBtn)    startBtn.addEventListener('click',    () => this.start());
    if (stopBtn)     stopBtn.addEventListener('click',     () => this.stop());
    if (resetBtn)    resetBtn.addEventListener('click',    () => this.reset());
    if (durationSave) durationSave.addEventListener('click', () => {
      if (durationInput) this.saveDuration(durationInput.value);
    });
    if (durationInput) durationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.saveDuration(durationInput.value);
    });

    // Set initial button states (not running)
    this.setButtonStates(false);
  }
};


/* ═══════════════════════════════════════════════════════════════════════
   MODULE 5 — TodoModule
   Manages the persistent to-do list.
════════════════════════════════════════════════════════════════════════ */
const TodoModule = {
  STORAGE_KEY: 'tasks',
  _tasks: [],

  // ── Data helpers ──────────────────────────────────────────────────────

  /**
   * Load tasks from localStorage. Returns [] on any error.
   * @returns {Array<{id:string, text:string, done:boolean}>}
   */
  loadTasks() {
    try {
      const raw = Storage.get(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  },

  /**
   * Persist the task array to localStorage.
   * @param {Array} tasks
   */
  saveTasks(tasks) {
    Storage.set(this.STORAGE_KEY, JSON.stringify(tasks));
  },

  /**
   * Return a new array with a new task appended.
   * @param {string} text
   * @param {Array}  tasks
   * @returns {Array}
   */
  addTask(text, tasks) {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    return [...tasks, { id, text: text.trim(), done: false }];
  },

  /**
   * Return a new array with the specified task's `done` flag flipped.
   * @param {string} id
   * @param {Array}  tasks
   * @returns {Array}
   */
  toggleTask(id, tasks) {
    return tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  },

  /**
   * Return a new array with the specified task's text updated.
   * @param {string} id
   * @param {string} newText
   * @param {Array}  tasks
   * @returns {Array}
   */
  editTask(id, newText, tasks) {
    return tasks.map(t => t.id === id ? { ...t, text: newText } : t);
  },

  /**
   * Return a new array without the specified task.
   * @param {string} id
   * @param {Array}  tasks
   * @returns {Array}
   */
  deleteTask(id, tasks) {
    return tasks.filter(t => t.id !== id);
  },

  // ── Render helpers ────────────────────────────────────────────────────

  /**
   * Build a <li> element for a single task.
   * @param {{id:string, text:string, done:boolean}} task
   * @returns {HTMLLIElement}
   */
  renderTask(task) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' todo-item--done' : '');
    li.dataset.id = task.id;

    // ── Completion toggle ────────────────────────────────────────
    const toggle = document.createElement('button');
    toggle.className = 'btn-check';
    toggle.setAttribute('aria-label', task.done ? 'Mark as not done' : 'Mark as done');
    toggle.setAttribute('aria-pressed', String(task.done));
    toggle.innerHTML = task.done ? '✓' : '';
    toggle.addEventListener('click', () => {
      this._tasks = this.toggleTask(task.id, this._tasks);
      this.saveTasks(this._tasks);
      this.renderTasks(this._tasks);
    });

    // ── Task text span ────────────────────────────────────────────
    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = task.text;

    // ── Edit control ──────────────────────────────────────────────
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-ghost btn-sm';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => {
      this._startInlineEdit(task.id, textSpan, li);
    });

    // ── Delete control ────────────────────────────────────────────
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', () => {
      this._tasks = this.deleteTask(task.id, this._tasks);
      this.saveTasks(this._tasks);
      this.renderTasks(this._tasks);
    });

    // ── Controls wrapper ──────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'todo-controls';
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(toggle);
    li.appendChild(textSpan);
    li.appendChild(controls);
    return li;
  },

  /**
   * Replace the text span with an inline <input> for editing.
   * Confirms on Enter or blur; reverts on Escape or empty input.
   * @param {string}      id
   * @param {HTMLElement} textSpan
   * @param {HTMLElement} li
   */
  _startInlineEdit(id, textSpan, li) {
    const originalText = textSpan.textContent;

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'input todo-edit-input';
    editInput.value = originalText;
    editInput.maxLength = 200;

    const confirm = () => {
      const newText = editInput.value.trim();
      if (newText && newText !== originalText) {
        this._tasks = this.editTask(id, newText, this._tasks);
        this.saveTasks(this._tasks);
        this.renderTasks(this._tasks);
      } else {
        // Revert — just replace the input with the original span
        li.replaceChild(textSpan, editInput);
      }
    };

    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Escape') {
        li.replaceChild(textSpan, editInput);
      }
    });

    editInput.addEventListener('blur', confirm);

    li.replaceChild(editInput, textSpan);
    editInput.focus();
    editInput.select();
  },

  /**
   * Re-render the entire task list into #todo-list.
   * @param {Array} tasks
   */
  renderTasks(tasks) {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';

    if (tasks.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'todo-empty';
      empty.textContent = 'No tasks yet — add one above!';
      list.appendChild(empty);
      return;
    }

    tasks.forEach(task => list.appendChild(this.renderTask(task)));
  },

  init() {
    this._tasks = this.loadTasks();
    this.renderTasks(this._tasks);

    const input  = document.getElementById('todo-input');
    const addBtn = document.getElementById('todo-add');
    if (!input || !addBtn) return;

    const addCurrentTask = () => {
      const text = input.value.trim();
      if (!text) return; // silently ignore empty submission
      this._tasks = this.addTask(text, this._tasks);
      this.saveTasks(this._tasks);
      this.renderTasks(this._tasks);
      input.value = '';
      input.focus();
    };

    addBtn.addEventListener('click', addCurrentTask);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addCurrentTask();
    });
  }
};


/* ═══════════════════════════════════════════════════════════════════════
   MODULE 6 — QuickLinksModule
   Renders the hardcoded bookmark buttons.
════════════════════════════════════════════════════════════════════════ */
const QuickLinksModule = {
  LINKS: [
    { label: 'Google',     url: 'https://www.google.com',    icon: '🔍' },
    { label: 'YouTube',    url: 'https://www.youtube.com',   icon: '▶️' },
    { label: 'GitHub',     url: 'https://www.github.com',    icon: '🐙' },
    { label: 'Twitter/X',  url: 'https://www.x.com',         icon: '𝕏' },
    { label: 'LinkedIn',   url: 'https://www.linkedin.com',  icon: '💼' }
  ],

  init() {
    const container = document.getElementById('quick-links');
    if (!container) return;

    this.LINKS.forEach(({ label, url, icon }) => {
      const a = document.createElement('a');
      a.href   = url;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
      a.className = 'quick-link';
      a.setAttribute('aria-label', label);

      const iconSpan  = document.createElement('span');
      iconSpan.className = 'quick-link-icon';
      iconSpan.textContent = icon;

      const labelSpan = document.createElement('span');
      labelSpan.className = 'quick-link-label';
      labelSpan.textContent = label;

      a.appendChild(iconSpan);
      a.appendChild(labelSpan);
      container.appendChild(a);
    });
  }
};


/* ═══════════════════════════════════════════════════════════════════════
   BOOTSTRAP — DOMContentLoaded
   ThemeModule MUST be first to prevent flash-of-wrong-theme.
════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeModule.init();      // ← first: applies saved theme before paint
  GreetingModule.init();
  NameModule.init();
  TimerModule.init();
  TodoModule.init();
  QuickLinksModule.init();
});
