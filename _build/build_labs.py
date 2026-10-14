#!/usr/bin/env python3
"""
Build script for the DS Lab static website.
Converts the executed .ipynb lab record into:
  - data/labs.js      (all site data as a JS file -> works over file:// with no server)
  - assets/outputs/   (saved matplotlib chart images from the notebooks)
  - assets/pdf/       (generated sample module PDFs + lab record PDF)

The website itself is pure HTML/CSS/JS and needs no server.
Run once from anywhere:  python _build/build_labs.py
"""
import base64
import json
import os
import re
import binascii

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LABS_DIR = r"C:\Users\prane\coding\Python\pandas\DS LAB"
OUT = os.path.join(ROOT)
ANSI = re.compile(r"\x1b\[[0-9;]*m")

# ---------------------------------------------------------------- helpers


def load_nb(path):
    with open(path, encoding="utf-8") as f:
        nb = json.load(f)
    cells = []
    for c in nb["cells"]:
        cells.append({"type": c["cell_type"], "src": "".join(c["source"]),
                      "outputs": c.get("outputs", [])})
    return cells


def save_png(b64, name):
    raw = base64.b64decode(b64)
    folder = os.path.join(OUT, "assets", "outputs")
    os.makedirs(folder, exist_ok=True)
    p = os.path.join(folder, name)
    with open(p, "wb") as f:
        f.write(raw)
    return "assets/outputs/" + name


def conv_output(o, img_prefix):
    """Normalise a notebook output object into a small render-ready dict."""
    kind = o.get("output_type")
    if kind == "stream":
        return {"kind": "stream", "text": "".join(o.get("text", []))}
    if kind in ("execute_result", "display_data"):
        data = o.get("data", {})
        out = {"kind": "result", "images": []}
        if "text/plain" in data:
            out["text"] = "".join(data["text/plain"])
        if "text/html" in data:
            html = "".join(data["text/html"])
            html = re.sub(r"<style.*?</style>", "", html, flags=re.S)
            out["html"] = html
        if "image/png" in data:
            b64 = data["image/png"]
            if isinstance(b64, list):
                b64 = "".join(b64)
            try:
                raw = base64.b64decode(b64)
            except (binascii.Error, ValueError):
                raw = b""
            if raw[:8] == b"\x89PNG\r\n\x1a\n":
                out["images"].append(save_png(b64, img_prefix + ".png"))
        return out
    if kind == "error":
        tb = "\n".join(ANSI.sub("", t) for t in o.get("traceback", []))
        return {
            "kind": "error",
            "ename": o.get("ename", "Error"),
            "evalue": o.get("evalue", ""),
            "traceback": tb,
        }
    return {"kind": "none"}


def slice_cells(nb, rng, img_prefix, extra_src_first=None):
    """Take notebook cells in range [a,b], skip empty code cells, attach outputs."""
    cells = []
    idx = 0
    if extra_src_first:
        cells.append({"src": extra_src_first, "outputs": []})
        idx = 1
    for i in range(rng[0], rng[1] + 1):
        c = nb[i]
        if c["type"] != "code":
            continue
        if not c["src"].strip():
            continue
        outs = []
        for j, o in enumerate(c.get("outputs", []) if "outputs" in c else []):
            outs.append(conv_output(o, f"{img_prefix}-{i}-{j}"))
        cells.append({"src": c["src"], "outputs": outs})
    return cells

# ---------------------------------------------------------------- part plan

