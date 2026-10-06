/* ============================================================
   DS Lab — tools page: grouped tool cards
   ============================================================ */
(function () {
  "use strict";

  var D = window.DSLAB_DATA || {};
  var icon = window.DSLAB_ICON;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  var GROUP_IDS = {
    "Environments": "tools-env",
    "Editors": "tools-editors",
    "Libraries": "tools-libraries",
    "Data & versioning": "tools-data",
    "Data &amp; versioning": "tools-data",
  };

  function toolCard(t) {
    return '<a class="toolcard" id="tool-' + t.id + '" href="' + t.url + '" target="_blank" rel="noopener">' +
      '<div class="toolcard__top">' +
      '<span class="toolcard__icon">' + icon(t.icon) + "</span>" +
      '<span class="toolcard__name">' + esc(t.name) + "</span>" +
      "</div>" +
      '<p class="toolcard__desc">' + esc(t.desc) + "</p>" +
      '<span class="toolcard__go">Official site ' + icon("arrow") + "</span>" +
      "</a>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    (D.tools || []).forEach(function (t) {
      var host = document.getElementById(GROUP_IDS[t.group] || "");
      if (host) host.insertAdjacentHTML("beforeend", toolCard(t));
    });

    // deep links: scroll to a tool card (hash change handled natively for id refs)
    if (location.hash) {
      var el = document.querySelector(location.hash);
      if (el && el.scrollIntoView) {
        setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
      }
    }
  });
})();
