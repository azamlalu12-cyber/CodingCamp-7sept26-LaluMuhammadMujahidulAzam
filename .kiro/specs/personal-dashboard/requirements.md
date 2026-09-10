# Requirements Document

## Introduction

A single-page Personal Dashboard website built with HTML, CSS, and Vanilla JavaScript. The dashboard presents the user with a time-aware greeting, a Pomodoro-style focus timer, a persistent to-do list, and a set of hardcoded quick links. Three bonus challenges are included: light/dark mode toggle, custom user name in the greeting, and configurable Pomodoro duration. All persistent state is stored in the browser's Local Storage. The visual theme is minimalist and dark-themed with blue/purple accent colors. No backend server or test framework is required.

---

## Glossary

- **Dashboard**: The single-page web application delivered as `index.html`.
- **Greeting Widget**: The section of the Dashboard that displays the current time, date, and a time-of-day greeting message.
- **Focus Timer**: The Pomodoro-style countdown timer widget on the Dashboard.
- **To-Do List**: The task management widget on the Dashboard.
- **Task**: A single to-do item that can be added, edited, marked done, or deleted.
- **Quick Links**: The hardcoded set of bookmark buttons displayed on the Dashboard.
- **Theme**: The color scheme applied to the Dashboard (dark or light).
- **Local Storage**: The browser's `localStorage` API used for client-side data persistence.
- **User Name**: The custom name entered by the user that appears in the Greeting Widget.
- **Pomodoro Duration**: The configurable countdown length (in minutes) used by the Focus Timer.
- **Stylesheet**: The single CSS file located at `css/style.css`.
- **Script**: The single JavaScript file located at `js/app.js`.

---

## Requirements

### Requirement 1 — Project Structure

**User Story:** As a developer, I want a clearly defined single-file structure, so that the project is easy to maintain and review.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as a single `index.html` file at the project root.
2. THE Dashboard SHALL load exactly one Stylesheet located at `css/style.css`.
3. THE Dashboard SHALL load exactly one Script located at `js/app.js`.
4. THE Script SHALL contain all JavaScript logic for the Dashboard with no inline `<script>` blocks in `index.html`.
5. THE Stylesheet SHALL contain all CSS rules for the Dashboard with no inline `<style>` blocks in `index.html`.

---

### Requirement 2 — Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a greeting appropriate to the time of day, so that the dashboard feels personal and contextually relevant.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting Widget SHALL display the current local time in HH:MM:SS format, updated every second.
2. WHEN the Dashboard loads, THE Greeting Widget SHALL display the current local date in a human-readable format (e.g., "Monday, 7 September 2025").
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting Widget SHALL display the prefix "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting Widget SHALL display the prefix "Good Afternoon".
5. WHEN the local hour is between 18:00 and 23:59 or between 00:00 and 04:59, THE Greeting Widget SHALL display the prefix "Good Evening".
6. WHEN no User Name is stored in Local Storage, THE Greeting Widget SHALL display only the time-of-day prefix without a name.
7. WHEN a User Name is stored in Local Storage, THE Greeting Widget SHALL append the User Name to the greeting prefix (e.g., "Good Morning, Alex").

---

### Requirement 3 — Custom Name in Greeting (Bonus Challenge 1)

**User Story:** As a user, I want to set my name on the dashboard, so that the greeting feels personally addressed to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field and a save control that allows the user to enter a User Name.
2. WHEN the user submits a non-empty User Name, THE Dashboard SHALL persist the User Name to Local Storage under the key `userName`.
3. WHEN the user submits a non-empty User Name, THE Greeting Widget SHALL immediately update to include the saved User Name.
4. WHEN the Dashboard loads and a User Name exists in Local Storage, THE Dashboard SHALL pre-populate the name input field with the stored User Name.
5. IF the user submits an empty string as the User Name, THEN THE Dashboard SHALL remove the `userName` key from Local Storage and display the greeting without a name.

---

### Requirement 4 — Focus Timer

**User Story:** As a user, I want a Pomodoro countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads and no Pomodoro Duration is stored in Local Storage, THE Focus Timer SHALL initialize with a default duration of 25 minutes.
2. WHEN the Dashboard loads and a Pomodoro Duration is stored in Local Storage, THE Focus Timer SHALL initialize with the stored duration.
3. THE Focus Timer SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the Start control, THE Focus Timer SHALL begin counting down one second at a time.
5. WHILE the Focus Timer is counting down, THE Focus Timer SHALL update the displayed MM:SS value every second.
6. WHEN the user activates the Stop control, THE Focus Timer SHALL pause the countdown and retain the remaining time.
7. WHEN the user activates the Reset control, THE Focus Timer SHALL stop any active countdown and restore the displayed time to the current Pomodoro Duration.
8. WHEN the countdown reaches 00:00, THE Focus Timer SHALL stop automatically and notify the user (e.g., via a browser `alert` or an audible/visual cue).
9. WHILE the Focus Timer is counting down, THE Dashboard SHALL display the Start control as disabled and the Stop control as enabled.
10. WHILE the Focus Timer is paused or reset, THE Dashboard SHALL display the Stop control as disabled and the Start control as enabled.

---

### Requirement 5 — Change Pomodoro Time (Bonus Challenge 2)

