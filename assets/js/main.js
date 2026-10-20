/* ==========================================================================
   DS LAB — interaction layer.
   Vanilla JS, zero dependencies, classic deferred script (works from file://).
   Each module is an IIFE that returns early if its markup is absent.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     0. HELPERS
     --------------------------------------------------------------------- */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* One rAF loop for all per-frame work — cheaper and more predictable than
     one loop per effect. */
  var ticks = [];
  function tick(fn) { ticks.push(fn); }
  function loop(t) {
    for (var i = 0; i < ticks.length; i++) ticks[i](t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* One throttled scroll observer, many subscribers. */
  var scrollSubs = [];
  var lastScrollY = window.scrollY;
  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var dir = y > lastScrollY ? 'down' : 'up';
      for (var i = 0; i < scrollSubs.length; i++) scrollSubs[i](y, dir);
      lastScrollY = y;
      queued = false;
    });
  }, { passive: true });

  /* ---------------------------------------------------------------------
     1. THEME — persisted; follows the OS until the user chooses.
     --------------------------------------------------------------------- */
  (function theme() {
    var root = document.documentElement;
    var btn = $('#theme-toggle');
    if (!btn) return;
    var icons = { dark: $('[data-icon-dark]', btn), light: $('[data-icon-light]', btn) };

    /* SVGElement has no `hidden` IDL attribute, so `svg.hidden = true` only sets
       a JS expando and never touches the attribute the CSS keys off. Set the
       attribute explicitly instead. */
    function setHidden(node, state) {
      if (!node) return;
      if (state) node.setAttribute('hidden', '');
      else node.removeAttribute('hidden');
    }

    function apply(mode) {
      root.dataset.theme = mode;
      var isDark = mode === 'dark';
      setHidden(icons.dark, !isDark);
      setHidden(icons.light, isDark);
      btn.setAttribute('aria-label', 'Switch to ' + (isDark ? 'light' : 'dark') + ' theme');
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', isDark ? '#0a0a0c' : '#f3f0e9');
    }

    apply(root.dataset.theme || 'dark');

    function toggle() {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('dslab-theme', next); } catch (e) {}
      return next;
    }

    btn.addEventListener('click', toggle);
    window.__toggleTheme = toggle;
  })();

  /* ---------------------------------------------------------------------
     2. TOASTS
     --------------------------------------------------------------------- */
  var toast = (function () {
    var host = $('#toasts');
    return function (message) {
      if (!host) return;
      var el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = '<span class="toast__dot" aria-hidden="true"></span><span></span>';
      el.lastChild.textContent = message;
      host.appendChild(el);
      requestAnimationFrame(function () { el.classList.add('is-in'); });
      setTimeout(function () {
        el.classList.remove('is-in');
        setTimeout(function () { el.remove(); }, 400);
      }, 2600);
    };
  })();

  /* ---------------------------------------------------------------------
     2b. HERO ENTRANCE
     Owned by the loader, not the scroll observer: the last row of a 100vh
     hero sits inside a bottom-inset observer's dead zone.
     --------------------------------------------------------------------- */
  function revealHero() {
    $$('.hero [data-reveal], .hero [data-split]').forEach(function (n) {
      n.classList.add('is-visible');
    });
  }

  /* ---------------------------------------------------------------------
     3. PRELOADER — counter, then curtain. Fails safe in 3.5s.
     --------------------------------------------------------------------- */
  (function preloader() {
    var el = $('#preloader');
    if (!el) return;

    var counter = $('#preloader-count');
    var bar = $('#preloader-bar');
    var status = $('#preloader-status');
    var steps = ['Loading record', 'Indexing experiments', 'Reading notebooks', 'Ready'];

    function finish() {
      if (el.classList.contains('is-done')) return;
      el.classList.add('is-done');
      document.body.classList.add('is-ready');
      document.body.classList.remove('is-locked');
      revealHero();
      setTimeout(function () { el.classList.add('is-gone'); }, 1600);
    }

    if (reduced) {
      el.classList.add('is-gone');
      document.body.classList.add('is-ready');
      revealHero();
      return;
    }

    document.body.classList.add('is-locked');

    var start = performance.now();
    var DURATION = 1100;
    var done = false;

    function frame(now) {
      var p = clamp((now - start) / DURATION, 0, 1);
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      var value = Math.round(eased * 100);

      if (counter) counter.textContent = String(value).padStart(3, '0');
      if (bar) bar.style.transform = 'scaleX(' + eased + ')';
      if (status) {
        var s = steps[Math.min(steps.length - 1, Math.floor(eased * steps.length))];
        if (status.textContent !== s) status.textContent = s;
      }

      if (p < 1) requestAnimationFrame(frame);
      else if (!done) { done = true; setTimeout(finish, 240); }
    }
    requestAnimationFrame(frame);
    setTimeout(finish, 3500);
  })();

  /* ---------------------------------------------------------------------
     4. REVEALS — one observer for every entrance, plus word-split headline
        masks and one-time count-ups.
     --------------------------------------------------------------------- */
  (function reveals() {
    function split(el) {
      var nodes = Array.prototype.slice.call(el.childNodes);
      var wrappers = [];
      var lastInner = null;
      var i = 0;

      function makeWord(inner) {
        var outer = document.createElement('span');
        outer.className = 'word';
        outer.style.setProperty('--i', i++);
        inner.className = 'word__in';
        outer.appendChild(inner);
        wrappers.push(outer);
        lastInner = inner;
      }

      nodes.forEach(function (n) {
        if (n.nodeType === 3) {
          var text = n.textContent;
          /* Inline markup splits the text: "…<i>notebooks</i>." would make the
             full stop its own masked word, landing a gap before it. Fold any
             leading punctuation back into the word that precedes it. */
          var punct = text.match(/^\s*([.,;:!?)\]]+)/);
          if (punct && lastInner) {
            lastInner.appendChild(document.createTextNode(punct[1]));
            text = text.slice(punct[0].length);
          }
          text.split(/\s+/).filter(Boolean).forEach(function (w) {
            var inner = document.createElement('span');
            inner.textContent = w;
            makeWord(inner);
          });
        } else if (n.nodeType === 1) {
          var inner = document.createElement('span');
          inner.appendChild(n);
          makeWord(inner);
        }
      });

      // Join with real spaces, so no word carries a trailing space into the mask.
      var frag = document.createDocumentFragment();
      wrappers.forEach(function (w, idx) {
        if (idx) frag.appendChild(document.createTextNode(' '));
        frag.appendChild(w);
      });
      el.replaceChildren(frag);
      el.setAttribute('data-split-done', '');
    }

    $$('[data-split]').forEach(split);

    if (!('IntersectionObserver' in window)) {
      $$('[data-reveal], [data-split]').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    $$('[data-reveal], [data-split]').forEach(function (el) { io.observe(el); });

    // If the loader already finished, catch the hero up immediately.
    if (document.body.classList.contains('is-ready')) revealHero();

    function countUp(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var start = performance.now();
      function step(now) {
        var p = clamp((now - start) / 1300, 0, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      }
      requestAnimationFrame(step);
    }

    var counters = $$('[data-count]');
    if (counters.length) {
      if (reduced) {
        counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      } else {
        var cio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            countUp(entry.target);
            cio.unobserve(entry.target);
          });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { cio.observe(el); });
      }
    }
  })();

  /* ---------------------------------------------------------------------
     5. NAV — progress bar, sticky state, hide-on-scroll-down.
     --------------------------------------------------------------------- */
  (function nav() {
    var el = $('#nav');
    var bar = $('#progress-bar');
    var locked = false;
    var lockTimer = null;
    var settleTimer = null;

    /* A programmatic jump registers as a downward scroll, which would hide the
       nav the instant it is used. Hold it open until the move has actually
       stopped — a fixed timer can expire while a slow smooth scroll is still
       running, and then the nav hides mid-jump. */
    window.__navLock = function (state) {
      locked = state;
      if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; }
      if (settleTimer) { clearInterval(settleTimer); settleTimer = null; }
      if (!state) return;
      if (el) el.classList.remove('is-hidden');

      var last = window.scrollY;
      var still = 0;
      settleTimer = setInterval(function () {
        if (!locked) { clearInterval(settleTimer); settleTimer = null; return; }
        var y = window.scrollY;
        if (Math.abs(y - last) < 0.5) {
          still++;
          if (still >= 3) { locked = false; clearInterval(settleTimer); settleTimer = null; }
        } else {
          still = 0;
          last = y;
        }
      }, 60);

      lockTimer = setTimeout(function () { locked = false; }, 4000);
    };

    ['wheel', 'touchmove'].forEach(function (evt) {
      window.addEventListener(evt, function () { locked = false; }, { passive: true });
    });
    window.addEventListener('keydown', function (e) {
      if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key)) locked = false;
    });

    scrollSubs.push(function (y, dir) {
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
      }
      if (el) {
        el.classList.toggle('is-stuck', y > 24);
        el.classList.toggle('is-hidden', y > 640 && dir === 'down' && !locked);
      }
    });

    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () { window.__navLock(true); });
    });
  })();

  /* ---------------------------------------------------------------------
     6. MOBILE MENU — focus-managed, Escape-dismissable.
     --------------------------------------------------------------------- */
  (function menu() {
    var el = $('#menu');
    var openBtn = $('#menu-open');
    var closeBtn = $('#menu-close');
    if (!el || !openBtn) return;

    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      el.hidden = false;
      requestAnimationFrame(function () { el.classList.add('is-open'); });
      document.body.classList.add('is-locked');
      openBtn.setAttribute('aria-expanded', 'true');
      if (window.__navLock) window.__navLock(true);
      var first = $('.menu__link', el);
      if (first) first.focus();
    }

    function close() {
      el.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      openBtn.setAttribute('aria-expanded', 'false');
      if (window.__navLock) window.__navLock(false);
      setTimeout(function () { el.hidden = true; }, 700);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    $$('.menu__link, [data-palette-open]', el).forEach(function (a) {
      if (a.hasAttribute('data-palette-open')) a.addEventListener('click', close);
    });

    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button', el).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.__closeMenu = close;
  })();

  /* ---------------------------------------------------------------------
     7. COMMAND PALETTE — fuzzy search over pages, sections and actions.
     --------------------------------------------------------------------- */
  (function palette() {
    var el = $('#palette');
    var input = $('#palette-input');
    var list = $('#palette-list');
    if (!el || !input || !list) return;

    /* A programmatic jump registers as a downward scroll, which would hide the
       nav the instant it is used. Hold it open until the user scrolls. */
    function lockNav() {
      if (window.__navLock) window.__navLock(true);
    }

    function go(hash) {
      var target = document.querySelector(hash);
      if (!target) return;
      lockNav();
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }

    function copy(text, label) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () { toast(label + ' copied'); })
          .catch(function () { toast(label + ': ' + text); });
      } else {
        toast(label + ': ' + text);
      }
    }

    var commands = [
      { group: 'Pages', label: 'Home', hint: 'index', icon: 'i-home', run: function () { window.location.href = 'index.html'; } },
      { group: 'Pages', label: 'Experiments', hint: '6 labs', icon: 'i-flask', run: function () { window.location.href = 'experiments.html'; } },
      { group: 'Pages', label: 'Modules', hint: 'PDFs', icon: 'i-pdf', run: function () { window.location.href = 'modules.html'; } },
      { group: 'Pages', label: 'Tools', hint: '10', icon: 'i-tools', run: function () { window.location.href = 'tools.html'; } },

      { group: 'Actions', label: 'Open the lab record PDF', hint: 'PDF', icon: 'i-pdf', run: function () { window.open('assets/pdf/lab-record.pdf', '_blank', 'noopener'); } },
      { group: 'Actions', label: 'Toggle light / dark theme', icon: 'i-moon', run: function () { if (window.__toggleTheme) window.__toggleTheme(); } },
      { group: 'Actions', label: 'Copy roll number', hint: '24102A030124', icon: 'i-copy', run: function () { copy('24102A030124', 'Roll number'); } },
      { group: 'Actions', label: 'Copy student name', icon: 'i-copy', run: function () { copy('GANDODI PRANEETH KUMAR', 'Name'); } },
      { group: 'Actions', label: 'GitHub profile', icon: 'i-out', run: function () { window.open('https://github.com/Praneeth-Gandodi', '_blank', 'noopener'); } },
      { group: 'Actions', label: 'Back to top', hint: '↑', icon: 'i-top', run: function () { lockNav(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); } },

      { group: 'Tool docs', label: 'pandas documentation', icon: 'i-out', run: function () { window.open('https://pandas.pydata.org/docs/', '_blank', 'noopener'); } },
      { group: 'Tool docs', label: 'NumPy documentation', icon: 'i-out', run: function () { window.open('https://numpy.org/doc/stable/', '_blank', 'noopener'); } },
      { group: 'Tool docs', label: 'Matplotlib documentation', icon: 'i-out', run: function () { window.open('https://matplotlib.org/stable/', '_blank', 'noopener'); } },
      { group: 'Tool docs', label: 'Seaborn documentation', icon: 'i-out', run: function () { window.open('https://seaborn.pydata.org/', '_blank', 'noopener'); } },
      { group: 'Tool docs', label: 'Jupyter', icon: 'i-out', run: function () { window.open('https://jupyter.org', '_blank', 'noopener'); } },
      { group: 'Tool docs', label: 'DB Browser for SQLite', icon: 'i-out', run: function () { window.open('https://sqlitebrowser.org', '_blank', 'noopener'); } }
    ];

    /* In-page jumps are declared in markup with [data-jump], so the palette
       offers the right destinations on every page rather than just the home
       page. Declared after the Pages group. */
    $$('[data-jump]').forEach(function (el, i) {
      if (!el.id) return;
      commands.splice(4 + i, 0, {
        group: 'This page',
        label: 'Jump to ' + el.getAttribute('data-jump'),
        icon: el.getAttribute('data-jump-icon') || 'i-right',
        run: function () { go('#' + el.id); }
      });
    });

    /* Subsequence fuzzy match: direct hits beat scattered ones. */
    function score(q, text) {
      q = q.toLowerCase(); text = text.toLowerCase();
      if (!q) return 1;
      var direct = text.indexOf(q);
      if (direct > -1) return 200 - direct;
      var ti = 0, total = 0, streak = 0;
      for (var i = 0; i < q.length; i++) {
        var idx = text.indexOf(q[i], ti);
        if (idx === -1) return -1;
        streak = idx === ti ? streak + 1 : 0;
        total += 12 + streak * 5 - Math.min(idx - ti, 10);
        ti = idx + 1;
      }
      return total;
    }

    var active = 0;
    var results = [];

    function render(query) {
      var scored = commands.map(function (c) {
        return { cmd: c, s: score(query, c.label + ' ' + (c.group || '')) };
      }).filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; });

      results = scored.map(function (r) { return r.cmd; });
      active = 0;
      list.innerHTML = '';

      if (!results.length) {
        var empty = document.createElement('div');
        empty.className = 'palette__empty';
        empty.textContent = 'Nothing matches “' + query + '”.';
        list.appendChild(empty);
        return;
      }

      var group = null;
      results.forEach(function (cmd, i) {
        if (cmd.group && cmd.group !== group) {
          group = cmd.group;
          var g = document.createElement('div');
          g.className = 'palette__group';
          g.textContent = group;
          list.appendChild(g);
        }
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'palette__item';
        item.setAttribute('role', 'option');
        item.setAttribute('data-index', i);
        item.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        item.setAttribute('data-active', i === 0 ? 'true' : 'false');
        item.innerHTML =
          '<svg width="15" height="15" aria-hidden="true"><use href="#' + cmd.icon + '"/></svg>' +
          '<b></b>' +
          (cmd.hint ? '<small class="palette__hint">' + cmd.hint + '</small>' : '');
        item.querySelector('b').textContent = cmd.label;
        item.addEventListener('click', function () { run(i); });
        item.addEventListener('pointermove', function () { setActive(i); });
        list.appendChild(item);
      });
    }

    function setActive(i) {
      active = i;
      $$('.palette__item', list).forEach(function (n) {
        var on = Number(n.getAttribute('data-index')) === i;
        n.setAttribute('data-active', on ? 'true' : 'false');
        n.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on && n.scrollIntoView) n.scrollIntoView({ block: 'nearest' });
      });
    }

    function run(i) {
      var cmd = results[i];
      if (!cmd) return;
      close();
      setTimeout(cmd.run, 120);
    }

    var lastFocus = null;
    var isOpen = false;

    function open(query) {
      if (window.__closeMenu && document.body.classList.contains('is-locked')) window.__closeMenu();
      lastFocus = document.activeElement;
      isOpen = true;
      el.hidden = false;
      render(query || '');
      input.value = query || '';
      requestAnimationFrame(function () { el.classList.add('is-open'); });
      document.body.classList.add('is-locked');
      input.focus();
    }

    function close() {
      isOpen = false;
      el.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(function () { el.hidden = true; }, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    $$('[data-palette-open]').forEach(function (b) {
      b.addEventListener('click', function () { open(); });
    });

    input.addEventListener('input', function () { render(input.value.trim()); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(active + 1, results.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter') { e.preventDefault(); run(active); }
    });

    el.addEventListener('click', function (e) { if (e.target === el) close(); });

    document.addEventListener('keydown', function (e) {
      var ae = document.activeElement;
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? close() : open();
        return;
      }
      if (e.key === 'Escape' && isOpen) { close(); return; }
      if (e.key === '/' && !typing && !isOpen) { e.preventDefault(); open(); return; }

      var overlayOpen = isOpen || document.body.classList.contains('is-locked');
      if (e.key === ' ') return;
      if (!typing && !overlayOpen && !e.metaKey && !e.ctrlKey && !e.altKey &&
          e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
        open(e.key);
      }
    });
  })();

  /* ---------------------------------------------------------------------
     8. HERO DOT GRID — pointer-reactive canvas field.
     --------------------------------------------------------------------- */
  (function dotgrid() {
    var canvas = $('#dotgrid');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var dpr = 1, w = 0, h = 0;
    var dots = [];
    var pointer = { x: -9999, y: -9999 };
    var visible = true;
    var accent = '#ff5a1f';
    var ink = 'rgba(255,255,255,.46)';

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      accent = cs.getPropertyValue('--accent').trim() || accent;
      ink = document.documentElement.dataset.theme === 'light'
        ? 'rgba(20,18,16,.4)'
        : 'rgba(255,255,255,.46)';
    }

    function build() {
      var rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var gap = w < 700 ? 26 : 34;
      dots = [];
      for (var y = gap / 2; y < h + gap; y += gap) {
        for (var x = gap / 2; x < w + gap; x += gap) {
          dots.push({ x: x, y: y, sx: 0, sy: 0, o: 0 });
        }
      }
      readColors();
    }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { pointer.x = -9999; pointer.y = -9999; });

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(build, 150);
    });

    new MutationObserver(readColors).observe(document.documentElement, {
      attributes: true, attributeFilter: ['data-theme']
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }

    build();

    var R = 150, PUSH = 22;

    tick(function () {
      if (!visible || document.hidden) return;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var dx = d.x - pointer.x, dy = d.y - pointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        var tx = 0, ty = 0, to = 0;
        if (dist < R) {
          var f = 1 - dist / R;
          f = f * f;
          var inv = dist > 0.001 ? 1 / dist : 0;
          tx = dx * inv * f * PUSH;
          ty = dy * inv * f * PUSH;
          to = f;
        }

        d.sx = lerp(d.sx, tx, 0.14);
        d.sy = lerp(d.sy, ty, 0.14);
        d.o = lerp(d.o, to, 0.12);

        ctx.beginPath();
        ctx.arc(d.x + d.sx, d.y + d.sy, 1.1 + d.o * 1.5, 0, 6.28318);
        if (d.o > 0.02) {
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.28 + d.o * 0.72;
        } else {
          ctx.fillStyle = ink;
          ctx.globalAlpha = 0.7;
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  })();

  /* ---------------------------------------------------------------------
     9. BUTTONS — wipe origin, magnetic pull.
     --------------------------------------------------------------------- */
  (function buttons() {
    $$('.btn').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--ox', ((e.clientX - r.left) / r.width * 100) + '%');
        btn.style.setProperty('--oy', ((e.clientY - r.top) / r.height * 100) + '%');
      }, { passive: true });
    });

    if (!finePointer || reduced) return;

    $$('[data-magnetic]').forEach(function (el) {
      var raf = null;
      el.addEventListener('pointerenter', function () { el.style.transition = 'transform 120ms linear'; });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.28;
        var y = (e.clientY - (r.top + r.height / 2)) * 0.4;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
        });
      });
      el.addEventListener('pointerleave', function () {
        if (raf) cancelAnimationFrame(raf);
        el.style.transition = 'transform 520ms cubic-bezier(.34,1.56,.64,1)';
        el.style.transform = '';
      });
    });
  })();

  /* ---------------------------------------------------------------------
     10. SPOTLIGHT TILES — pointer position drives a CSS radial gradient.
     --------------------------------------------------------------------- */
  (function spotlight() {
    if (!finePointer) return;
    $$('[data-spotlight]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  })();

  /* ---------------------------------------------------------------------
     11. ID CARD — tilts toward the pointer and catches a moving highlight.
         Purely presentational: all values stay readable without it.
     --------------------------------------------------------------------- */
  (function idcard() {
    var card = $('[data-tilt]');
    if (!card || !finePointer || reduced) return;

    var MAX = 9;

    function reset() {
      card.classList.remove('is-tilting');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--tx', '0');
      card.style.setProperty('--ty', '0');
    }

    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var px = clamp((e.clientX - r.left) / r.width, 0, 1);
      var py = clamp((e.clientY - r.top) / r.height, 0, 1);

      card.classList.add('is-tilting');
      card.style.setProperty('--ry', ((px - 0.5) * 2 * MAX).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - py) * 2 * MAX * 0.68).toFixed(2) + 'deg');
      card.style.setProperty('--tx', ((px - 0.5) * 2).toFixed(3));
      card.style.setProperty('--ty', ((py - 0.5) * 2).toFixed(3));
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    card.addEventListener('pointerleave', reset);
    card.addEventListener('blur', reset, true);
  })();

  /* ---------------------------------------------------------------------
     12. MISC — clock, year, back-to-top, smooth anchors.
     --------------------------------------------------------------------- */
  (function misc() {
    var year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    var clock = $('#clock');
    if (clock) {
      var tickClock = function () {
        clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
      };
      tickClock();
      setInterval(tickClock, 1000);
    }

    var top = $('#totop');
    if (top) {
      scrollSubs.push(function (y) { top.classList.toggle('is-on', y > window.innerHeight * 0.9); });
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }

    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', id);
      });
    });
  })();

  /* ---------------------------------------------------------------------
     13. NOTEBOOK — the editor layer.
     Syntax highlighting, a simulated language server (wavy underlines,
     hover messages, a problem count) and Run / Run all / Reset.

     Nothing here executes Python. Run replays the saved output that ships
     with the markup. The "language server" is a small static checker: the
     only real rule is undefined-name detection, which is what surfaces the
     cells that genuinely failed in the record.
     --------------------------------------------------------------------- */
  (function () {
    var KEYWORDS = {};
    ("False None True and as assert async await break class continue def del elif else except " +
     "finally for from global if import in is lambda nonlocal not or pass raise return try " +
     "while with yield print").split(" ").forEach(function (k) { KEYWORDS[k] = 1; });

    var BUILTINS = {};
    ("print len range int str float bool list dict set tuple sum min max abs round sorted " +
     "enumerate zip map filter type isinstance open repr format super object").split(" ").forEach(function (k) { BUILTINS[k] = 1; });

    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    /* ---------------------------------------------------------- tokenizer */
    function tokenizeText(src) {
      var out = "", i = 0, n = src.length;
      while (i < n) {
        var ch = src.charAt(i);

        if (ch === "#") {
          var e = src.indexOf("\n", i);
          if (e === -1) e = n;
          out += '<span class="tk-com">' + esc(src.slice(i, e)) + "</span>";
          i = e;
          continue;
        }

        if (ch === '"' || ch === "'") {
          var q = ch, j = i + 1;
          while (j < n) {
            if (src.charAt(j) === "\\") { j += 2; continue; }
            if (src.charAt(j) === q) { j++; break; }
            j++;
          }
          out += '<span class="tk-str">' + esc(src.slice(i, j)) + "</span>";
          i = j;
          continue;
        }

        if (/[0-9]/.test(ch) && !/[A-Za-z0-9_]/.test(src.charAt(i - 1))) {
          var k = i;
          while (k < n && /[0-9._]/.test(src.charAt(k))) k++;
          if (/[eE]/.test(src.charAt(k))) {
            k++;
            if (/[+-]/.test(src.charAt(k))) k++;
            while (k < n && /[0-9]/.test(src.charAt(k))) k++;
          }
          out += '<span class="tk-num">' + esc(src.slice(i, k)) + "</span>";
          i = k;
          continue;
        }

        if (/[A-Za-z_]/.test(ch)) {
          var m = i;
          while (m < n && /[A-Za-z0-9_]/.test(src.charAt(m))) m++;
          var word = src.slice(i, m);
          var next = src.charAt(m);
          if (KEYWORDS[word]) out += '<span class="tk-kw">' + word + "</span>";
          else if (next === "(") out += '<span class="tk-fn">' + word + "</span>";
          else if (/^[A-Z]/.test(word)) out += '<span class="tk-cls">' + word + "</span>";
          else if (BUILTINS[word]) out += '<span class="tk-bi">' + word + "</span>";
          else out += esc(word);
          i = m;
          continue;
        }

        if ("=+-*/%<>!&|^~:,.[]".indexOf(ch) > -1) {
          out += '<span class="tk-op">' + esc(ch) + "</span>";
          i++;
          continue;
        }

        out += esc(ch);
        i++;
      }
      return out;
    }

    /* ------------------------------------------------------------- linter */
    var RESERVED = BUILTINS;

    function definitionsIn(src) {
      var names = {}, m;
      src.split("\n").forEach(function (line) {
        if ((m = line.match(/^\s*([A-Za-z_]\w*)\s*=(?!=)/))) names[m[1]] = 1;
        if ((m = line.match(/^\s*([A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)+)\s*=(?!=)/)))
          m[1].split(",").forEach(function (v) { names[v.trim()] = 1; });
        if ((m = line.match(/^\s*import\s+([\w.]+)(?:\s+as\s+(\w+))?/))) names[m[2] || m[1].split(".")[0]] = 1;
        if ((m = line.match(/^\s*from\s+[\w.]+\s+import\s+(.+)$/)))
          m[1].replace(/[()]/g, "").split(",").forEach(function (v) {
            var parts = v.trim().split(/\s+as\s+/);
            if (parts.length) names[parts[parts.length - 1].trim()] = 1;
          });
        if ((m = line.match(/^\s*for\s+([A-Za-z_]\w*)/))) names[m[1]] = 1;
        if ((m = line.match(/^\s*def\s+([A-Za-z_]\w*)/))) names[m[1]] = 1;
        if ((m = line.match(/^\s*with\s+.*\bas\s+([A-Za-z_]\w*)/))) names[m[1]] = 1;
      });
      return names;
    }

    function lintCell(src, defined) {
      var diags = [];
      var local = definitionsIn(src);
      var known = function (name) { return defined[name] || local[name]; };

      src.split("\n").forEach(function (line, li) {
        var indent = line.match(/^\s*/)[0].length;
        var m;

        /* Undefined name in statement position — this is what flags the cells
           that really raised NameError in the record. */
        m = line.match(/^\s*([A-Za-z_]\w*)\s*(\[|\.|\()/);
        if (m && !known(m[1]) && !RESERVED[m[1]]) {
          diags.push({
            line: li, col: indent, len: m[1].length, sev: "error",
            msg: "Name '" + m[1] + "' is not defined", code: "reportUndefinedVariable"
          });
        }

        /* Undefined name on the right-hand side of an assignment. */
        m = line.match(/^\s*[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*\s*=(?!=)\s*([A-Za-z_]\w*)\s*(\.|\[|\()/);
        if (m && !known(m[1]) && !RESERVED[m[1]]) {
          var rhsCol = line.indexOf(m[1], line.indexOf("=") + 1);
          diags.push({
            line: li, col: rhsCol < 0 ? indent : rhsCol, len: m[1].length, sev: "error",
            msg: "Name '" + m[1] + "' is not defined", code: "reportUndefinedVariable"
          });
        }

        /* Calling a submodule, which numpy reports as not callable. */
        m = line.match(/\bnp\.(random|linalg|ma|testing|fft)\s*\(/);
        if (m) {
          diags.push({
            line: li, col: line.indexOf(m[1], line.indexOf("np.")),
            len: m[1].length, sev: "warning",
            msg: "Module 'numpy." + m[1] + "' is not callable — did you mean np.random.rand()?",
            code: "reportCallIssue"
          });
        }

        /* pandas 2.x: DataFrame.append was removed. */
        m = line.match(/\b([A-Za-z_]\w*)\.append\s*\(/);
        if (m) {
          diags.push({
            line: li, col: line.indexOf("append"), len: 6, sev: "warning",
            msg: "DataFrame.append was removed in pandas 2.0 — use pd.concat(...)",
            code: "reportDeprecated"
          });
        }

        /* itertuples is materially faster than iterrows. */
        if (/\biterrows\s*\(/.test(line)) {
          diags.push({
            line: li, col: line.indexOf("iterrows"), len: 8, sev: "info",
            msg: "iterrows() is slow — prefer itertuples() for row iteration",
            code: "toolkitCodeAction"
          });
        }

        /* Star imports hide the namespace and shadow builtins. */
        if (/^\s*from\s+[\w.]+\s+import\s+\*/.test(line)) {
          diags.push({
            line: li, col: indent, len: line.trim().length, sev: "hint",
            msg: "Star import — names land in the namespace without saying where they came from",
            code: "reportWildcardImport"
          });
        }

        if (line.length > 88) {
          diags.push({
            line: li, col: 88, len: line.length - 88, sev: "hint",
            msg: "Line is " + line.length + " characters long (88 allowed)", code: "lineTooLong"
          });
        }

        var tw = line.match(/[ \t]+$/);
        if (tw) {
          diags.push({
            line: li, col: line.length - tw[0].length, len: tw[0].length, sev: "hint",
            msg: "Trailing whitespace", code: "trailingWhitespace"
          });
        }
      });

      return diags;
    }

    /* ------------------------------------------------------------ editors */
    var TIP;

    function tip() {
      if (!TIP) {
        TIP = document.createElement("div");
        TIP.className = "lsp-tip";
        TIP.setAttribute("role", "tooltip");
        TIP.hidden = true;
        document.body.appendChild(TIP);
      }
      return TIP;
    }

    function showTip(target) {
      var raw = target.getAttribute("data-lsp") || "";
      var parts = raw.split("|");
      var box = tip();
      box.innerHTML = '<b class="lsp-tip__sev">' + esc(parts[1] || "") + "</b>" +
                      '<span class="lsp-tip__msg">' + esc(parts[0] || "") + "</span>" +
                      '<span class="lsp-tip__src">fake language server</span>';
      box.hidden = false;
      var r = target.getBoundingClientRect();
      var w = box.offsetWidth, h = box.offsetHeight;
      var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
      var top = r.bottom + 8;
      if (top + h > window.innerHeight - 8) top = r.top - h - 8;
      box.style.left = left + "px";
      box.style.top = Math.max(8, top) + "px";
    }

    function hideTip() {
      if (TIP) TIP.hidden = true;
    }

    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target.closest(".diag") : null;
      if (t) showTip(t); else hideTip();
    });
    document.addEventListener("scroll", hideTip, { passive: true });

    /* A diagnostic span sits above the textarea so it can receive hover.
       Clicks on it are forwarded back to the editor so the caret keeps working. */
    document.addEventListener("pointerdown", function (e) {
      var t = e.target.closest ? e.target.closest(".diag") : null;
      if (!t) return;
      var ed = t.closest(".cell__ed");
      var ta = ed && ed.querySelector(".cell__code");
      if (ta) ta.focus();
    });

    function buildEditor(ta) {
      var wrap = document.createElement("div");
      wrap.className = "cell__ed";
      var hl = document.createElement("pre");
      hl.className = "cell__hl";
      hl.setAttribute("aria-hidden", "true");
      ta.parentNode.insertBefore(wrap, ta);
      wrap.appendChild(hl);
      wrap.appendChild(ta);
      ta.setAttribute("wrap", "soft");
      ta.spellcheck = false;
      ta.addEventListener("scroll", function () { hl.scrollLeft = ta.scrollLeft; });
      return { wrap: wrap, hl: hl, ta: ta };
    }

    function paint(ed, diags) {
      var lines = ed.ta.value.split("\n");
      var marks = lines.map(function (line, li) {
        var arr = new Array(line.length);
        diags.forEach(function (d) {
          if (d.line !== li) return;
          for (var k = d.col; k < Math.min(d.col + d.len, line.length); k++) arr[k] = d;
        });
        return arr;
      });

      ed.hl.innerHTML = lines.map(function (line, li) {
        var arr = marks[li], html = "", i = 0, n = line.length;
        while (i < n) {
          var d = arr[i], j = i;
          while (j < n && arr[j] === d) j++;
          var chunk = tokenizeText(line.slice(i, j));
          html += d
            ? '<span class="diag diag--' + d.sev + '" tabindex="0" data-lsp="' +
              esc(d.msg) + "|" + esc(d.code) + '">' + chunk + "</span>"
            : chunk;
          i = j;
        }
        return html || " ";
      }).join("\n");
    }

    var eds = $$(".cell__code").map(function (ta) {
      var ed = buildEditor(ta);
      ed.cell = ta.closest(".cell");
      ed.original = ta.value;
      var rail = ed.cell.querySelector(".cell__rail");
      if (rail && !rail.querySelector(".cell__diag")) {
        var dot = document.createElement("span");
        dot.className = "cell__diag";
        dot.setAttribute("aria-hidden", "true");
        rail.appendChild(dot);
      }
      return ed;
    });

    var defined = {};

    function refresh(ed) {
      var diags = lintCell(ed.ta.value, defined);
      paint(ed, diags);
      ed.diags = diags;

      var worst = 0;
      diags.forEach(function (d) {
        var w = d.sev === "error" ? 3 : d.sev === "warning" ? 2 : 1;
        if (w > worst) worst = w;
      });
      var dot = ed.cell.querySelector(".cell__diag");
      if (dot) {
        dot.className = "cell__diag" + (worst ? " is-" + (worst === 3 ? "error" : worst === 2 ? "warning" : "info") : "");
        dot.title = diags.length ? diags.length + " problem" + (diags.length > 1 ? "s" : "") : "No problems";
      }
      return diags;
    }

    function refreshAll() {
      var total = { error: 0, warning: 0, info: 0, hint: 0 };
      defined = {};
      eds.forEach(function (ed) {
        refresh(ed);
        (ed.diags || []).forEach(function (d) { total[d.sev] += 1; });
        var add = definitionsIn(ed.ta.value);
        Object.keys(add).forEach(function (k) { defined[k] = 1; });
      });

      var pill = $("#lsp-status");
      if (pill) {
        var e = total.error, w = total.warning, h = total.info + total.hint;
        var cls = e ? "has-errors" : w ? "has-warnings" : h ? "has-hints" : "is-clean";
        var text = e ? e + " error" + (e > 1 ? "s" : "")
                 : w ? w + " warning" + (w > 1 ? "s" : "")
                 : h ? h + " hint" + (h > 1 ? "s" : "")
                 : "No problems";
        pill.className = "lsp-pill " + cls;
        pill.innerHTML =
          '<span class="lsp-pill__dot" aria-hidden="true"></span>' +
          "<span>" + text + "</span>" +
          '<span class="lsp-pill__meta">python 3.12</span>';
      }
      return total;
    }

    /* ------------------------------------------------------------- running */
    function replay(cell, delay) {
      var btn = cell.querySelector("[data-nb-run]");
      var out = cell.querySelector(".cell__out");
      if (!out) return;
      out.hidden = true;
      if (btn) btn.classList.add("is-running");
      setTimeout(function () {
        out.hidden = false;
        if (btn) btn.classList.remove("is-running");
      }, delay || 240);
    }

    eds.forEach(function (ed) {
      var ta = ed.ta;
      var grow = function () {
        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + "px";
        ed.hl.style.height = ta.style.height;
      };
      ed.grow = grow;
      grow();
      ta.addEventListener("input", function () { grow(); refreshAll(); });
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.shiftKey || e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          replay(ed.cell);
        }
      });
      window.addEventListener("resize", grow);
    });

    refreshAll();

    $$("[data-nb-run]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cell = btn.closest(".cell");
        if (cell) replay(cell);
      });
    });

    $$("[data-run-all]").forEach(function (btn) {
      var label = btn.querySelector("span");
      btn.addEventListener("click", function () {
        if (btn.classList.contains("is-running")) return;
        var cells = $$(".cell");
        if (!cells.length) return;
        btn.classList.add("is-running");
        if (label) label.textContent = "Running…";
        cells.forEach(function (cell, i) { replay(cell, 80 + i * 55); });
        setTimeout(function () {
          btn.classList.remove("is-running");
          if (label) label.textContent = "Run all";
        }, 100 + cells.length * 55);
      });
    });

    /* Reset — restores every cell to the record as it shipped. */
    $$("[data-reset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        eds.forEach(function (ed) {
          ed.ta.value = ed.original;
          ed.grow();
          var out = ed.cell.querySelector(".cell__out");
          if (out) out.hidden = true;
        });
        refreshAll();
        toast("Notebook reset to the saved record");
      });
    });
  })();

  /* ---------------------------------------------------------------------
     14. VIDEO — click-to-load facade, so YouTube is not contacted until the
     visitor actually asks for the video.
     --------------------------------------------------------------------- */
  (function () {
    $$('[data-video]').forEach(function (wrap) {
      var btn = wrap.querySelector('[data-video-play]');
      var id = wrap.getAttribute('data-video');
      if (!btn || !id) return;
      btn.addEventListener('click', function () {
        var frame = document.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
        frame.title = btn.getAttribute('aria-label') || 'Video';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
        frame.allowFullscreen = true;
        wrap.replaceChild(frame, btn);
      });
    });
  })();

  /* ---------------------------------------------------------------------
     15. COPY — any [data-copy] control copies its payload and confirms.
     --------------------------------------------------------------------- */
  (function () {
    $$('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var text = btn.getAttribute('data-copy');
        var label = btn.getAttribute('data-copy-label') || 'Command';
        if (!text) return;
        var done = function () {
          toast(label + ' copied');
          btn.classList.add('is-done');
          setTimeout(function () { btn.classList.remove('is-done'); }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { toast(label + ': ' + text); });
        } else {
          toast(label + ': ' + text);
        }
      });
    });
  })();

  /* ---------------------------------------------------------------------
     16. BOOT — prime the first frame so nothing sits mid-transition.
     --------------------------------------------------------------------- */
  window.addEventListener('load', function () {
    window.dispatchEvent(new Event('scroll'));
    document.documentElement.classList.add('is-loaded');
  });
})();
