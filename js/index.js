/* ============================================================
   DS Lab — home page: experiment cards + module preview
   ============================================================ */
(function () {
  "use strict";

  var D = window.DSLAB_DATA || {};
  var icon = window.DSLAB_ICON;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function expCard(lab) {
    var parts = lab.parts.map(function (p) {
      return '<a class="partbtn" href="lab.html?exp=' + lab.id + "&amp;part=" + p.id + '" ' +
        'title="' + esc(p.title) + '" aria-label="' + esc(lab.code + " part " + p.label + " — " + p.title) + '">' + esc(p.label) + "</a>";
    }).join("");
    var tags = lab.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    return '<article class="expcard">' +
      '<div class="expcard__top">' +
      '<span class="expcode">' + lab.code + "</span>" +
      '<span class="expcard__theta">' + lab.id + "</span>" +
      "</div>" +
      '<h3 class="expcard__title"><a href="lab.html?exp=' + lab.id + '" style="color:inherit">' + esc(lab.title) + "</a></h3>" +
      '<p class="expcard__summary">' + esc(lab.summary) + "</p>" +
      '<div class="expcard__tags">' + tags + "</div>" +
      '<div class="expcard__parts">' + parts +
      '<span class="expcard__partlabel">' + lab.parts.length + " part" + (lab.parts.length > 1 ? "s" : "") + "</span>" +
      "</div></article>";
  }

  function modCard(m) {
    var items = m.topics.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    return '<article class="modcard" id="module-' + m.id + '">' +
      '<span class="modcard__num">' + m.id + "</span>" +
      '<h3 class="modcard__title">' + esc(m.title) + "</h3>" +
      '<ul class="modcard__list">' + items + "</ul>" +
      '<div class="modcard__foot">' +
      '<a class="pdfbtn" href="assets/pdf/module-' + m.id + '.pdf" target="_blank" rel="noopener">Syllabus PDF</a>' +
      '<span class="modcard__lab">' + esc("EXP-" + m.lab) + "</span>" +
      "</div></article>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var eg = document.getElementById("exp-grid");
    if (eg) eg.innerHTML = (D.labs || []).map(expCard).join("");

    var mg = document.getElementById("mod-grid");
    if (mg) mg.innerHTML = (D.modules || []).map(modCard).join("");

    var sg = document.getElementById("stat-labs");
    if (sg) sg.textContent = (D.meta && D.meta.stats.labs) || "";
    var sp = document.getElementById("stat-parts");
    if (sp) sp.textContent = (D.meta && D.meta.stats.parts) || "";
    var sc = document.getElementById("stat-charts");
    if (sc) sc.textContent = (D.meta && D.meta.stats.charts) || "";
  });
})();