PLAN = [
    {
        "id": 1, "code": "EXP-1", "title": "Data Import & Export",
        "summary": "Read tabular data from CSV, JSON and Excel, build DataFrames from Python objects, and write multi-sheet workbooks back out.",
        "tags": ["pandas", "csv", "json", "openpyxl"],
        "parts": [
            {
                "id": "a", "label": "A", "title": "Reading CSV & plain text",
                "desc": "Load the Titanic CSV from disk, a CSV straight from a URL, and a tab-separated text file with read_table.",
                "file": "LAB_1/ds_lab1_final.ipynb", "rng": [0, 3],
            },
            {
                "id": "b", "label": "B", "title": "Python objects & JSON",
                "desc": "Build a DataFrame from a dict, then read and write JSON from files, raw strings and URLs.",
                "file": "LAB_1/ds_lab1_final.ipynb", "rng": [4, 8],
            },
            {
                "id": "c", "label": "C", "title": "Excel workbooks",
                "desc": "Write Excel sheets, build a two-sheet college workbook with ExcelWriter, and read the sheets back.",
                "file": "LAB_1/ds_lab1_final.ipynb", "rng": [9, 13],
            },
        ],
    },
    {
        "id": 2, "code": "EXP-2", "title": "Data from APIs & SQL",
        "summary": "Pull live records from a REST API and manage a SQLite database: tables, inserts, updates and deletes, read straight into DataFrames.",
        "tags": ["requests", "sqlite3", "sql", "pandas"],
        "parts": [
            {
                "id": "a", "label": "A", "title": "Fetching data from an API",
                "desc": "Call the GitHub issues REST endpoint with requests and inspect the JSON response.",
                "file": "Lab_2/ds_2a.ipynb", "rng": [0, 8],
            },
            {
                "id": "b", "label": "B", "title": "SQLite databases with pandas",
                "desc": "Create a Students table, insert rows (including the mistakes in the record), run SELECT / UPDATE / DELETE and read results into DataFrames.",
                "file": "Lab_2/ds_2b.ipynb", "rng": [0, 18],
            },
        ],
    },
    {
        "id": 3, "code": "EXP-3", "title": "Data Cleaning & Preprocessing",
        "summary": "Detect and handle missing values, map categories to numeric codes, rename columns and flag outliers in generated data.",
        "tags": ["pandas", "numpy", "cleaning"],
        "parts": [
            {
                "id": "a", "label": "A", "title": "Handling missing values",
                "desc": "Build a DataFrame full of NaNs, then inspect, drop and fill the missing data.",
                "file": "LAB_3/ds_3.ipynb", "rng": [0, 8],
            },
            {
                "id": "b", "label": "B", "title": "Mapping & renaming columns",
                "desc": "Map categories to numeric codes with map() and rename columns cleanly.",
                "file": "LAB_3/ds_3.ipynb", "rng": [9, 13],
            },
            {
                "id": "c", "label": "C", "title": "Outlier detection",
                "desc": "Generate random data and flag the values that fall outside the expected range.",
                "file": "LAB_3/ds_3.ipynb", "rng": [14, 21],
            },
        ],
    },
    {
        "id": 4, "code": "EXP-4", "title": "Hierarchical Indexing (MultiIndex)",
        "summary": "Build MultiIndex objects from arrays and tuples, select across levels with .loc, and reshape data with stack and unstack.",
        "tags": ["pandas", "multiindex", "reshape"],
        "parts": [
            {
                "id": "a", "label": "A", "title": "MultiIndex from arrays",
                "desc": "Create a hierarchical index from two arrays and select Engineering and Science branches with .loc.",
                "file": "LAB_4/ds_1.ipynb", "rng": [0, 7],
            },
            {
                "id": "b", "label": "B", "title": "Stack & unstack",
                "desc": "Build a multi-level DataFrame from tuples, then rotate it with unstack() and stack().",
                "file": "LAB_4/ds_2.ipynb", "rng": [0, 8],
            },
        ],
    },
    {
        "id": 5, "code": "EXP-5", "title": "Data Visualization with Matplotlib & Seaborn",
        "summary": "Explore the iris dataset, then answer questions A–E with line plots, bar charts, histograms, KDE curves, scatter and box plots.",
        "tags": ["matplotlib", "seaborn", "eda"],
        "parts": [
            {
                "id": "warmup", "label": "EDA", "title": "Iris dataset — quick EDA",
                "desc": "Load iris from a URL and sketch line, scatter, histogram, box and pair plots of every measurement.",
                "file": "LAB_5/exp5 (1).ipynb", "rng": [2, 8],
                "extra_src": "import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns",
            },
            {
                "id": "a", "label": "A", "title": "Subplots — monthly sales & expenses",
                "desc": "Two stacked line subplots comparing six months of sales against expenses.",
                "file": "LAB_5/exp5 (1).ipynb", "rng": [10, 10],
            },
            {
                "id": "b", "label": "B", "title": "Bar plots — grouped & stacked",
                "desc": "Student marks per language as a grouped bar chart, then as a stacked one.",
                "file": "LAB_5/exp5 (1).ipynb", "rng": [12, 14],
            },
            {
                "id": "c", "label": "C", "title": "Histogram & KDE",
                "desc": "Distribution of 20 recorded marks, raw and smoothed with a KDE curve.",
                "file": "LAB_5/exp5 (1).ipynb", "rng": [16, 16],
            },
            {
                "id": "d", "label": "D", "title": "Scatter — study hours vs marks",
                "desc": "Relationship between hours studied and marks scored across ten students.",
                "file": "LAB_5/exp5 (1).ipynb", "rng": [18, 18],
            },
            {
                "id": "e", "label": "E", "title": "Box plot — marks by department",
                "desc": "Compare mark distributions across departments at a glance.",
                "file": "LAB_5/exp5 (1).ipynb", "rng": [20, 21],
            },
        ],
    },
    {
        "id": 6, "code": "EXP-6", "title": "Time Series Analysis",
        "summary": "Build time series from dates, localize and convert time zones, work with Periods and frequencies, and resample / upsample / downsample data.",
        "tags": ["pandas", "datetime", "periods", "resampling"],
        "parts": [
            {
                "id": "a", "label": "A", "title": "Creating time series",
                "desc": "Build a Series indexed by a DatetimeIndex from date strings and values, and generate date ranges.",
                "file": "LAB_6/6all.ipynb", "rng": [0, 2],
            },
            {
                "id": "b", "label": "B", "title": "Time zones",
                "desc": "Localize naive timestamps to Asia/Kolkata and convert them to America/New_York.",
                "file": "LAB_6/6all.ipynb", "rng": [3, 5],
            },
            {
                "id": "c", "label": "C", "title": "Periods & frequencies",
                "desc": "Period arithmetic, asfreq conversion between monthly and daily, and converting Series/DataFrames to periods.",
                "file": "LAB_6/6all.ipynb", "rng": [6, 8],
            },
            {
                "id": "d", "label": "D", "title": "Resampling",
                "desc": "Resample hourly data to 3-hour and 4-hour aggregates, and upsample with forward fill.",
                "file": "LAB_6/6all.ipynb", "rng": [9, 9],
            },
        ],
    },
]

