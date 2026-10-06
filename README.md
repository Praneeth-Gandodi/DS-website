# DS Lab — Experiment Record Website

A pure HTML/CSS/JS website (no Node, no frameworks, no build step required to view) presenting the
Data Science Lab record for **GANDODI PRANEETH KUMAR** (Roll 24102A030124, Section DS2),
Mohan Babu University. Faculty: **Bosubabu**, Assistant Professor.

## Pages

| Page               | What it has                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `index.html`       | Home — hero, student ID card, 5 experiment cards with part buttons (A/B/C…), modules preview, stats     |
| `experiments.html` | Full lab index — every experiment with every part as a clickable row                                    |
| `lab.html`         | Notebook view — Jupyter-style editor for one experiment part; edit cells, Run, see saved outputs        |
| `modules.html`     | Course modules with a built-in PDF viewer (lab record + 5 syllabus sheets)                              |
| `tools.html`       | The DS toolkit (Jupyter, Anaconda, Colab, VS Code, pandas, NumPy, Matplotlib, Seaborn, SQLite, Git)     |

## Notebook behavior

- Code cells are editable; **Run** (or Shift+Enter) shows the **exact saved output** captured when
  the lab record was executed — DataFrames render as tables, charts as images, errors as tracebacks.
- "Run all" replays every cell in the part; "Reset" restores the original record.
- Results come from the real `.ipynb` files, converted by the build script below.

## The 5 experiments

1. **EXP-1 — Data Import & Export** (parts A: CSV/text, B: objects & JSON, C: Excel)
2. **EXP-2 — Data from APIs & SQL** (parts A: requests/REST, B: SQLite + pandas)
3. **EXP-3 — Data Cleaning & Preprocessing** (parts A: missing values, B: mapping/renaming, C: outliers)
4. **EXP-4 — Hierarchical Indexing / MultiIndex** (parts A: from arrays, B: stack/unstack)
5. **EXP-5 — Data Visualization with Matplotlib & Seaborn** (parts EDA, A–E)

## Data & build pipeline (optional)

The site reads all content from `data/labs.js`. It ships pre-built; rebuild only if the notebooks change:

```
python _build/build_labs.py
```

This regenerates `data/labs.js`, extracts matplotlib charts to `assets/outputs/`, and writes the
PDFs in `assets/pdf/` (lab record + module syllabus sheets). Requires Python 3 only — no packages.

## Structure

```
website/
├── index.html / experiments.html / lab.html / modules.html / tools.html
├── css/tokens.css      # design tokens (light + dark)
├── css/site.css        # all component styles
├── js/site.js          # nav, search, theme, footer (shared)
├── js/index.js         # home cards
├── js/lab.js           # notebook engine (editor + saved-output runs)
├── js/experiments.js   # experiments index
├── js/modules.js       # PDF viewer + module cards
├── js/tools.js         # tool cards
├── data/labs.js        # ALL site content (generated from the .ipynb lab record)
└── assets/outputs/     # saved chart images from the notebooks
```

## Features

- Light + dark theme (toggle in the nav, persisted in localStorage)
- Site-wide search (experiments, parts, modules, tools, pages) with keyboard navigation
- EXP dropdown in the nav listing all 5 experiments
- Fully responsive down to mobile; visible keyboard focus; reduced-motion respected
- Works from `file://` directly — no server needed (open `index.html`)
