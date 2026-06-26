# T Level Core Engineering Quiz

A self-hosted multiple-choice quiz application for T Level Level 3 Core Engineering students. It supports both timed practice sessions and mock exam conditions, with a full admin back-end for managing questions, topics, users and exam configuration.

**Version 0.0.1** | June 2026

---

## Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running in Development](#running-in-development)
8. [Project Structure](#project-structure)
9. [Database Schema](#database-schema)
10. [API Reference](#api-reference)
11. [Admin Guide](#admin-guide)
12. [License](#license)

---

## Overview

Students select a topic or paper, choose practice or exam mode, and work through a set of randomly selected questions drawn from the database. In practice mode, each answer is revealed immediately with an optional explanation. In exam (mock) mode, nothing is revealed until the quiz is submitted. Results are stored per session and a review panel shows all wrong answers at the end.

The admin back-end is accessible via the gear icon in the site header. It is protected by a PHP session and provides full CRUD for questions and topics, a flag-review queue, exam date and quiz-size configuration, and user account management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, JavaScript |
| Styling | Single CSS file with CSS custom properties (light/dark theme) |
| HTTP client | Axios |
| Backend | PHP 8+ REST API |
| Database | MySQL 8 (utf8mb4) |
| Rich text editing | TipTap (StarterKit, Underline, Subscript, Superscript) |
| Drag and drop | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/modifiers |
| Linting | oxlint + react-doctor |

---

## Features

### Student-facing

- **Home page** with topic cards grouped by paper and a Paper 1 / Paper 2 mock exam option
- **Practice mode** reveals the correct answer and explanation after each question
- **Exam (mock) mode** suppresses all feedback until the final submission
- **Countdown bar** in the site header showing days remaining to each paper
- **Progress bar** and elapsed timer during the quiz
- **Formula hint box** displayed above questions that have an associated formula
- **Rich-text question rendering** supporting bold, italic, superscript, subscript, lists and inline code
- **Results panel** showing score, percentage, grade band and elapsed time
- **Topic breakdown** chart of correct vs incorrect per topic
- **Wrong-answer review** panel at the end of each quiz
- **Flag a question** button for students to report errors (visible after answering)
- **Light/dark theme** toggle, preference stored in localStorage

### Admin

- **Discrete login button** (gear icon) next to the theme toggle in the site header
- **Persistent admin navigation bar** inside the sticky header; shows all sections and a logout button; visible only on `/admin/*` routes
- **Dashboard** with active question count, topic count, and pending flag count
- **Question Manager** (two-panel layout)
  - Left panel: topic selector, Active/Inactive/All filter tabs, scrollable question list with truncated text, correct answer letter and ID
  - Right panel: full editor form; shows "Editing #N | Active/Inactive" or "New Question"
  - Four fields use TipTap rich-text dialogs: Question text, Formula hint, Formula note, Explanation
  - TipTap toolbar: Undo, Redo, Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Inline code, Paragraph, Heading 2, Heading 3, Bullet list, Numbered list
  - Deactivate (soft-delete) and Reactivate buttons
  - Live preview of the question as students see it
- **Topic Manager**
  - Drag-and-drop row reordering using @dnd-kit (vertical axis constrained)
  - Drag handle column replaces the old numeric sort-order field
  - Sort order persisted via bulk PATCH on drag end
  - Inline editing of title, paper assignment and active status
  - New topics are appended at the end automatically
- **Flag Review** queue for student-reported questions
- **Config Editor** for exam dates (Paper 1 and Paper 2), quiz size and mock size
- **User Management**
  - Change own username and/or password (current password required)
  - Create new admin accounts (username + password, min 6 characters)
  - Delete admin accounts (cannot delete own account or the last remaining account)

---

## Prerequisites

- Node.js 18+
- PHP 8.0+ with PDO and PDO_MySQL extensions
- MySQL 8.0+
- Composer is not required (no PHP dependencies beyond core extensions)

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd CoreEngQuiz
```

### 2. Create the database

```bash
mysql -u root -p < api/seed/schema.sql
```

This creates the `tlevel_quiz` database with all tables and default config values.

### 3. Configure the API

Copy the example config and fill in your database credentials:

```bash
cp api/.config.json api/.config.json.local
```

Edit `api/.config.json`:

```json
{
    "db_host":      "localhost",
    "db_name":      "tlevel_quiz",
    "db_user":      "your_db_user",
    "db_pass":      "your_db_password",
    "session_name": "tlevel_admin"
}
```

### 4. Configure the frontend

The root `.config.json` tells Axios where the API lives. For local development the default is fine:

```json
{
    "apiBase": "/api"
}
```

In production, set this to the full URL of your PHP API directory.

### 5. Install Node dependencies

```bash
npm install
```

### 6. Seed the database

Import the bundled questions and topics:

```bash
php api/seed/import.php
```

### 7. Create an admin user

```bash
php api/seed/create_admin.php admin yourpassword
```

Run this for each admin account you need. It is safe to run more than once; it updates the password if the username already exists.

---

## Configuration

### `api/.config.json`

| Key | Description |
|---|---|
| `db_host` | MySQL host |
| `db_name` | Database name |
| `db_user` | Database username |
| `db_pass` | Database password |
| `session_name` | PHP session cookie name |

### `config` database table

These values are editable through the admin Config page:

| Key | Default | Description |
|---|---|---|
| `exam_date_paper1` | 2027-06-02 | Paper 1 exam date (countdown bar) |
| `exam_date_paper2` | 2027-06-09 | Paper 2 exam date (countdown bar) |
| `quiz_size` | 10 | Number of questions per topic quiz |
| `mock_size` | 30 | Number of questions per mock exam |

---

## Running in Development

Two processes are needed: the Vite dev server and the PHP built-in server.

```bash
# Terminal 1 — PHP API (from project root)
php -S localhost:8080 -t api

# Terminal 2 — Vite dev server
npm run dev
```

Vite proxies all `/api/*` requests to `localhost:8080`, so there are no CORS issues in development.

### Other scripts

```bash
npm run build    # Production build to dist/
npm run preview  # Preview the production build
npm run lint     # Run oxlint
npm run doctor   # Run react-doctor diagnostics
```

---

## Project Structure

```
CoreEngQuiz/
├── api/                        PHP REST API
│   ├── .config.json            Database credentials (not committed)
│   ├── auth.php                Session guard (include in admin endpoints)
│   ├── cors.php                CORS headers
│   ├── db.php                  PDO singleton + jsonResponse helper
│   ├── config.php              Public config endpoint
│   ├── topics.php              Public topics list
│   ├── questions.php           Public question fetch (random sample)
│   ├── scores.php              Score submission
│   ├── flag.php                Student flag submission
│   ├── admin/
│   │   ├── login.php           POST — authenticate, start session
│   │   ├── logout.php          POST — destroy session
│   │   ├── questions.php       CRUD for questions
│   │   ├── topics.php          CRUD + bulk reorder for topics
│   │   ├── flags.php           Flag queue read + dismiss
│   │   ├── config.php          Config key update
│   │   └── users.php           Admin user CRUD
│   └── seed/
│       ├── schema.sql          Database DDL
│       ├── questions_data.php  Seed question data
│       ├── import.php          One-time import script
│       └── create_admin.php    CLI admin user creation
│
├── src/                        React frontend
│   ├── api/
│   │   └── client.js           Axios instance (reads baseURL from .config.json)
│   ├── components/
│   │   ├── AdminNav.jsx        Persistent admin navigation bar
│   │   ├── CountdownBar.jsx    Exam countdown strip
│   │   ├── OptionButton.jsx    Multiple-choice option button
│   │   ├── ProgressBar.jsx     Quiz progress indicator
│   │   ├── QuestionCard.jsx    Single question renderer (uses RichHtml)
│   │   ├── QuizView.jsx        Quiz orchestrator
│   │   ├── ResultsPanel.jsx    End-of-quiz results
│   │   ├── ReviewPanel.jsx     Wrong-answer review (uses RichHtml)
│   │   ├── RichHtml.jsx        dangerouslySetInnerHTML wrapper for student views
│   │   ├── RichTextDialog.jsx  Modal wrapper around TipTap editor
│   │   ├── RichTextEditor.jsx  TipTap editor with engineering toolbar
│   │   ├── TopicBreakdown.jsx  Per-topic score chart
│   │   └── TopicCard.jsx       Home page topic selection card
│   ├── hooks/
│   │   ├── useQuiz.js          Quiz state machine
│   │   ├── useSession.js       Anonymous session key (localStorage)
│   │   └── useTimer.js         Elapsed time counter
│   ├── pages/
│   │   ├── Home.jsx            Student home page
│   │   └── admin/
│   │       ├── Login.jsx       Admin login form
│   │       ├── Dashboard.jsx   Stats summary
│   │       ├── QuestionManager.jsx  Two-panel question manager
│   │       ├── TopicManager.jsx     Drag-and-drop topic reordering
│   │       ├── FlagReview.jsx       Flag queue
│   │       ├── ConfigEditor.jsx     Exam date / quiz size config
│   │       └── UserManager.jsx      Admin account management
│   ├── styles/
│   │   └── main.css            Single stylesheet (light/dark custom properties)
│   ├── utils/
│   │   ├── grading.js          Score to grade band mapping
│   │   └── shuffle.js          Fisher-Yates array shuffle
│   ├── App.jsx                 Router, theme state, header
│   └── main.jsx                React entry point
│
├── .config.json                Frontend config (apiBase URL)
├── vite.config.js              Vite config with /api proxy
├── package.json
└── README.md
```

---

## Database Schema

### `topics`

| Column | Type | Notes |
|---|---|---|
| `id` | INT UNSIGNED PK | Auto-increment |
| `code` | VARCHAR(20) UNIQUE | Short code, e.g. `ENG1` |
| `title` | VARCHAR(255) | Display title |
| `paper` | TINYINT | 1 or 2 |
| `sort_order` | TINYINT | Controls display order (managed by drag-and-drop) |
| `active` | TINYINT(1) | 1 = shown to students |

### `questions`

| Column | Type | Notes |
|---|---|---|
| `id` | INT UNSIGNED PK | |
| `topic_id` | INT UNSIGNED FK | References `topics.id` |
| `question_text` | TEXT | HTML from TipTap |
| `option_a` to `option_d` | VARCHAR(500) | Plain text answer options |
| `correct_index` | TINYINT | 0-3 (A-D) |
| `formula_hint` | VARCHAR(255) | HTML, optional |
| `formula_note` | VARCHAR(500) | HTML, optional |
| `explanation` | TEXT | HTML, shown after answer in practice mode |
| `active` | TINYINT(1) | Soft-delete flag |
| `flagged` | TINYINT(1) | Set by student flag submission |
| `flag_reason` | TEXT | Student-supplied reason |

### `scores`

Stores one row per quiz attempt. Used for per-session score history.

### `admin_users`

| Column | Type | Notes |
|---|---|---|
| `username` | VARCHAR(100) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt via `password_hash()` |

### `config`

Simple key/value store. Keys: `exam_date_paper1`, `exam_date_paper2`, `quiz_size`, `mock_size`.

---

## API Reference

All admin endpoints require an active session (HTTP 401 if not authenticated).

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/config.php` | Exam dates and quiz sizes |
| GET | `/topics.php` | All active topics |
| GET | `/questions.php?topic_id=N&n=10` | Random sample of N questions for topic |
| GET | `/questions.php?paper=1&n=30` | Random sample for a paper |
| POST | `/scores.php` | Submit a quiz score |
| POST | `/flag.php` | Flag a question |

### Admin

| Method | Path | Description |
|---|---|---|
| POST | `/admin/login.php` | Authenticate `{username, password}` |
| POST | `/admin/logout.php` | Destroy session |
| GET | `/admin/topics.php` | All topics (inc inactive) ordered by sort_order |
| POST | `/admin/topics.php` | Create topic; sort_order auto-assigned |
| PUT | `/admin/topics.php?id=N` | Update topic fields |
| PATCH | `/admin/topics.php` | Bulk reorder `{order:[{id,sort_order}]}` |
| GET | `/admin/questions.php?topic_id=N` | All questions for topic (inc inactive) |
| POST | `/admin/questions.php` | Create question |
| PUT | `/admin/questions.php?id=N` | Update question |
| DELETE | `/admin/questions.php?id=N` | Soft-delete (sets active=0) |
| GET | `/admin/flags.php` | All flagged questions |
| DELETE | `/admin/flags.php?id=N` | Dismiss flag |
| GET | `/admin/config.php` | Read all config keys |
| PUT | `/admin/config.php` | Update config keys |
| GET | `/admin/users.php` | List admin users and current user id |
| POST | `/admin/users.php` | Create admin user |
| PATCH | `/admin/users.php` | Update own credentials |
| DELETE | `/admin/users.php?id=N` | Delete admin user |

---

## Admin Guide

### Logging in

Click the gear icon (bottom-right of the header) to go to the admin login page. The admin navigation bar appears inside the header on all `/admin/*` pages once authenticated.

### Managing questions

Go to **Questions** in the admin nav. Select a topic from the drop-down; the left panel shows all questions for that topic. Use the filter tabs to switch between Active, Inactive and All. Click any question to load it into the editor on the right.

The four rich-text fields (Question text, Formula hint, Formula note, Explanation) each have a pencil button that opens a TipTap editor dialog. The toolbar supports bold, italic, underline, strikethrough, superscript (x²), subscript (x₂), inline code, paragraph, Heading 2, Heading 3, bullet list, numbered list, undo and redo.

Use **Deactivate** to soft-delete a question (students will not see it) and **Reactivate** to restore it. Questions are never permanently deleted.

### Managing topics

Go to **Topics**. Drag the dotted handle on the left of each row to reorder. The new order is saved immediately. Click the pencil to edit a topic's title, paper assignment or active status inline.

### Reviewing flags

Students can flag any question after answering. Go to **Flags** to see the queue. Each card shows the question, the student's selected answer, the correct answer, and any reason provided. Dismiss flags once reviewed.

### Configuration

Go to **Config** to update exam dates (used by the countdown bar) and quiz/mock sizes.

### User management

Go to **Users** to change your own username or password, create additional admin accounts, or delete accounts. You cannot delete your own account or the last remaining account.

---

## License

Copyright (c) 2026 Simon Rundell.

This work is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the licence, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same licence as the original.

Full licence text: https://creativecommons.org/licenses/by-nc-sa/4.0/

---

## Version History

### 0.0.1 — June 2026

Initial release. Full student quiz experience and complete admin back-end.

**Student features**
- Home page with topic cards and paper mock exam options
- Practice mode and exam mode
- Countdown bar to Paper 1 and Paper 2 exam dates
- Progress bar and elapsed timer
- Formula hint box per question
- Rich-text question, option and explanation rendering (bold, italic, super/subscript, lists, code)
- Results panel with score, grade band and elapsed time
- Per-topic score breakdown
- Wrong-answer review panel
- Question flagging

**Admin features**
- Gear-icon login button in site header
- Sticky admin navigation bar (all sections + logout)
- Dashboard with live stats
- Two-panel Question Manager with TipTap rich-text dialogs
- Drag-and-drop Topic Manager (@dnd-kit)
- Flag review queue
- Exam date and quiz-size configuration
- Admin user management (create, update credentials, delete)
