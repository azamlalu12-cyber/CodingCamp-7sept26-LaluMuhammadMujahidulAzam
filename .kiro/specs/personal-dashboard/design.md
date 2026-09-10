# Design Document

## Personal Dashboard

---

## Overview

The Personal Dashboard is a self-contained, single-page web application delivered as three files: `index.html`, `css/style.css`, and `js/app.js`. It runs entirely in the browser with no backend, no build step, and no external dependencies. All persistent state lives in `localStorage`. The application is structured around five independent widgets — Greeting, Focus Timer, To-Do List, Quick Links, and Theme Toggle — each managed by a dedicated JavaScript module (object literal) that owns its state, DOM interactions, and storage I/O.

---

## Architecture

### High-Level Structure

```
index.html          ← markup skeleton + widget mount points
css/style.css       ← all visual rules, CSS custom properties for theming
js/app.js           ← all logic, organized as self-contained module objects
```

There is no module bundler, transpiler, or import/export system. `app.js` is loaded as a classic `<script src="js/app.js" defer>` at the bottom of `<head>` (using `defer` to guarantee DOM readiness). Each widget module is a plain object with an `init()` method called from a top-level `DOMContentLoaded` bootstrap.

### Execution Flow

```
Browser parses index.html
  → loads css/style.css (render blocking, intentional — prevents FOUC)
  → loads js/app.js (deferred)
    → DOMContentLoaded fires
      → ThemeModule.init()     // first — applies theme before paint
      → GreetingModule.init()
      → TimerModule.init()
      → TodoModule.init()
      → QuickLinksModule.init()
```

ThemeModule is initialized first to avoid a flash of the wrong theme. Because the stylesheet is render-blocking and the theme class is applied synchronously before the first paint, no visible flash occurs.

---

## Components

### 1. ThemeModule

Manages the dark/light theme toggle.

**Responsibilities:**
- Read `localStorage.getItem('theme')`, defaulting to `'dark'`.
- Apply theme by toggling a `data-theme` attribute on `<html>`.
- Wire the toggle button to flip the current theme and persist it.

**Key functions:**
```javascript
ThemeModule = {
  STORAGE_KEY: 'theme',
  DEFAULT: 'dark',
  init() { /* read storage, apply, bind button */ },
  getInitialTheme(stored) { return stored === 'light' ? 'light' : 'dark'; },
  toggleTheme(current)    { return current === 'dark' ? 'light' : 'dark'; },
  applyTheme(theme)       { document.documentElement.setAttribute('data-theme', theme); },
  persist(theme)          { localStorage.setItem(this.STORAGE_KEY, theme); }
}
```

### 2. GreetingModule

Displays the live clock, date, and personalised greeting.

**Responsibilities:**
- Format the current time as `HH:MM:SS` and update every second via `setInterval`.
- Format the current date in a human-readable string.
- Derive the time-of-day prefix from the current hour.
- Compose the full greeting string, including the stored user name if present.
- React to user name updates (called by NameModule on save).

**Key functions:**
```javascript
GreetingModule = {
  formatTime(date)           { /* returns 'HH:MM:SS' string */ },
  formatDate(date)           { /* returns e.g. 'Monday, 7 September 2025' */ },
  getGreetingPrefix(hour)    { /* 5-11→Morning, 12-17→Afternoon, else→Evening */ },
  buildGreeting(prefix, name){ /* 'Good Morning' or 'Good Morning, Alex' */ },
  tick()                     { /* called every second, updates DOM */ },
  init()                     { /* kick off setInterval(tick, 1000) */ }
}
```

### 3. NameModule

Manages the custom user name input (Bonus Challenge 1).

**Responsibilities:**
- Pre-populate the name input from `localStorage` on load.
- On save: validate non-empty, persist under key `userName`, trigger `GreetingModule` refresh.
- On save with empty input: remove `userName` from storage, trigger refresh.

**Key functions:**
```javascript
NameModule = {
  STORAGE_KEY: 'userName',
  init()              { /* load stored name, populate input, bind save button */ },
  save(value)         { /* persist or remove, call GreetingModule.updateName() */ },
  load()              { return localStorage.getItem(this.STORAGE_KEY); }
}
```

