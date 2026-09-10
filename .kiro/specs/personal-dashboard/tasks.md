# Implementation Plan: Personal Dashboard

## Overview

Build a self-contained, three-file Personal Dashboard (`index.html`, `css/style.css`, `js/app.js`) using Vanilla JS. Each widget is implemented as an independent module object in `app.js`. All state is persisted to `localStorage`. The implementation proceeds module-by-module, wiring everything together in the final steps.

---

## Tasks

- [x] 1. Set up project structure and HTML skeleton
  - Create `index.html` at the project root with all widget mount points listed in the design (`#clock`, `#date`, `#greeting`, `#name-input`, `#name-save`, `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#duration-input`, `#duration-save`, `#duration-error`, `#todo-input`, `#todo-add`, `#todo-list`, `#quick-links`, `#theme-toggle`)
  - Link `css/style.css` as a render-blocking stylesheet in `<head>`
  - Link `js/app.js` with the `defer` attribute in `<head>`
  - No inline `<script>` or `<style>` blocks
  - Create empty `css/style.css` and `js/app.js` files as stubs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement ThemeModule
  - [x] 2.1 Write ThemeModule in `js/app.js`
    - Implement `getInitialTheme(stored)` — returns `'dark'` unless stored value is `'light'`
    - Implement `toggleTheme(current)` — returns the opposite theme string
    - Implement `applyTheme(theme)` — sets `data-theme` attribute on `<html>`
    - Implement `persist(theme)` — writes to `localStorage` key `theme`
    - Implement `init()` — reads storage, applies theme, binds `#theme-toggle` click event
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]* 2.2 Write property test for ThemeModule.toggleTheme (Property 17)
    - **Property 17: Theme Toggle Round-Trip**
    - **Validates: Requirements 8.3**
    - For each value in `['dark', 'light']`, assert `toggleTheme(toggleTheme(v)) === v`

- [x] 3. Implement GreetingModule
  - [x] 3.1 Write GreetingModule in `js/app.js`
    - Implement `formatTime(date)` — returns zero-padded `HH:MM:SS`
    - Implement `formatDate(date)` — returns human-readable string (e.g., "Monday, 7 September 2025")
    - Implement `getGreetingPrefix(hour)` — maps 5–11 → Morning, 12–17 → Afternoon, 0–4 & 18–23 → Evening
    - Implement `buildGreeting(prefix, name)` — returns `"Good Morning"` or `"Good Morning, Alex"`
    - Implement `updateName(name)` — refreshes the greeting DOM without restarting the interval
    - Implement `tick()` — reads current date, updates `#clock`, `#date`, `#greeting` DOM nodes
    - Implement `init()` — calls `tick()` once then starts `setInterval(tick, 1000)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [ ]* 3.2 Write property test for GreetingModule.formatTime (Property 1)
    - **Property 1: Time Format Correctness**
    - **Validates: Requirements 2.1**
    - For a range of Date values, assert output matches `/^\d{2}:\d{2}:\d{2}$/` and values are in valid ranges
  - [ ]* 3.3 Write property test for GreetingModule.getGreetingPrefix (Property 3)
    - **Property 3: Greeting Prefix Coverage**
    - **Validates: Requirements 2.3, 2.4, 2.5**
    - For every integer hour 0–23, assert exactly one of the three prefix strings is returned
  - [ ]* 3.4 Write property test for GreetingModule.buildGreeting (Property 4)
    - **Property 4: Greeting Name Composition**
    - **Validates: Requirements 2.7**
    - For any non-empty name string, assert output equals `"<prefix>, <name>"`

- [x] 4. Implement NameModule
  - [x] 4.1 Write NameModule in `js/app.js`
    - Implement `load()` — returns `localStorage.getItem('userName')` (may be null)
    - Implement `save(value)` — if non-empty, persists under key `userName` and calls `GreetingModule.updateName(value)`; if empty, removes key and calls `GreetingModule.updateName(null)`
    - Implement `init()` — pre-populates `#name-input` with stored value, binds `#name-save` click
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 4.2 Write property test for NameModule (Property 5)
    - **Property 5: User Name Round-Trip**
    - **Validates: Requirements 3.2, 3.4**
    - For any non-empty string, assert `localStorage.getItem('userName')` equals it after `save()`

