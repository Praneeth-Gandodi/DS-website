/* ============================================================
   DS Lab — lab page: Jupyter-style notebook with saved outputs
   ============================================================ */
(function () {
  "use strict";

  var D = window.DSLAB_DATA || {};
  var icon = window.DSLAB_ICON;
  var LAB = null;
  var PART = null;

  /* ---------------- helpers ---------------- */
  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function normSrc(s) {
    return String(s).replace(/\r\n/g, "\n").trim();
  }

  /* ---------------- syntax highlighting ---------------- */
  var KEYWORDS = {};
  ["False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"].forEach(function (k) { KEYWORDS[k] = 1; });

  function highlight(src) {
    var html = esc(src);
    var stash = [];
    function stashPut(h) {
      stash.push(h);
      // private-use-area chars: no digits, so later passes never touch the marker
      return "\uE000" + String.fromCharCode(0xE100 + stash.length - 1) + "\uE001";
    }
    // comments first, then strings (both stashed so later passes skip them)
    html = html.replace(/#[^\n]*/g, function (m) { return stashPut('<span class="tok-c">' + m + "</span>"); });
    // esc() turned double quotes into &quot; — match those strings, plus single-quoted strings
    html = html.replace(/&quot;(?:(?!&quot;)[\s\S])*&quot;|'(?:[^'\\\n]|\\.)*'/g, function (m) {
      return stashPut('<span class="tok-s">' + m + "</span>");
    });
    // keywords
    html = html.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, function (m) {
      if (KEYWORDS[m]) return '<span class="tok-k">' + m + "</span>";
      return m;
    });
    // function calls
    html = html.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b(?=\()/g, function (m) {
      if (KEYWORDS[m]) return m;
      return '<span class="tok-f">' + m + "</span>";
    });
    // numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-n">$1</span>');
    // restore stashed strings/comments
    html = html.replace(/\uE000(.)\uE001/g, function (m, c) { return stash[c.charCodeAt(0) - 0xE100]; });
    return html;
  }

  /* ---------------- toast ---------------- */
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.innerHTML = '<span class="toast__dot"></span>' + esc(msg);
    t.classList.add("toast--show");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("toast--show"); }, 1800);
  }

  /* ---------------- shell (breadcrumb, sidebar, header) ---------------- */
  function buildShell() {
    var lab = LAB;
    var el = document.getElementById("lab-shell");

    el.innerHTML =
      '<main><div class="wrap">' +
      '<div class="crumb" style="margin-top:22px">' +
      '<a href="index.html">Home</a>' + icon("chev") +
      '<a href="experiments.html">Experiments</a>' + icon("chev") +
      "<span>" + lab.code + "</span></div>" +

      '<div class="labgrid">' +
      '<aside class="labnav" aria-label="Experiment parts">' +
      '<p class="labnav__title">' + lab.code + " — parts</p>" +
      '<div class="labnav__list">' +
      lab.parts.map(function (p) {
        return '<button class="labnav__btn" data-part="' + p.id + '">' +
          '<span class="labnav__badge">' + esc(p.label) + "</span>" +
          '<span class="labnav__t">' + esc(p.title) + "</span></button>";
      }).join("") +
      "</div>" +
      '<p class="labnav__labelonly" style="margin-top:18px">About results</p>' +
      '<p style="font-size:12.5px;color:var(--ink-3);padding:0 12px;line-height:1.55;margin:0">' +
      "Every output below is the exact saved result captured when the lab record was executed. Edit any cell and press Run to re-display its saved output.</p>" +
      '<p class="labnav__labelonly" style="margin-top:18px">Record</p>' +
      '<a class="pdfbtn" style="margin:0 12px" href="assets/pdf/lab-record.pdf" target="_blank" rel="noopener">Lab record PDF ' + icon("arrow") + "</a>" +
      "</aside>" +

      '<section class="labhead">' +
      '<span class="expcode">' + lab.code + "</span>" +
      '<h1 class="labhead__title">' + esc(lab.title) + "</h1>" +
      '<p class="labhead__desc">' + esc(lab.summary) + "</p>" +
      '<div class="nb">' +
      '<div class="nb__bar">' +
      '<span class="nb__title"><span class="nb__dot"></span><span id="nb-filename"></span></span>' +
      '<span style="font-family:var(--font-mono);font-size:11.5px;color:var(--ink-3)" id="nb-cellinfo"></span>' +
      '<div class="nb__actions">' +
      '<button class="btn btn--ghost" id="nb-reset" style="padding:7px 14px;font-size:13px">Reset</button>' +
      '<button class="btn btn--primary" id="nb-runall" style="padding:7px 16px;font-size:13px">' + icon("play") + "Run all</button>" +
      "</div></div>" +
      '<div class="nb__body" id="nb-body"></div>' +
      "</div>" +
      "</section></div></div></main>";

    // wire sidebar buttons
    el.querySelectorAll(".labnav__btn").forEach(function (b) {
      b.addEventListener("click", function () {
        showPart(b.getAttribute("data-part"));
      });
    });
    document.getElementById("nb-runall").addEventListener("click", runAll);
    document.getElementById("nb-reset").addEventListener("click", function () {
      renderNotebook();
      toast("Notebook reset to the saved record");
    });
  }

  /* ---------------- output rendering ---------------- */
  function outTagLabel(kind) {
    if (kind === "stream") return "stdout";
    if (kind === "result") return "result";
    if (kind === "error") return "error";
    return "output";
  }

  function renderOneOutput(out) {
    if (!out || out.kind === "none") return "";
    var cls = out.kind === "error" ? " cellout--error" : "";
    var h = '<div class="cellout' + cls + '">';
    if (out.kind === "error") {
      h += '<p class="cellout__errname">' + esc(out.ename) + " — " + esc(out.evalue) + "</p>";
      h += '<div class="cellout__body"><pre class="cellout__text">' + esc(out.traceback) + "</pre></div>";
    } else {
      h += '<span class="cellout__tag">' + outTagLabel(out.kind) + "</span>";
      var body = "";
      var hasDf = out.html && /<table[^>]*dataframe/.test(out.html);
      if (hasDf) {
        body += '<div class="cellout__df">' + out.html + "</div>";
      } else if (out.text && out.text.trim()) {
        body += '<pre class="cellout__text">' + esc(out.text) + "</pre>";
      }
      (out.images || []).forEach(function (src) {
        body += '<img class="cellout__img" loading="lazy" src="' + src + '" alt="Saved chart from the executed notebook"/>';
      });
      h += '<div class="cellout__body">' + body + "</div>";
    }
    h += "</div>";
    return h;
  }

  function renderOutputs(outs, fresh) {
    if (!outs || !outs.length) {
      return '<div class="cell__out"><p style="font-size:12.5px;color:var(--ink-3);font-family:var(--font-mono);margin:2px 0 0">No saved output for this cell — it produced none in the record.</p></div>';
    }
    var h = '<div class="cell__out' + (fresh ? " cell__out--fresh" : "") + '">';
    outs.forEach(function (o) { h += renderOneOutput(o); });
    h += "</div>";
    return h;
  }

  /* ---------------- cell rendering ---------------- */
  function cellHtml(ci, c) {
    return '<div class="cell" data-cell="' + ci + '">' +
      '<div class="cell__gutter"><span class="cell__prompt">[' + (ci + 1) + "]</span></div>" +
      '<div class="cell__body">' +
      '<div class="cell__srcWrap">' +
      '<pre class="cell__pre" aria-hidden="true"></pre>' +
      '<textarea class="cell__edit" spellcheck="false" aria-label="Code cell ' + (ci + 1) + '"></textarea>' +
      "</div>" +
      '<div class="cell__out"></div>' +
      '<div class="cell__runrow">' +
      '<button class="cell__run" data-run="' + ci + '">' + icon("play") + "Run</button>" +
      '<span class="cell__hint">Shift + Enter</span>' +
      "</div></div></div>";
  }

  function wireCell(cellEl, c) {
    var pre = cellEl.querySelector(".cell__pre");
    var ta = cellEl.querySelector(".cell__edit");
    var outEl = cellEl.querySelector(".cell__out");

    function updatePre() {
      pre.innerHTML = highlight(ta.value) + "\n";
    }
    function autoHeight() {
      ta.style.height = "auto";
      var h = Math.max(pre.scrollHeight, ta.scrollHeight);
      ta.style.height = h + "px";
      pre.style.minHeight = h + "px";
    }
    function run(fresh) {
      var saved = findSavedOutputs(ta.value);
      outEl.innerHTML = renderOutputs(saved, fresh);
      return saved;
    }

    ta.value = c.src;
    ta.addEventListener("input", function () { updatePre(); autoHeight(); });
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 4;
        updatePre();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        run(true);
        toast("Cell [" + (Number(cellEl.getAttribute("data-cell")) + 1) + "] output refreshed");
      }
    });

    cellEl.querySelector(".cell__run").addEventListener("click", function () {
      run(true);
      toast("Cell [" + (Number(cellEl.getAttribute("data-cell")) + 1) + "] output refreshed");
    });

    updatePre();
    autoHeight();
    outEl.innerHTML = renderOutputs(c.outputs, false);
  }

  /* ---------------- saved-output lookup ---------------- */
  function findSavedOutputs(srcNorm) {
    var key = normSrc(srcNorm);
    var pool = PART.cells.filter(function (c) { return c.outputs && c.outputs.length; });
    // exact match first
    for (var i = 0; i < pool.length; i++) {
      if (normSrc(pool[i].src) === key) return pool[i].outputs;
    }
    // first-line match fallback
    var first = key.split("\n")[0];
    for (var j = 0; j < pool.length; j++) {
      if (normSrc(pool[j].src).split("\n")[0] === first) return pool[j].outputs;
    }
    // same cell index fallback (cell unedited) — handled by caller order; give nearest with outputs
    return null;
  }

  /* ---------------- run all ---------------- */
  function runAll() {
    var ran = 0;
    document.querySelectorAll("#nb-body .cell").forEach(function (cellEl) {
      var ci = Number(cellEl.getAttribute("data-cell"));
      var c = PART.cells[ci];
      if (!c) return;
      var ta = cellEl.querySelector(".cell__edit");
      var saved = findSavedOutputs(ta.value || c.src);
      cellEl.querySelector(".cell__out").innerHTML = renderOutputs(saved || c.outputs, true);
      ran++;
    });
    toast("Ran " + ran + " cells — saved outputs restored");
  }

  /* ---------------- part switching ---------------- */
  function setActiveBtn(pid) {
    document.querySelectorAll(".labnav__btn").forEach(function (b) {
      var on = b.getAttribute("data-part") === pid;
      b.classList.toggle("labnav__btn--on", on);
      if (on) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
  }

  function renderNotebook() {
    var nbBody = document.getElementById("nb-body");
    nbBody.innerHTML = PART.cells.map(function (c, ci) { return cellHtml(ci, c); }).join("");
    nbBody.querySelectorAll(".cell").forEach(function (cellEl) {
      var ci = Number(cellEl.getAttribute("data-cell"));
      wireCell(cellEl, PART.cells[ci]);
    });
    document.getElementById("nb-filename").textContent = LAB.code + "-" + PART.label + ".ipynb";
    document.getElementById("nb-cellinfo").textContent =
      PART.cells.length + " cell" + (PART.cells.length > 1 ? "s" : "") + " · saved outputs from the executed record";
    setActiveBtn(PART.id);
    try {
      var u = new URL(location.href);
      u.searchParams.set("exp", LAB.id);
      u.searchParams.set("part", PART.id);
      history.replaceState(null, "", u);
    } catch (e) {}
  }

  function showPart(pid) {
    var idx = -1;
    LAB.parts.forEach(function (p, i) { if (String(p.id) === String(pid)) idx = i; });
    PART = LAB.parts[idx >= 0 ? idx : 0];
    renderNotebook();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var exp = qs("exp") || "1";
    LAB = (D.labs || []).filter(function (l) { return String(l.id) === String(exp); })[0] || (D.labs || [])[0];
    if (!LAB) return;
    buildShell();
    showPart(qs("part") || LAB.parts[0].id);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
