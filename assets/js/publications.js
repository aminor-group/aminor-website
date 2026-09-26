/* Publications page: "Journal articles" / "All" toggle, year menu, search, 20 per page.
   Data comes from data/publications.yaml, which Hugo writes into window.PUBS
   as a list of {title, authors, venue, year, type, doi, scholar}. */
(function () {
  var list = document.getElementById("pub-list");
  if (!list || !window.PUBS) return;
  var PER = 20;
  var SCHOLAR = "https://scholar.google.com/citations?view_op=view_citation&hl=en&user=YsKTazIAAAAJ&citation_for_view=";
  var input = document.getElementById("pub-search");
  var pager = document.getElementById("pub-pager");
  var none = document.getElementById("pub-none");
  var kindBtns = document.querySelectorAll("[data-kind]");
  var yearSel = document.getElementById("pub-year");
  var kind = "article", q = "", yr = "", page = 1;
  var ME = /\b(A\.?\s?M\.?\s?Minor|A\.?\s?Minor|Andrew M\.? Minor|Andrew Minor)\b/i;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function venueText(v, y) { return y ? v.replace(new RegExp(",?\\s*" + y + "\\s*$"), "") : v; }
  function item(p) {
    var t = p.title, au = p.authors || "", v = p.venue || "", y = p.year || "", doi = p.doi, sid = p.scholar;
    var href = doi ? "https://doi.org/" + doi : (sid ? SCHOLAR + sid : "");
    var authors = esc(au).replace(ME, function (m) { return "<b>" + m + "</b>"; });
    var ven = venueText(v, y);
    var title = href
      ? '<a class="pub-title" href="' + href + '" target="_blank" rel="noopener">' + esc(t) + '<span class="ext" aria-hidden="true">&nbsp;&nearr;</span></a>'
      : '<span class="pub-title">' + esc(t) + "</span>";
    return '<li class="pub">' + title +
      (authors ? '<span class="pub-authors">' + authors + "</span>" : "") +
      '<span class="pub-venue">' + (ven ? "<i>" + esc(ven) + "</i>" : "") + (ven && y ? " · " : "") + (y || "") + "</span></li>";
  }
  function matches() {
    return window.PUBS.filter(function (p) {
      if (kind === "article" && p.type !== "article") return false;
      if (yr && String(p.year) !== yr) return false;
      if (!q) return true;
      return (p.title + " " + (p.authors || "") + " " + (p.venue || "") + " " + (p.year || "")).toLowerCase().indexOf(q) !== -1;
    });
  }
  function pageButtons(pages) {
    var out = [], lo = Math.max(2, page - 1), hi = Math.min(pages - 1, page + 1);
    out.push(1);
    if (lo > 2) out.push("…");
    for (var i = lo; i <= hi; i++) out.push(i);
    if (hi < pages - 1) out.push("…");
    if (pages > 1) out.push(pages);
    return out;
  }
  function render(scroll) {
    var m = matches(), pages = Math.max(1, Math.ceil(m.length / PER));
    if (page > pages) page = pages;
    var slice = m.slice((page - 1) * PER, page * PER), html = "", year = null;
    slice.forEach(function (p) {
      var y = p.year || "Undated";
      if (y !== year) { if (year !== null) html += "</ul>"; html += '<h3 class="pub-year">' + y + '</h3><ul class="pubs">'; year = y; }
      html += item(p);
    });
    if (year !== null) html += "</ul>";
    list.innerHTML = html;
    none.hidden = m.length !== 0;
    pager.innerHTML = "";
    if (pages > 1) {
      pageButtons(pages).forEach(function (n) {
        if (n === "…") { var s = document.createElement("span"); s.className = "gap"; s.textContent = "…"; pager.appendChild(s); return; }
        var b = document.createElement("button");
        b.type = "button"; b.textContent = n; b.setAttribute("aria-label", "Page " + n);
        if (n === page) b.setAttribute("aria-current", "page");
        b.addEventListener("click", function () { page = n; render(true); });
        pager.appendChild(b);
      });
    }
    if (scroll) document.getElementById("pub-tools").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Year menu lists only the years that have entries for the current toggle, newest first.
  function fillYears() {
    var seen = {}, years = [];
    window.PUBS.forEach(function (p) {
      if (kind === "article" && p.type !== "article") return;
      var y = String(p.year || "");
      if (y && !seen[y]) { seen[y] = 0; years.push(y); }
      if (y) seen[y]++;
    });
    years.sort(function (a, b) { return b - a; });
    if (yr && !(yr in seen)) yr = "";
    yearSel.innerHTML = '<option value="">All years</option>' + years.map(function (y) {
      return '<option value="' + y + '"' + (y === yr ? " selected" : "") + ">" + y + "</option>";
    }).join("");
  }
  yearSel.addEventListener("change", function () { yr = yearSel.value; page = 1; render(false); });
  kindBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      kind = b.getAttribute("data-kind"); page = 1;
      kindBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      fillYears(); render(false);
    });
  });
  input.addEventListener("input", function () { q = input.value.trim().toLowerCase(); page = 1; render(false); });
  fillYears();
  render(false);
})();
