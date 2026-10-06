/* ============================================================
   DS Lab — shared site logic: nav, search, theme, icons
   ============================================================ */
(function () {
  "use strict";

  var D = window.DSLAB_DATA || {};

  /* ---------------- icons ---------------- */
  var PATHS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    flask: '<path d="M10 2v6L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 8V2"/><path d="M8.5 2h7"/><path d="M7 15h10"/>',
    wrench: '<path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.8L3 17.8V21h3.2l5.7-5.7a4.5 4.5 0 0 0 5.8-6L14.5 12 12 9.5l2.7-3.2Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 4v5h5"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6"/>',
    download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    box: '<path d="m21 8-9-5-9 5v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v9"/>',
    cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 .4-9A7 7 0 0 0 4.3 12.5 3.5 3.5 0 0 0 5.5 19h12Z"/>',
    code: '<path d="m8 6-6 6 6 6"/><path d="m16 6 6 6-6 6"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    sigma: '<path d="M18 6H6l6 6-6 6h12"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 13 4-4 4 3 5-6"/>',
    palette: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/><path d="M12 21a2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h2.5"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    branch: '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="8" r="2.6"/><path d="M6 8.6v6.8"/><path d="M15.4 8.6c0 4-3.4 5-6.4 5.4"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
  };

  function icon(name, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PATHS[name] || "") + "</svg>";
  }
  window.DSLAB_ICON = icon;

  /* ---------------- theme ---------------- */
  function applyTheme(t) {
    if (t === "dark") {
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.removeAttribute("data-theme");
    }
    try { localStorage.setItem("dslab-theme", t); } catch (e) {}
  }
  try {
    var saved = localStorage.getItem("dslab-theme");
    if (saved) applyTheme(saved);
  } catch (e) {}
  // body exists only after DOM ready; theme attr on <html> to avoid flash
  (function () {
    var t = null;
    try { t = localStorage.getItem("dslab-theme"); } catch (e) {}
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
  })();
  document.addEventListener("DOMContentLoaded", function () {
    var t = null;
    try { t = localStorage.getItem("dslab-theme"); } catch (e) {}
    applyTheme(t === "dark" ? "dark" : "light");
  });

  window.DSLAB_TOGGLE_THEME = function () {
    var dark = document.body.getAttribute("data-theme") === "dark";
    applyTheme(dark ? "light" : "dark");
  };

  /* ---------------- shared nav/footer markup ---------------- */
  function navLink(p) {
    var active = location.pathname.split("/").pop() === p.url || (location.pathname.split("/").pop() === "" && p.url === "index.html");
    return '<a class="nav__link' + (active ? " nav__link--active" : "") + '" href="' + p.url + '" ' +
      (active ? 'aria-current="page"' : "") + ">" + p.title + "</a>";
  }

  function expMenuItem(lab) {
    return '<a class="expmenu__item" href="lab.html?exp=' + lab.id + '">' +
      '<span class="expcode expmenu__code">' + lab.code + "</span>" +
      '<span><span class="expmenu__title">' + lab.title + "</span>" +
      '<span class="expmenu__meta">' + lab.parts.length + " part" + (lab.parts.length > 1 ? "s" : "") + " · " +
      lab.tags.join(" · ") + "</span></span></a>";
  }

  function buildNav() {
    var el = document.getElementById("site-nav");
    if (!el) return;
    el.classList.add("nav");
    var pages = D.pages || [];
    var html =
      '<div class="nav__inner">' +
      '<a class="brand" href="index.html">' +
      '<span class="brand__mark">DS</span>' +
      '<span><span class="brand__name">DS Lab</span><br/><span class="brand__sub">Mohan Babu University</span></span>' +
      "</a>" +
      '<nav class="nav__links" aria-label="Primary">';

    pages.forEach(function (p) {
      if (p.id === "experiments") {
        html += '<span style="position:relative">' +
          '<button class="nav__link" id="expnav-btn" aria-haspopup="true" aria-expanded="false">EXP ' + icon("chev") + "</button>" +
          '<span class="expmenu" id="expnav-menu" role="menu">';
        (D.labs || []).forEach(function (l) { html += expMenuItem(l); });
        html += "</span></span>";
      } else if (p.id !== "home") {
        html += navLink(p);
      } else {
        html = navLink(p) + html; // keep Home first — rebuild below properly
      }
    });
    // simpler: rebuild explicitly in order
    html = '<div class="nav__inner">' +
      '<a class="brand" href="index.html">' +
      '<span class="brand__mark">DS</span>' +
      '<span><span class="brand__name">DS Lab</span><br/><span class="brand__sub">Mohan Babu University</span></span>' +
      "</a>" +
      '<nav class="nav__links" aria-label="Primary">';
    pages.forEach(function (p) {
      if (p.id === "experiments") {
        html += '<span style="position:relative">' +
          '<a class="nav__link" href="experiments.html" id="expnav-link">EXP</a>' +
          '<button class="nav__link" id="expnav-btn" aria-haspopup="true" aria-expanded="false" style="padding:8px 6px;margin-left:-4px">' + icon("chev") + "</button>" +
          '<span class="expmenu" id="expnav-menu" role="menu">';
        (D.labs || []).forEach(function (l) { html += expMenuItem(l); });
        html += "</span></span>";
      } else {
        html += navLink(p);
      }
    });
    html += "</nav>" +
      '<div class="nav__right">' +
      '<label class="searchbox" for="site-search">' + icon("search") +
      '<input class="searchbox__input" id="site-search" type="search" placeholder="Search experiments, tools…" autocomplete="off" aria-label="Search the site"/></label>' +
      '<button class="iconbtn iconbtn--search" id="msearch-btn" aria-label="Open search">' + icon("search") + "</button>" +
      '<button class="iconbtn iconbtn--moon" onclick="DSLAB_TOGGLE_THEME()" aria-label="Switch to dark theme">' + icon("moon") + "</button>" +
      '<button class="iconbtn iconbtn--sun" onclick="DSLAB_TOGGLE_THEME()" aria-label="Switch to light theme">' + icon("sun") + "</button>" +
      '<button class="iconbtn iconbtn--menuburger" id="mmenu-btn" aria-label="Open menu">' + icon("menu") + "</button>" +
      "</div></div>" +
      '<div class="msearch" id="msearch"><label class="searchbox" for="m-site-search">' + icon("search") +
      '<input class="searchbox__input" id="m-site-search" type="search" placeholder="Search experiments, tools…" autocomplete="off" aria-label="Search the site"/></label>' +
      '<span class="searchpop" id="m-searchpop"></span></div>' +
      '<nav class="mmenu" id="mmenu" aria-label="Mobile">';
    pages.forEach(function (p) { html += '<a href="' + p.url + '">' + p.title + "</a>"; });
    html += "</nav>";

    el.innerHTML = html;
    wireExpMenu();
    wireSearch(document.getElementById("site-search"), document.getElementById("searchpop-slot"));
    wireSearch(document.getElementById("m-site-search"), document.getElementById("m-searchpop"));
    wireMobileNav();
  }

  function wireExpMenu() {
    var btn = document.getElementById("expnav-btn");
    var menu = document.getElementById("expnav-menu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.toggle("expmenu--open");
      btn.setAttribute("aria-expanded", menu.classList.contains("expmenu--open"));
    });
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.classList.remove("expmenu--open");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") menu.classList.remove("expmenu--open");
    });
  }

  /* ---------------- search ---------------- */
  var INDEX = [];
  function buildIndex() {
    INDEX = [];
    (D.pages || []).forEach(function (p) {
      INDEX.push({ kind: "page", t: p.title, s: p.desc, url: p.url });
    });
    (D.labs || []).forEach(function (l) {
      INDEX.push({ kind: "exp", t: l.code + " · " + l.title, s: l.summary, url: "lab.html?exp=" + l.id, kw: l.tags.join(" ") });
      (l.parts || []).forEach(function (part) {
        var sep = part.label.length === 1 ? "" : " ";
        INDEX.push({ kind: "part", t: l.code + sep + part.label + " · " + part.title, s: part.desc, url: "lab.html?exp=" + l.id + "&part=" + part.id, kw: l.tags.join(" ") });
      });
    });
    (D.modules || []).forEach(function (m) {
      INDEX.push({ kind: "module", t: "Module " + m.id + " · " + m.title, s: m.topics.join(", "), url: "modules.html#module-" + m.id });
    });
    (D.tools || []).forEach(function (t) {
      INDEX.push({ kind: "tool", t: t.name, s: t.desc, url: "tools.html#tool-" + t.id });
    });
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    var words = q.split(/\s+/);
    return INDEX.map(function (item) {
      var hay = (item.t + " " + item.s + " " + (item.kw || "")).toLowerCase();
      var score = 0;
      words.forEach(function (w) {
        var ti = item.t.toLowerCase().indexOf(w);
        var si = item.s.toLowerCase().indexOf(w);
        if (ti === 0) score += 6;
        else if (ti > 0) score += 4;
        else if (si >= 0) score += 2;
        else if ((item.kw || "").toLowerCase().indexOf(w) >= 0) score += 1;
      });
      return score > 0 ? { item: item, score: score } : null;
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; })
      .slice(0, 8)
      .map(function (r) { return r.item; });
  }

  function hl(text, q) {
    var words = q.trim().split(/\s+/).filter(Boolean);
    var safe = esc(text);
    if (!words.length) return safe;
    words.forEach(function (w) {
      var re = new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
      safe = safe.replace(re, "<mark>$1</mark>");
    });
    return safe;
  }

  function wireSearch(input, pop) {
    if (!input) return;
    if (!pop) {
      // create popover inline next to the input (desktop)
      pop = document.createElement("span");
      pop.className = "searchpop";
      pop.id = input.id + "-pop";
      input.closest(".searchbox").appendChild(pop);
    }
    var on = -1;
    function render(items, q) {
      if (!q.trim()) { pop.classList.remove("searchpop--open"); pop.innerHTML = ""; return; }
      if (!items.length) {
        pop.innerHTML = '<span class="searchpop__empty">No matches for “' + esc(q) + '” — try “pandas”, “EXP-5”, “box plot”…</span>';
      } else {
        pop.innerHTML = items.map(function (it, i) {
          return '<a class="searchpop__item' + (i === on ? " searchpop__item--on" : "") + '" data-i="' + i + '" href="' + it.url + '">' +
            '<span class="searchpop__kind">' + it.kind + "</span>" +
            "<span><span class='searchpop__t'>" + hl(it.t, q) + "</span>" +
            "<span class='searchpop__s'>" + hl(it.s, q) + "</span></span></a>";
        }).join("");
      }
      pop.classList.add("searchpop--open");
    }

    input.addEventListener("input", function () {
      on = -1;
      render(search(input.value), input.value);
    });
    input.addEventListener("focus", function () {
      if (input.value.trim()) render(search(input.value), input.value);
    });
    input.addEventListener("keydown", function (e) {
      var items = search(input.value);
      if (e.key === "ArrowDown") { e.preventDefault(); on = Math.min(on + 1, items.length - 1); render(items, input.value); }
      else if (e.key === "ArrowUp") { e.preventDefault(); on = Math.max(on - 1, 0); render(items, input.value); }
      else if (e.key === "Enter") {
        var target = on >= 0 ? items[on] : items[0];
        if (target) location.href = target.url;
      } else if (e.key === "Escape") {
        pop.classList.remove("searchpop--open");
        input.blur();
      }
    });
    document.addEventListener("click", function (e) {
      if (!pop.contains(e.target) && e.target !== input) pop.classList.remove("searchpop--open");
    });
  }

  function wireMobileNav() {
    var mb = document.getElementById("mmenu-btn");
    var mm = document.getElementById("mmenu");
    var sb = document.getElementById("msearch-btn");
    var ms = document.getElementById("msearch");
    if (mb && mm) {
      mb.addEventListener("click", function () {
        mm.classList.toggle("mmenu--open");
        ms && ms.classList.remove("msearch--open");
      });
    }
    if (sb && ms) {
      sb.addEventListener("click", function () {
        ms.classList.toggle("msearch--open");
        mm && mm.classList.remove("mmenu--open");
        if (ms.classList.contains("msearch--open")) {
          var inp = ms.querySelector("input");
          inp && inp.focus();
        }
      });
    }
  }

  /* ---------------- footer ---------------- */
  function buildFooter() {
    var el = document.getElementById("site-foot");
    if (!el) return;
    var st = (D.meta && D.meta.student) || {};
    var labs = (D.labs || []).map(function (l) {
      return '<li><a href="lab.html?exp=' + l.id + '">' + l.code + " — " + l.title + "</a></li>";
    }).join("");
    var tools = (D.tools || []).slice(0, 5).map(function (t) {
      return '<li><a href="tools.html#tool-' + t.id + '">' + t.name + "</a></li>";
    }).join("");
    var pages = (D.pages || []).map(function (p) {
      return '<li><a href="' + p.url + '">' + p.title + "</a></li>";
    }).join("");
    el.innerHTML =
      '<div class="wrap"><div class="foot__cols">' +
      "<div><a class='brand' href='index.html'>" +
      "<span class='brand__mark'>DS</span>" +
      "<span><span class='brand__name'>DS Lab</span><br/><span class='brand__sub'>Mohan Babu University</span></span></a>" +
      "<p class='foot__brandline'>A living experiment record for the Data Science lab — " + ((D.meta && D.meta.stats.labs) || 5) + " experiments, every part readable and runnable.</p></div>" +
      "<div><p class='foot__h'>Experiments</p><ul class='foot__list'>" + labs + "</ul></div>" +
      "<div><p class='foot__h'>Pages</p><ul class='foot__list'>" + pages + "</ul></div>" +
      "<div><p class='foot__h'>Toolkit</p><ul class='foot__list'>" + tools + "</ul></div>" +
      "</div><div class='foot__base'>" +
      "<span>© 2026 " + st.name + " · Roll " + st.roll + " · Section " + st.section + "</span>" +
      "<span class='foot__made'>Faculty — " + st.faculty + ", " + st.designation + "</span>" +
      "</div></div>";
  }

  /* ---------------- boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildNav();
    buildFooter();
    buildIndex();
  });
})();
