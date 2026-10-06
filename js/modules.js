/* ============================================================
   DS Lab — modules page: PDF viewer + module cards
   ============================================================ */
(function () {
  "use strict";

  var D = window.DSLAB_DATA || {};

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function modCard(m) {
    var items = m.topics.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    return '<article class="modcard" id="module-' + m.id + '">' +
      '<span class="modcard__num">' + m.id + "</span>" +
      '<h3 class="modcard__title">' + esc(m.title) + "</h3>" +
      '<ul class="modcard__list">' + items + "</ul>" +
      '<div class="modcard__foot">' +
      '<button class="pdfbtn" data-view="assets/pdf/module-' + m.id + '.pdf">View PDF</button>' +
      '<a class="pdfbtn" style="background:var(--surface);color:var(--ink-2);border-color:var(--line-strong)" href="lab.html?exp=' + m.lab + '">Open lab</a>' +
      "</div></article>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mg = document.getElementById("mod-grid");
    if (mg) mg.innerHTML = (D.modules || []).map(modCard).join("");

    // PDF viewer wiring: file cards + module "View PDF" buttons
    var frame = document.getElementById("pdf-frame");
    function view(src, btn) {
      if (frame) frame.src = src;
      document.querySelectorAll(".filecard").forEach(function (c) {
        c.classList.toggle("filecard--on", c.getAttribute("data-src") === src);
      });
      if (btn) {
        var card = btn.closest(".modcard");
        var fc = document.querySelector('.filecard[data-src="' + src + '"]');
        document.querySelectorAll(".filecard").forEach(function (c) {
          c.classList.toggle("filecard--on", c === fc);
        });
      }
      var panel = document.querySelector(".pdfhero");
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    document.querySelectorAll(".filecard").forEach(function (c) {
      c.addEventListener("click", function () { view(c.getAttribute("data-src")); });
    });
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-view]");
      if (b) view(b.getAttribute("data-view"), b);
    });
  });
})();
