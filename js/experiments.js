/* ============================================================
   DS Lab — experiments page: full lab index
   ============================================================ */
(function () {
  "use strict";

  var D = window.DSLAB_DATA || {};
  var icon = window.DSLAB_ICON;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function expBlock(lab) {
    var parts = lab.parts.map(function (p) {
      return '<a class="partrow" href="lab.html?exp=' + lab.id + '&amp;part=' + p.id + '">' +
        '<span class="partrow__badge">' + esc(p.label) + "</span>" +
        '<span class="partrow__body">' +
        '<span class="partrow__title">' + esc(p.title) + "</span>" +
        '<span class="partrow__meta">' + p.cells.length + " cell" + (p.cells.length > 1 ? "s" : "") + " · notebook</span>" +
        "</span>" +
        icon("arrow", "partrow__arrow") +
        "</a>";
    }).join("");
    var tags = lab.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("");
    return '<article class="expblock" id="exp-' + lab.id + '">' +
      '<div class="expblock__head">' +
      '<span class="expblock__num">' + lab.id + "</span>" +
      "<div>" +
      '<h2 class="expblock__title">' + esc(lab.code + " — " + lab.title) + "</h2>" +
      '<p class="expblock__summary">' + esc(lab.summary) + "</p>" +
      '<div class="expblock__tags">' + tags + "</div>" +
      "</div></div>" +
      '<div class="parts">' + parts + "</div>" +
      "</article>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var el = document.getElementById("exp-blocks");
    if (el) el.innerHTML = (D.labs || []).map(expBlock).join("");
  });
})();
