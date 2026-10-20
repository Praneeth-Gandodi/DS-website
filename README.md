# DS Lab — experiment record site

A four-page static site for the **Data Science Laboratory** record of
**GANDODI PRANEETH KUMAR** (24102A030124 · CSE (DS) — 2 · Mohan Babu University,
faculty **S Bosu Babu**, Assistant Professor).

Hand-built: semantic HTML, plain CSS on a token system, one vanilla JS file.
No framework, no build step, **0 dependencies**. Opens straight from disk or any
static host.

---

## Run it

```bash
# from the directory that contains website/
python -m http.server 8899 --bind 127.0.0.1
# then open http://127.0.0.1:8899/website/index.html
```

A plain `file://` open also works — nothing is fetched at runtime — but serving
over HTTP is closer to the deployed behaviour (and required for PDFs to be
handled consistently across browsers).

---

## Pages

| Page | File | What it holds |
|---|---|---|
| Home | `index.html` | Hero, the student ID card, experiment index, module cards, toolkit grid, CTA |
| Experiments | `experiments.html` | All six experiments part by part, with cell counts and 13 saved charts |
| Modules | `modules.html` | The five course modules, each with its syllabus PDF |
| Tools | `tools.html` | The ten tools, grouped, with official docs and copyable install commands |

Every page shares the same shell — nav, mobile menu, command palette, footer,
preloader — so the four read as one document.

---

## Structure

```
website/
├── index.html
├── experiments.html
├── modules.html
├── tools.html
└── assets/
    ├── css/
    │   ├── tokens.css      design tokens: colour, type, space, motion, elevation
    │   ├── base.css        reset, typography, [hidden], reduced-motion, focus rings
    │   ├── components.css  nav, buttons, cards, ID card, palette, menu, footer
    │   ├── sections.css    home-page composition (hero, marquee, CTA)
    │   └── pages.css       sub-page composition (page head, labs, gallery, rows)
    ├── js/
    │   └── main.js         one IIFE, 16 guarded modules
    ├── pdf/                lab-record.pdf + module-1..5.pdf
    └── outputs/            13 matplotlib PNGs, saved by the notebook itself
```

`pages.css` is loaded only by the three sub-pages; everything above it is shared
with the home page.

---

## Content facts

These numbers are measured from the notebook outputs, not estimated:

| Experiment | Title | Parts | Cells | Charts | Errors kept |
|---|---|---|---|---|---|
| EXP-1 | Data Import & Export | 3 | 14 | 0 | 0 |
| EXP-2 | Data from APIs & SQL | 2 | 28 | 0 | 5 |
| EXP-3 | Data Cleaning & Preprocessing | 3 | 22 | 0 | 4 |
| EXP-4 | Hierarchical Indexing (MultiIndex) | 2 | 17 | 0 | 0 |
| EXP-5 | Data Visualization (Matplotlib & Seaborn) | 6 | 14 | 13 | 0 |
| EXP-6 | Time Series Analysis | 4 | 10 | 0 | 0 |
| **Total** | | **20** | **105** | **13** | **9** |

Error outputs are deliberately kept visible in the record: they are the cells
that ran before a variable or table existed, and removing them would make the
record look cleaner while telling you less. The five module PDFs stop at
visualization, so EXP-6 has no module of its own — the Modules page says so
rather than dropping the experiment.

---

## Design system

Derived from the **AETHER** reference build kept alongside this project
(`../aether/`, documented in `../docs/design-system.md`).

- Dark obsidian is the default theme, with a light "paper" twin; the choice
  persists in `localStorage` under `dslab-theme` and follows the OS when unset.
- Accent `#ff5a1f` dark / `#e0430a` light, with violet and mint secondaries.
- Display face **Bricolage Grotesque**, body **Inter Tight**, accent italic
  **Instrument Serif**, micro-labels in monospace.
- Theme is applied by an inline script in `<head>` so there is never a flash of
  the wrong theme.

---

## The editor: highlighting + a simulated language server

Every cell on an experiment page is a real editor, not a `<pre>`:

- **Syntax highlighting.** A tokeniser paints keywords, strings, comments,
  numbers, calls, classes and operators. The textarea keeps the caret and the
  selection; a `<pre>` underneath paints the glyphs. **Both must share the exact
  same typography, padding and wrap behaviour**, or the caret drifts away from
  the characters it sits between. The two boxes are height-checked on resize.