MODULES = [
    {"id": 1, "title": "Data Acquisition & I/O",
     "topics": ["CSV & TSV files with pandas", "JSON — files, strings, URLs", "Excel workbooks & openpyxl", "DataFrames from Python dicts"],
     "lab": 1},
    {"id": 2, "title": "Web & Database Data",
     "topics": ["The requests library & REST APIs", "SQLite basics with the sqlite3 module", "read_sql_query into DataFrames"],
     "lab": 2},
    {"id": 3, "title": "Cleaning & Preprocessing",
     "topics": ["isna, dropna & fillna", "Mapping categories to codes", "Renaming columns", "Flagging outliers"],
     "lab": 3},
    {"id": 4, "title": "Hierarchical Indexing",
     "topics": ["MultiIndex from arrays & tuples", "Selecting across levels with .loc", "Reshaping with stack & unstack"],
     "lab": 4},
    {"id": 5, "title": "Data Visualization",
     "topics": ["Matplotlib figures & subplots", "Seaborn statistical plots", "Distributions: histogram & KDE", "Comparisons: bars & box plots"],
     "lab": 5},
]

TOOLS = [
    {"id": "jupyter", "group": "Environments", "name": "Jupyter Notebook", "desc": "Where these experiments were written and executed — cells of code with inline outputs.",
     "url": "https://jupyter.org", "icon": "book"},
    {"id": "anaconda", "group": "Environments", "name": "Anaconda Distribution", "desc": "Python distribution that ships pandas, matplotlib and friends pre-installed.",
     "url": "https://www.anaconda.com/download", "icon": "box"},
    {"id": "colab", "group": "Environments", "name": "Google Colab", "desc": "Cloud notebook with nothing to install — handy for running these labs anywhere.",
     "url": "https://colab.research.google.com", "icon": "cloud"},
    {"id": "vscode", "group": "Editors", "name": "VS Code", "desc": "Editor with first-class Jupyter and Python support.",
     "url": "https://code.visualstudio.com", "icon": "code"},
    {"id": "pandas", "group": "Libraries", "name": "pandas", "desc": "The backbone of every experiment here — DataFrames, I/O, cleaning and reshaping.",
     "url": "https://pandas.pydata.org/docs/", "icon": "table"},
    {"id": "numpy", "group": "Libraries", "name": "NumPy", "desc": "Arrays, NaN handling and the random data used for outlier work.",
     "url": "https://numpy.org/doc/stable/", "icon": "sigma"},
    {"id": "matplotlib", "group": "Libraries", "name": "Matplotlib", "desc": "Figures, subplots and every base chart in EXP-5.",
     "url": "https://matplotlib.org/stable/", "icon": "chart"},
    {"id": "seaborn", "group": "Libraries", "name": "Seaborn", "desc": "Statistical plots with one line — histograms, box plots, pair plots.",
     "url": "https://seaborn.pydata.org/", "icon": "palette"},
    {"id": "sqlitebrowser", "group": "Data & versioning", "name": "DB Browser for SQLite", "desc": "Open students.db from EXP-2 and see the tables outside the notebook.",
     "url": "https://sqlitebrowser.org", "icon": "db"},
    {"id": "git", "group": "Data & versioning", "name": "Git & GitHub", "desc": "Version control for the lab record — datasets and notebooks live in a repo.",
     "url": "https://git-scm.com", "icon": "branch"},
]