- [ ] 5. Checkpoint — Ensure greeting, name, and theme work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement TimerModule
  - [x] 6.1 Write core TimerModule state and helpers in `js/app.js`
    - Define `STORAGE_KEY`, `DEFAULT_MINUTES`, `_intervalId`, `_remainingSeconds`, `_isRunning`
    - Implement `loadDuration()` — reads `localStorage` key `pomodoroDuration`, defaults to 25
    - Implement `formatTimer(totalSeconds)` — returns zero-padded `MM:SS`
    - Implement `validateDuration(rawInput)` — returns parsed integer if in [1, 120], else `null`
    - Implement `setButtonStates(isRunning)` — disables/enables `#timer-start` and `#timer-stop`
    - _Requirements: 4.1, 4.2, 4.3, 4.9, 4.10, 5.4_
  - [ ]* 6.2 Write property test for TimerModule.formatTimer (Property 6)
    - **Property 6: Timer Display Format**
    - **Validates: Requirements 4.3**
    - For integers 0–7200, assert output matches `MM:SS` and encodes the exact total seconds
  - [ ]* 6.3 Write property test for TimerModule.loadDuration (Property 7)
    - **Property 7: Timer Initialization from Storage**
    - **Validates: Requirements 4.1, 4.2**
    - For integers 1–120 stored in `localStorage`, assert `loadDuration()` returns that integer; when absent, assert 25
  - [ ]* 6.4 Write property test for TimerModule.setButtonStates (Property 8)
    - **Property 8: Timer Button States Consistency**
    - **Validates: Requirements 4.9, 4.10**
    - For both boolean values, assert start and stop are never simultaneously enabled or disabled
  - [ ]* 6.5 Write property test for TimerModule.validateDuration (Property 9)
    - **Property 9: Pomodoro Duration Validation**
    - **Validates: Requirements 5.4**
    - For a range of valid and invalid inputs, assert `null` is returned for all out-of-range or non-numeric values

  - [x] 6.6 Write TimerModule action methods in `js/app.js`
    - Implement `tick()` — decrements `_remainingSeconds`, updates `#timer-display`, calls `alert` and `stop()` at zero
    - Implement `start()` — starts `setInterval(tick, 1000)`, sets `_isRunning`, updates button states
    - Implement `stop()` — calls `clearInterval`, sets `_isRunning = false`, updates button states
    - Implement `reset()` — calls `stop()`, restores `_remainingSeconds` to full loaded duration, updates display
    - Implement `saveDuration(rawInput)` — validates input, shows/clears `#duration-error`, persists, resets timer
    - Implement `init()` — loads duration, sets display, binds Start/Stop/Reset/Save buttons
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.5_
  - [ ]* 6.7 Write property test for TimerModule.saveDuration (Property 10)
    - **Property 10: Pomodoro Duration Round-Trip**
    - **Validates: Requirements 5.2, 5.5**
    - For integers 1–120, assert `localStorage.getItem('pomodoroDuration')` equals string form after save

- [x] 7. Implement TodoModule
  - [x] 7.1 Write TodoModule data helpers in `js/app.js`
    - Implement `loadTasks()` — parses JSON from `localStorage` key `tasks`, defaults to `[]` on error
    - Implement `saveTasks(tasks)` — serializes and writes array to `localStorage`
    - Implement `addTask(text, tasks)` — returns new array with appended `{id, text, done: false}` (use `crypto.randomUUID()` or `Date.now().toString()`)
    - Implement `toggleTask(id, tasks)` — returns new array with target task's `done` flipped
    - Implement `editTask(id, newText, tasks)` — returns new array with target task's `text` updated
    - Implement `deleteTask(id, tasks)` — returns new array without the matching task
    - _Requirements: 6.2, 6.4, 6.6, 6.8, 6.10_
  - [ ]* 7.2 Write property test for TodoModule.addTask (Property 11)
    - **Property 11: Task Addition Grows List**
    - **Validates: Requirements 6.2**
    - For any non-empty text and existing array, assert length grows by 1 and last element has correct shape
  - [ ]* 7.3 Write property test for TodoModule (Property 12)
    - **Property 12: Task Persistence Round-Trip**
    - **Validates: Requirements 6.4**
    - For any valid task array, assert `loadTasks()` returns deeply equal array after `saveTasks()`
  - [ ]* 7.4 Write property test for TodoModule.toggleTask (Property 14)
    - **Property 14: Task Toggle Idempotence**
    - **Validates: Requirements 6.6**
    - For any task list with a known id, assert double-toggle restores original `done` value
  - [ ]* 7.5 Write property test for TodoModule.editTask (Property 15)
    - **Property 15: Task Edit Persistence**
    - **Validates: Requirements 6.7, 6.8**
    - For any task list and non-empty newText, assert only the target task's text changes
  - [ ]* 7.6 Write property test for TodoModule.deleteTask (Property 16)
    - **Property 16: Task Deletion Completeness**
    - **Validates: Requirements 6.10**
    - Assert length decreases by 1 and no task with the given id remains

  - [x] 7.7 Write TodoModule render and init in `js/app.js`
    - Implement `renderTask(task)` — returns a `<li>` with completion toggle, edit control, and delete control; apply strikethrough styling for done tasks via a CSS class
    - Implement `renderTasks(tasks)` — clears `#todo-list` and appends a rendered `<li>` for each task
    - Implement `init()` — loads and renders tasks, binds `#todo-add` click (and Enter key on input)
    - Wire inline edit: on edit click, replace text node with `<input>`; on blur/Enter, call `editTask` if non-empty else revert
    - _Requirements: 6.1, 6.3, 6.5, 6.7, 6.9_
  - [ ]* 7.8 Write property test for TodoModule.renderTask (Property 13)
    - **Property 13: Task Rendering Completeness**
    - **Validates: Requirements 6.5**
    - For any task object, assert returned element contains toggle, edit, and delete controls