- **Diagnostics.** A small static checker produces wavy underlines, a gutter dot
  per cell and a problem count pill in the toolbar:
  `error` · `warning` · `hint`. Hovering any underline shows the message and the
  rule id (e.g. `reportUndefinedVariable`) in a small card.
- **Run / Run all / Reset.** Run replays the saved output of one cell
  (`Shift+Enter` / `Ctrl+Enter` inside a cell); Run all replays the page in
  order; **Reset** restores every cell to the record as it shipped and hides the
  outputs again.

The interesting part is that the checker is *honest*: it detects undefined names
by accumulating definitions across the cells of the page, which is exactly how
the two cells that really raised `NameError` in the record get flagged —
`df_from_sql = df.read_sql_query(...)` in EXP-2 reports `Name 'df' is not
defined`, the same message Jupyter produced. Nothing is executed in the browser,
and the hover card says so.

Rules are intentionally conservative — a false underline is worse than a missing
one. Undefined name (statement position and right-hand side of an assignment),
calling a numpy submodule, `DataFrame.append` (removed in pandas 2.0),
`iterrows()`, star imports, line length, trailing whitespace.

## Behaviour notes

- **Command palette** (`⌘K` / `Ctrl-K` / `/`) searches pages, commands and
  **in-page jumps declared with `data-jump`** — so the jump list is correct on
  every page instead of being hard-coded for the home page.
- **Copy controls** are declarative: `[data-copy]` with an optional
  `data-copy-label`; `main.js` handles the clipboard call and the confirmation
  toast.
- **Nav on programmatic jumps**: an anchor jump reads as a downward scroll and
  would hide the nav immediately. The nav is held open until the movement has
  demonstrably settled, and is released early by genuine input
  (`wheel` / `touchmove` / navigation keys).
- **Reduced motion** is respected: reveals and counters fall back to a static,
  fully-visible state.
- **No custom cursor.** The native arrow, hand and I-beam are left alone — this is
  a site people read and type into, so pointer precision beats pointer theatre.

### Gotchas worth remembering

- `SVGElement` has **no `hidden` IDL attribute**. `svg.hidden = true` sets a JS
  expando and never touches the attribute that `[hidden]` CSS keys off — which
  silently broke the theme-toggle icon. Use `setAttribute('hidden','')` /
  `removeAttribute('hidden')` on SVG nodes.
- Chart figures use `object-fit: contain`, never `cover`: cropping a plot cuts
  the axis labels off, and the labels are the point of the figure.

---

## Accessibility

- One `h1` per page, headings in order, skip link to `#main`.
- Dialogs (menu, palette) manage focus, restore it on close, and close on Escape.
- Icon-only buttons carry `aria-label`; decorative SVG is `aria-hidden`.
- `aria-current="page"` marks the active nav item and menu item.
- External links open in new tabs with `rel="noopener"`.
- Every chart has descriptive `alt` text naming the plot, not the filename.

---

## Credits

Data, notebooks, charts and syllabus PDFs: the author's own Data Science
Laboratory work. Documentation links point to each project's official site.
---

## Interactions added with the experiment pages

**Notebook cell (one per experiment).** Each experiment carries an editable code
cell and a **Run** button. Run does **not** execute Python — the captured output
ships inside the markup and is only revealed, after a short "Running" state, with
a label saying so. Editing the cell is allowed; the output stays the saved one.
The code is real, and the output is the exact text the notebook produced when the
lab was executed.

**Video (one per experiment).** A click-to-load facade: only a thumbnail is
requested initially, and the `youtube-nocookie` iframe is created on click. No
third-party script runs until the visitor asks for the video.

| Experiment | Video |
|---|---|
| EXP-1 Import & Export | Keith Galli — Complete Python Pandas tutorial |
| EXP-2 APIs & SQL | Rob Mulla — SQL Databases with Pandas |
| EXP-3 Cleaning | Keith Galli — Pandas tutorial (2025) |
| EXP-4 MultiIndex | Pandas MultiIndex tutorial |
| EXP-5 Visualization | Seaborn full course |
| EXP-6 Time Series | Pandas time series — DatetimeIndex & resample |