### 4. TimerModule

Manages the Pomodoro countdown timer (+ Bonus Challenge 2 for custom duration).

**Responsibilities:**
- Load duration from `localStorage` (key `pomodoroDuration`), default 25 min.
- Track remaining seconds and running state.
- Drive the countdown via `setInterval` at 1 s intervals.
- Update display in `MM:SS` format every tick.
- Handle Start, Stop, Reset button events.
- Disable/enable buttons according to running state.
- Notify the user (browser `alert`) when countdown reaches zero.
- Validate and persist custom duration from the duration input.

**Key functions:**
```javascript
TimerModule = {
  STORAGE_KEY: 'pomodoroDuration',
  DEFAULT_MINUTES: 25,
  _intervalId: null,
  _remainingSeconds: 0,
  _isRunning: false,

  init()                          { /* load duration, set display, bind buttons */ },
  loadDuration()                  { /* returns stored or default minutes */ },
  formatTimer(totalSeconds)       { /* returns 'MM:SS' */ },
  start()                         { /* setInterval, update button states */ },
  stop()                          { /* clearInterval, update button states */ },
  reset()                         { /* stop, restore remaining to full duration */ },
  tick()                          { /* decrement, update display, check for zero */ },
  setButtonStates(isRunning)      { /* enable/disable start and stop buttons */ },
  saveDuration(rawInput)          { /* validate, persist, reset timer */ },
  validateDuration(value)         { /* returns parsed int or null if invalid */ }
}
```

### 5. TodoModule

Manages the persistent to-do list.

**Responsibilities:**
- Load tasks from `localStorage` (key `tasks`) on init and render them.
- Add task: validate non-empty, assign UUID (via `crypto.randomUUID()` or `Date.now()`), append, persist, re-render.
- Toggle completion: flip `done` flag, persist, re-render.
- Inline edit: replace text span with input on edit click; on confirm validate non-empty; persist, re-render.
- Delete: remove by id, persist, re-render.

**Task data shape:**
```javascript
{
  id: string,        // unique identifier
  text: string,      // task description
  done: boolean      // completion state
}
```

**Key functions:**
```javascript
TodoModule = {
  STORAGE_KEY: 'tasks',
  _tasks: [],

  init()                           { /* load, render, bind add control */ },
  loadTasks()                      { /* parse JSON from localStorage, default [] */ },
  saveTasks(tasks)                 { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks)); },
  addTask(text, tasks)             { /* returns new tasks array with appended task */ },
  toggleTask(id, tasks)            { /* returns tasks with toggled done flag */ },
  editTask(id, newText, tasks)     { /* returns tasks with updated text */ },
  deleteTask(id, tasks)            { /* returns tasks without the matching id */ },
  renderTasks(tasks)               { /* builds DOM list from tasks array */ },
  renderTask(task)                 { /* returns a <li> element with controls */ }
}
```

### 6. QuickLinksModule

Renders the static set of quick-access bookmark buttons.

**Responsibilities:**
- Define a hardcoded array of `{ label, url }` objects.
- Render each as a `<a target="_blank" rel="noopener noreferrer">` link.

```javascript
QuickLinksModule = {
  LINKS: [
    { label: 'Google',  url: 'https://www.google.com' },
    { label: 'YouTube', url: 'https://www.youtube.com' },
    { label: 'GitHub',  url: 'https://www.github.com' }
  ],
  init() { /* render links into the quick-links container */ }
}
```

---

## Interfaces

### HTML Mount Points

`index.html` provides semantic container elements that each module targets by `id`:

| ID | Widget | Purpose |
|---|---|---|
| `#clock` | GreetingModule | Live HH:MM:SS time |
| `#date` | GreetingModule | Human-readable date |
| `#greeting` | GreetingModule | Greeting text |
| `#name-input` | NameModule | User name text input |
| `#name-save` | NameModule | Save button |
| `#timer-display` | TimerModule | MM:SS countdown display |
| `#timer-start` | TimerModule | Start button |
| `#timer-stop` | TimerModule | Stop button |
| `#timer-reset` | TimerModule | Reset button |
| `#duration-input` | TimerModule | Custom duration number input |
| `#duration-save` | TimerModule | Save duration button |
| `#duration-error` | TimerModule | Inline validation message |
| `#todo-input` | TodoModule | New task text input |
| `#todo-add` | TodoModule | Add task button |
| `#todo-list` | TodoModule | `<ul>` task list |
| `#quick-links` | QuickLinksModule | Links container |
| `#theme-toggle` | ThemeModule | Theme toggle button |

