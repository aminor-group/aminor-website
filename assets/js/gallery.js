/* Justified rows: fill each row edge to edge at a shared height.
   CSS flex rows are the fallback; this only fixes widths so rows (and a nearly full last row) line up. */
(function () {
  var rows = document.querySelectorAll(".g-row");
  if (!rows.length) return;
  function layout() {
    var narrow = window.innerWidth <= 860, T = narrow ? 150 : 240, GAP = narrow ? 6 : 10;
    rows.forEach(function (row) {
      var W = row.clientWidth, figs = Array.prototype.slice.call(row.children), line = [], sum = 0;
      function place(items, h) {
        items.forEach(function (f) {
          var r = parseFloat(f.style.getPropertyValue("--r"));
          f.style.flex = "none"; f.style.width = (r * h).toFixed(2) + "px"; f.style.height = h.toFixed(2) + "px";
        });
      }
      figs.forEach(function (f, i) {
        line.push(f); sum += parseFloat(f.style.getPropertyValue("--r"));
        var gaps = GAP * (line.length - 1);
        if (sum * T + gaps >= W) { place(line, Math.floor(((W - gaps) / sum) * 100) / 100); line = []; sum = 0; }
      });
      if (line.length) {
        var gaps = GAP * (line.length - 1), full = (W - gaps) / sum;
        place(line, sum * T + gaps >= W * 0.55 ? Math.min(full, T * 1.3) : T);
      }
    });
  }
  layout();
  var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(layout, 120); });
})();

/* Gallery lightbox: click a photo to view it large; arrows/keys to move, Esc or backdrop to close. */
(function () {
  var dlg = document.getElementById("lightbox");
  if (!dlg || typeof dlg.showModal !== "function") return;
  var links = Array.prototype.slice.call(document.querySelectorAll(".ph a[data-i]"));
  var img = dlg.querySelector("img"), cap = dlg.querySelector("figcaption"), cur = 0;
  function show(i) {
    cur = (i + links.length) % links.length;
    var a = links[cur], fc = a.parentNode.querySelector("figcaption");
    img.src = a.getAttribute("href");
    img.alt = a.querySelector("img").alt;
    cap.innerHTML = (fc ? fc.innerHTML : "") + '<span class="n">' + (cur + 1) + " / " + links.length + "</span>";
    // warm the next image
    var nx = links[(cur + 1) % links.length]; (new Image()).src = nx.getAttribute("href");
  }
  links.forEach(function (a, i) {
    a.addEventListener("click", function (e) { e.preventDefault(); show(i); dlg.showModal(); });
  });
  dlg.querySelector(".lb-prev").addEventListener("click", function () { show(cur - 1); });
  dlg.querySelector(".lb-next").addEventListener("click", function () { show(cur + 1); });
  dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.tagName === "FIGURE") dlg.close(); });
  dlg.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  // swipe on phones
  var x0 = null;
  dlg.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener("touchend", function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
  });
})();