- [x] 8. Implement QuickLinksModule
  - [x] 8.1 Write QuickLinksModule in `js/app.js`
    - Define hardcoded `LINKS` array with Google, YouTube, and GitHub entries
    - Implement `init()` — renders each link as `<a target="_blank" rel="noopener noreferrer">` inside `#quick-links`
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 9. Checkpoint — Ensure timer, to-do, and quick links work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Write the CSS in `css/style.css`
  - [~] 10.1 Define CSS custom properties and base reset
    - Add `[data-theme="dark"]` / `:root` variables: `--bg-primary: #1a1a2e`, `--bg-secondary: #16213e`, `--text-primary: #e0e0e0`, `--accent: #7c3aed`, `--accent-alt: #3b82f6`
    - Add `[data-theme="light"]` overrides preserving accent colors
    - Apply base reset (`box-sizing`, `margin`, `padding`, `font-size: 16px` minimum)
    - _Requirements: 8.5, 8.6, 10.3, 10.4, 10.5_
  - [x] 10.2 Implement layout and widget card styles
    - Use CSS Grid for the overall dashboard layout
    - Use Flexbox within each widget card
    - Add a media query at 640px that collapses grid to a single column
    - Style widget titles with clear visual hierarchy (font size and weight)
    - Ensure no horizontal scrolling from 320px to 2560px
    - _Requirements: 10.1, 10.2_
  - [x] 10.3 Style interactive elements and accessibility
    - Style buttons, inputs, and links using `var(--accent)` and `var(--accent-alt)`
    - Apply strikethrough class for completed to-do tasks
    - Ensure Quick Links are visible without scrolling at 1280px+
    - Ensure contrast ratio ≥ 4.5:1 for body text in both themes
    - _Requirements: 7.3, 10.4, 10.5_

- [x] 11. Wire the bootstrap and finalise `js/app.js`
  - [x] 11.1 Add DOMContentLoaded bootstrap block at the bottom of `js/app.js`
    - Call `ThemeModule.init()` first (before any other module)
    - Then call `GreetingModule.init()`, `NameModule.init()`, `TimerModule.init()`, `TodoModule.init()`, `QuickLinksModule.init()` in order
    - Wrap `localStorage` reads/writes in try/catch with in-memory fallback throughout all modules
    - _Requirements: 1.4, 9.5_

- [ ] 12. Final checkpoint — Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests can be written as simple self-contained assertion scripts run in the browser console or Node.js — no test framework is required by the spec
- ThemeModule must always be initialised first to prevent a flash of unstyled content
- The `defer` attribute on `<script>` guarantees DOM readiness without needing an additional `DOMContentLoaded` listener inside each module's `init()`
- All `localStorage` operations should be wrapped in try/catch to handle environments where storage is unavailable (e.g., private browsing with strict settings)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "6.1", "7.1", "8.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "3.4", "4.1", "6.2", "6.3", "6.4", "6.5", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 3, "tasks": ["4.2", "6.6", "7.7", "10.1"] },
    { "id": 4, "tasks": ["6.7", "7.8", "10.2"] },
    { "id": 5, "tasks": ["10.3", "11.1"] },
    { "id": 6, "tasks": ["12"] }
  ]
}
```