PAGES = [
    {"id": "home", "title": "Home", "url": "index.html", "desc": "Student record, experiments overview and quick access."},
    {"id": "experiments", "title": "Experiments", "url": "experiments.html", "desc": "The full lab index — every experiment and every part."},
    {"id": "modules", "title": "Modules", "url": "modules.html", "desc": "Course modules with syllabus PDFs."},
    {"id": "tools", "title": "Tools", "url": "tools.html", "desc": "The data science toolkit behind this record."},
]

# ---------------------------------------------------------------- minimal PDF writer


def _pdf_escape(s):
    return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def _ascii(s):
    return s.encode("ascii", "replace").decode("ascii")


def make_pdf(path, title, subtitle, lines):
    """Tiny dependency-free one-page PDF generator."""
    ops = []
    y = 780
    ops.append(f"BT /F2 20 Tf 64 {y} Td ({_pdf_escape(_ascii(title))}) Tj ET")
    y -= 26
    ops.append(f"BT /F1 11 Tf 64 {y} Td ({_pdf_escape(_ascii(subtitle))}) Tj ET")
    y -= 14
    ops.append(f"64 {y} m 531 {y} l S")
    y -= 24
    for line in lines:
        if y < 60:
            break
        if line.startswith("## "):
            y -= 6
            ops.append(f"BT /F2 13 Tf 64 {y} Td ({_pdf_escape(_ascii(line[3:]))}) Tj ET")
            y -= 16
        elif line.startswith("- "):
            ops.append(f"BT /F1 10.5 Tf 76 {y} Td ({_pdf_escape(_ascii('-  ' + line[2:]))}) Tj ET")
            y -= 16
        else:
            ops.append(f"BT /F1 10.5 Tf 64 {y} Td ({_pdf_escape(_ascii(line))}) Tj ET")
            y -= 16
    y -= 8
    ops.append("BT /F1 9 Tf 64 46 Td (Mohan Babu University  -  Department of Data Science) Tj ET")
    stream = "\n".join(ops).encode("latin-1")

    objs = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
         b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    out = b"%PDF-1.4\n"
    offsets = []
    for n, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += f"{n} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_pos = len(out)
    out += b"xref\n0 7\n0000000000 65535 f \n"
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += (b"trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" + str(xref_pos).encode() + b"\n%%EOF\n")
    with open(path, "wb") as f:
        f.write(out)

