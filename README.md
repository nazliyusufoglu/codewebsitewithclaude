# Daily Planner
 
A small web app for keeping a daily to-do list and planning events on a calendar.
No install, no build step, no server — just open `index.html` in a browser.

## Features

- **Calendar** — monthly view, weeks start on Monday. Click a day to open its
  panel; arrow keys move the selection one day (or one week) at a time.
- **To-dos** — add tasks to the selected day, check them off as you finish, delete
  them.
- **Events** — schedule events with a time, a title and a category (Work /
  Personal / Health). The list stays sorted by time.
- **Daily progress** — a completion percentage, a meter and three summary counters.
  The meter turns green once every task for the day is done.
- **Calendar indicators** — each day cell shows a badge with the number of pending
  tasks and a colored dot per event category on that day.
- **Light / dark theme** — follows the operating system setting and can be
  switched with the button in the header. Your choice is remembered.

## Running it

Double-click `index.html`. If you prefer a local server:

```bash
python -m http.server 8000
# http://localhost:8000
```

## Where the data lives

All tasks and events are kept in your browser's **`localStorage`** (under the key
`gunluk-planlayici-v1`). Practical consequences:

- The data stays in that one browser on that one machine; it does not sync across
  devices.
- Clearing your browsing history or site data deletes it.
- There is no server, so two people cannot share the same list.

Shared use or cross-device sync would require adding a backend (Firebase,
Supabase, or similar).

## Files

| File | Contents |
|---|---|
| `index.html` | Page structure |
| `styles.css` | Color roles (light/dark), layout and component styles |
| `app.js` | State handling, calendar generation, localStorage |

## Accessibility and color notes

- Category colors were picked separately for the light and the dark surface, and
  both sets pass color-blind separation and contrast checks.
- The category name is always spelled out next to its dot — no information is
  carried by color alone.
- Every interactive element is keyboard-reachable and shows a focus ring.

## Note on language

The interface and the source comments are in Turkish; this document is the
English one.