### localStorage Keys

| Key | Type | Owner | Default |
|---|---|---|---|
| `theme` | `'dark' \| 'light'` | ThemeModule | `'dark'` |
| `userName` | `string` | NameModule | absent |
| `pomodoroDuration` | `string` (numeric) | TimerModule | `'25'` |
| `tasks` | `string` (JSON array) | TodoModule | `'[]'` |

### Inter-Module Communication

Modules do not import each other. The only cross-module call is:

- `NameModule.save()` calls `GreetingModule.updateName(name)` after persisting — this is done by direct reference since both live in the same `app.js` scope.

---

## Data Models

### Task Object

```javascript
/**
 * @typedef {Object} Task
 * @property {string}  id   - Unique identifier (crypto.randomUUID or Date.now().toString())
 * @property {string}  text - Task description (non-empty)
 * @property {boolean} done - Whether the task is completed
 */
```

### Theme Value

A string literal: `'dark'` or `'light'`. Stored as-is in localStorage.

### Timer Duration

Stored as a numeric string (`'25'`, `'50'`, etc.) in localStorage. Parsed with `parseInt` on load; validated to be in `[1, 120]` before saving.

---

## CSS Architecture

All styling lives in `css/style.css`. Theming uses CSS custom properties scoped to `[data-theme]` on `<html>`:

```css
:root,
[data-theme="dark"] {
  --bg-primary:    #1a1a2e;
  --bg-secondary:  #16213e;
  --text-primary:  #e0e0e0;
  --accent:        #7c3aed;  /* purple */
  --accent-alt:    #3b82f6;  /* blue */
}

[data-theme="light"] {
  --bg-primary:    #f8f9fa;
  --bg-secondary:  #ffffff;
  --text-primary:  #1a1a2e;
  --accent:        #7c3aed;
  --accent-alt:    #3b82f6;
}
```

Layout uses CSS Grid for the overall dashboard and Flexbox within each widget card. A single media query breakpoint at `640px` collapses the multi-column grid to a single column for mobile viewports.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` not available | Wrap in try/catch; fall back to in-memory state; no crash |
| Corrupt JSON in `tasks` | `JSON.parse` in try/catch; default to `[]` on parse error |
| Invalid Pomodoro duration | Show message in `#duration-error`; do not update storage or timer |
| Empty task submission | Silently ignore; no error shown |
| Empty name submission | Clear stored name; update greeting; no error shown |
| Timer reaches zero | `clearInterval`, call `alert('Time is up!')` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time Format Correctness

*For any* valid `Date` object, `GreetingModule.formatTime(date)` SHALL return a string matching the pattern `HH:MM:SS` where HH is the zero-padded hours (00–23), MM is the zero-padded minutes (00–59), and SS is the zero-padded seconds (00–59).

**Validates: Requirements 2.1**

---

### Property 2: Date Format Completeness

*For any* valid `Date` object, `GreetingModule.formatDate(date)` SHALL return a string that contains the full weekday name, the numeric day of month, the full month name, and the four-digit year.

**Validates: Requirements 2.2**

---

### Property 3: Greeting Prefix Coverage

*For any* integer hour in the range [0, 23], `GreetingModule.getGreetingPrefix(hour)` SHALL return exactly `'Good Morning'` for hours 5–11, `'Good Afternoon'` for hours 12–17, and `'Good Evening'` for hours 0–4 and 18–23. Every valid hour maps to exactly one prefix.

**Validates: Requirements 2.3, 2.4, 2.5**

---

### Property 4: Greeting Name Composition