# ---------------------------------------------------------------- assemble labs


def build():
    n_cells = 0
    n_imgs = 0
    labs = []
    for lab in PLAN:
        parts = []
        for part in lab["parts"]:
            nb = load_nb(os.path.join(LABS_DIR, part["file"]))
            prefix = f"lab{lab['id']}-{part['id']}"
            cells = slice_cells(
                nb, part["rng"], prefix,
                extra_src_first=part.get("extra_src"),
            )
            n_cells += len(cells)
            for c in cells:
                for o in c["outputs"]:
                    n_imgs += len(o.get("images", []))
            parts.append({
                "id": part["id"], "label": part["label"],
                "title": part["title"], "desc": part["desc"],
                "cells": cells,
            })
        labs.append({
            "id": lab["id"], "code": lab["code"], "title": lab["title"],
            "summary": lab["summary"], "tags": lab["tags"], "parts": parts,
        })

    data = {
        "meta": {
            "student": {
                "name": "GANDODI PRANEETH KUMAR",
                "roll": "24102A030124",
                "section": "DS2",
                "subject": "Data Science Lab",
                "faculty": "Bosubabu",
                "designation": "Assistant Professor",
                "university": "Mohan Babu University",
                "dept": "Department of Data Science",
                "linkedin": "https://www.linkedin.com/in/your-handle",
                "github": "https://github.com/Praneeth-Gandodi",
            },
            "stats": {"labs": len(labs), "parts": sum(len(l["parts"]) for l in labs),
                      "cells": n_cells, "charts": n_imgs},
        },
        "pages": PAGES,
        "modules": MODULES,
        "tools": TOOLS,
        "labs": labs,
    }

    # ---- emit labs.js (script-safe JSON)
    js = json.dumps(data, ensure_ascii=False, indent=1).replace("</", "<\\/")
    os.makedirs(os.path.join(OUT, "data"), exist_ok=True)
    with open(os.path.join(OUT, "data", "labs.js"), "w", encoding="utf-8") as f:
        f.write("/* Generated by _build/build_labs.py - do not edit by hand */\n")
        f.write("window.DSLAB_DATA = " + js + ";\n")

    # ---- emit PDFs
    pdf_dir = os.path.join(OUT, "assets", "pdf")
    os.makedirs(pdf_dir, exist_ok=True)
    for m in MODULES:
        lines = []
        for t in m["topics"]:
            lines.append("- " + t)
        lines += ["", "## Covered by", f"EXP-{m['lab']} — see the Experiments page.",
                  "", "Use this sheet as the reference for the unit while revising the experiment."]
        make_pdf(
            os.path.join(pdf_dir, f"module-{m['id']}.pdf"),
            f"Module {m['id']} - {m['title']}",
            "Data Science Lab - syllabus sheet",
            lines,
        )
    record_lines = ["## Experiments"]
    for lab in labs:
        parts = ", ".join(p["label"] for p in lab["parts"])
        record_lines.append(f"{lab['code']}  {lab['title']}  (parts {parts})")
    record_lines += ["", "## How to read the record",
                     "- Open the Experiments page and pick a part (A, B, C, ...).",
                     "- Each part opens as a notebook: edit any cell, press Run to see",
                     "  the saved output from the real executed lab record.",
                     "- Course modules and syllabus PDFs live on the Modules page.",
                     "- The toolkit behind the record is listed on the Tools page."]
    make_pdf(
        os.path.join(pdf_dir, "lab-record.pdf"),
        "Data Science Lab - Experiment Record",
        "Student: GANDODI PRANEETH KUMAR - Roll 24102A030124 - Section DS2",
        record_lines,
    )

    # ---- per-lab saved-output type summary for verification
    print(f"labs: {len(labs)}  parts: {sum(len(l['parts']) for l in labs)}  cells: {n_cells}  chart images: {n_imgs}")
    for lab in labs:
        s = " | ".join(f"{p['label']}:{len(p['cells'])}" for p in lab["parts"])
        print(f"  {lab['code']} {lab['title']}  ->  {s}")


if __name__ == "__main__":
    build()