**User Story:** As a user, I want to customize the Pomodoro timer duration, so that I can adapt focus sessions to my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a numeric input and a save control that allows the user to set a custom Pomodoro Duration in whole minutes.
2. WHEN the user submits a Pomodoro Duration that is a whole number between 1 and 120 (inclusive), THE Dashboard SHALL persist the value to Local Storage under the key `pomodoroDuration`.
3. WHEN a new Pomodoro Duration is saved, THE Focus Timer SHALL reset and display the new duration immediately.
4. IF the user submits a Pomodoro Duration outside the range 1–120 or a non-numeric value, THEN THE Dashboard SHALL display an inline validation message and SHALL NOT update Local Storage or the Focus Timer.
5. WHEN the Dashboard loads and a Pomodoro Duration exists in Local Storage, THE Dashboard SHALL pre-populate the duration input with the stored value.

---

### Requirement 6 — To-Do List

**User Story:** As a user, I want to manage a list of tasks that persists across browser sessions, so that I can track my work without losing progress.

#### Acceptance Criteria

1. THE To-Do List SHALL provide an input field and an add control for entering new Tasks.
2. WHEN the user submits a non-empty Task text, THE To-Do List SHALL append the new Task to the list and persist all Tasks to Local Storage under the key `tasks`.
3. IF the user submits an empty Task text, THEN THE To-Do List SHALL ignore the submission and SHALL NOT add a Task.
4. WHEN the Dashboard loads, THE To-Do List SHALL restore and display all Tasks previously saved in Local Storage.
5. THE To-Do List SHALL display each Task with a completion toggle, an edit control, and a delete control.
6. WHEN the user activates the completion toggle for a Task, THE To-Do List SHALL mark that Task as done (visually distinguished, e.g., strikethrough text) and persist the updated state to Local Storage.
7. WHEN the user activates the edit control for a Task, THE To-Do List SHALL allow inline editing of the Task text.
8. WHEN the user confirms an inline edit with non-empty text, THE To-Do List SHALL update the Task text and persist the updated Tasks to Local Storage.
9. IF the user confirms an inline edit with empty text, THEN THE To-Do List SHALL revert to the original Task text without modifying Local Storage.
10. WHEN the user activates the delete control for a Task, THE To-Do List SHALL remove the Task from the list and persist the updated Tasks to Local Storage.

---

### Requirement 7 — Quick Links

**User Story:** As a user, I want one-click access to my favorite websites, so that I can navigate quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick Links SHALL display a hardcoded set of bookmark buttons including at minimum: Google, YouTube, and GitHub.
2. WHEN the user activates a Quick Links button, THE Dashboard SHALL open the corresponding URL in a new browser tab.
3. THE Quick Links SHALL be visible and accessible on the Dashboard without scrolling on a viewport width of 1280px or greater.

---

### Requirement 8 — Light/Dark Mode Toggle (Bonus Challenge 3)

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a visible toggle control for switching between the dark Theme and the light Theme.
2. WHEN the Dashboard loads and no Theme preference is stored in Local Storage, THE Dashboard SHALL apply the dark Theme by default.
3. WHEN the user activates the theme toggle, THE Dashboard SHALL switch from the current Theme to the opposite Theme and persist the new preference to Local Storage under the key `theme`.
4. WHEN the Dashboard loads and a Theme preference exists in Local Storage, THE Dashboard SHALL apply the stored Theme without a visible flash of the opposite theme.
5. THE dark Theme SHALL use a dark background color with blue/purple accent colors for interactive elements and highlights.
6. THE light Theme SHALL use a light background color while preserving blue/purple accent colors for interactive elements and highlights.

---

### Requirement 9 — Cross-Browser Compatibility

**User Story:** As a user, I want the dashboard to work correctly in major browsers, so that I can use it regardless of my preferred browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render and function correctly in the latest stable release of Google Chrome.
2. THE Dashboard SHALL render and function correctly in the latest stable release of Mozilla Firefox.
3. THE Dashboard SHALL render and function correctly in the latest stable release of Microsoft Edge.
4. THE Dashboard SHALL render and function correctly in the latest stable release of Apple Safari.
5. THE Script SHALL use only Web APIs available natively in the browsers listed in criteria 1–4, with no external libraries or frameworks.

---

### Requirement 10 — Responsive Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and responsive interface, so that the dashboard is comfortable to use on different screen sizes.

#### Acceptance Criteria

1. THE Dashboard SHALL use a CSS layout that adapts to viewport widths from 320px to 2560px without horizontal scrolling.
2. THE Dashboard SHALL apply a clear visual hierarchy using font size and weight to distinguish widget titles, primary content, and secondary controls.
3. THE Dashboard SHALL use a legible base font size of at least 16px for body text.
4. WHEN the Dashboard applies the dark Theme, THE Stylesheet SHALL ensure a contrast ratio of at least 4.5:1 between text and its background for all body text.
5. WHEN the Dashboard applies the light Theme, THE Stylesheet SHALL ensure a contrast ratio of at least 4.5:1 between text and its background for all body text.
6. THE Dashboard SHALL load and render the initial view within 3 seconds on a broadband connection (no external resource dependencies beyond what is bundled in the three project files).