*For any* non-empty string `name` and any valid greeting prefix string `prefix`, `GreetingModule.buildGreeting(prefix, name)` SHALL return a string of the form `"<prefix>, <name>"`.

**Validates: Requirements 2.7**

---

### Property 5: User Name Round-Trip

*For any* non-empty string submitted as a user name, after `NameModule.save(name)` is called, `localStorage.getItem('userName')` SHALL equal that string, and `NameModule.load()` SHALL return the same string.

**Validates: Requirements 3.2, 3.4**

---

### Property 6: Timer Display Format

*For any* integer `totalSeconds` in the range [0, 7200], `TimerModule.formatTimer(totalSeconds)` SHALL return a string matching `MM:SS` where MM is the zero-padded minutes and SS is the zero-padded seconds, and the total encoded time SHALL equal `totalSeconds`.

**Validates: Requirements 4.3**

---

### Property 7: Timer Initialization from Storage

*For any* integer value in [1, 120] stored under `pomodoroDuration` in localStorage, `TimerModule.loadDuration()` SHALL return that integer. When no value is stored, it SHALL return `25`.

**Validates: Requirements 4.1, 4.2**

---

### Property 8: Timer Button States Consistency

*For any* boolean `isRunning`, `TimerModule.setButtonStates(isRunning)` SHALL set the Start button `disabled` attribute to `isRunning` and the Stop button `disabled` attribute to `!isRunning`, ensuring the two controls are never simultaneously enabled or disabled.

**Validates: Requirements 4.9, 4.10**

---

### Property 9: Pomodoro Duration Validation

*For any* input value that is not a whole number in [1, 120] — including non-numeric strings, decimals, values below 1, and values above 120 — `TimerModule.validateDuration(value)` SHALL return `null`, and the duration SHALL NOT be persisted to localStorage.

**Validates: Requirements 5.4**

---

### Property 10: Pomodoro Duration Round-Trip

*For any* integer in [1, 120], after `TimerModule.saveDuration(value)` completes, `localStorage.getItem('pomodoroDuration')` SHALL equal the string representation of that integer, and `TimerModule.loadDuration()` SHALL return that integer.

**Validates: Requirements 5.2, 5.5**

---

### Property 11: Task Addition Grows List

*For any* non-empty string `text` and any existing task array `tasks`, `TodoModule.addTask(text, tasks)` SHALL return a new array whose length equals `tasks.length + 1`, and the last element SHALL have a `text` property equal to the submitted string and a `done` property of `false`.

**Validates: Requirements 6.2**

---

### Property 12: Task Persistence Round-Trip

*For any* valid array of task objects, after `TodoModule.saveTasks(tasks)` is called, `TodoModule.loadTasks()` SHALL return an array that is deeply equal to the original array.

**Validates: Requirements 6.4**

---

### Property 13: Task Rendering Completeness

*For any* task object, `TodoModule.renderTask(task)` SHALL return a DOM element that contains a completion toggle control, an edit control, and a delete control.

**Validates: Requirements 6.5**

---

### Property 14: Task Toggle Idempotence (Round-Trip)

*For any* task list containing a task with a given `id`, applying `TodoModule.toggleTask(id, tasks)` twice SHALL return a list whose task at that `id` has the same `done` value as the original.

**Validates: Requirements 6.6**

---

### Property 15: Task Edit Persistence

*For any* task list containing a task with a given `id` and *any* non-empty string `newText`, `TodoModule.editTask(id, newText, tasks)` SHALL return a list where the task with that `id` has its `text` property equal to `newText`, and all other tasks SHALL remain unchanged.

**Validates: Requirements 6.7, 6.8**

---

### Property 16: Task Deletion Completeness

*For any* task list containing at least one task with a given `id`, `TodoModule.deleteTask(id, tasks)` SHALL return a list of length `tasks.length - 1` that contains no task with that `id`.

**Validates: Requirements 6.10**

---

### Property 17: Theme Toggle Round-Trip

*For any* theme value `t` in `{'dark', 'light'}`, `ThemeModule.toggleTheme(ThemeModule.toggleTheme(t))` SHALL equal `t`. That is, toggling twice is the identity operation.

**Validates: Requirements 8.3**
