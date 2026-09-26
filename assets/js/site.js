/* Mobile menu toggle */
(function () {
  var btn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();


/* Alumni page: search by name or affiliation, 10 per page with numbered pages */
(function () {
  var list = document.getElementById("alumni-list");
  if (!list) return;
  var PER = 10;
  var items = Array.prototype.slice.call(list.querySelectorAll(".alum"));
  var input = document.getElementById("alumni-search");
  var pager = document.getElementById("pager");
  var none = document.getElementById("no-match");
  var matches = items, page = 1;
  function text(li) {
    var h = li.querySelector("h3"), a = li.querySelector(".aff");
    return ((h ? h.textContent : "") + " " + (a ? a.textContent : "")).toLowerCase();
  }
  function render() {
    var pages = Math.max(1, Math.ceil(matches.length / PER));
    if (page > pages) page = pages;
    items.forEach(function (li) { li.hidden = true; });
    matches.slice((page - 1) * PER, page * PER).forEach(function (li) { li.hidden = false; });
    none.hidden = matches.length !== 0;
    pager.innerHTML = "";
    if (pages < 2) return;
    for (var i = 1; i <= pages; i++) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = i;
      b.setAttribute("aria-label", "Page " + i);
      if (i === page) b.setAttribute("aria-current", "page");
      b.addEventListener("click", (function (n) { return function () {
        page = n; render();
        list.scrollIntoView({ behavior: "smooth", block: "start" });
      }; })(i));
      pager.appendChild(b);
    }
  }
  input.addEventListener("input", function () {
    var q = input.value.trim().toLowerCase();
    matches = q ? items.filter(function (li) { return text(li).indexOf(q) !== -1; }) : items;
    page = 1; render();
  });
  render();
})();


/* ↑ ↑ ↓ ↓ ← → ← → B A : a diffraction pattern blooms from the centre, then fades. */
(function () {
  var code = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"], pos = 0;
  document.addEventListener("keydown", function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) { pos = 0; show(); }
  });
  function show() {
    if (document.getElementById("dp")) return;
    var c = document.createElement("canvas"), x = c.getContext("2d"), dpr = window.devicePixelRatio || 1;
    var W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2, a = Math.min(W, H) / 11, t0 = performance.now();
    var still = matchMedia("(prefers-reduced-motion: reduce)").matches, spots = [];
    c.id = "dp"; c.width = W * dpr; c.height = H * dpr;
    c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:99;cursor:pointer;transition:opacity .8s";
    x.scale(dpr, dpr);
    // hexagonal reciprocal lattice, like a [111] zone axis pattern
    for (var i = -24; i <= 24; i++) for (var j = -16; j <= 16; j++) {
      var px = a * (i + j / 2), py = a * j * Math.sqrt(3) / 2, r = Math.hypot(px, py);
      if (r < Math.hypot(W, H) / 2) spots.push([px, py, r]);
    }
    function frame(now) {
      var t = still ? 9 : (now - t0) / 1000, reach = t * a * 5;
      x.fillStyle = "rgba(0,12,40,.94)"; x.fillRect(0, 0, W, H);
      spots.forEach(function (s) {
        if (s[2] > reach) return;
        var I = s[2] ? Math.exp(-s[2] / (a * 3.2)) : 1, R = s[2] ? 3 + 5 * I : 14;
        var g = x.createRadialGradient(cx + s[0], cy + s[1], 0, cx + s[0], cy + s[1], R * 2.2);
        g.addColorStop(0, "rgba(255,255,255," + Math.min(1, .35 + I) + ")");
        g.addColorStop(.35, "rgba(253,181,21," + (.25 + .6 * I) + ")");
        g.addColorStop(1, "rgba(253,181,21,0)");
        x.fillStyle = g; x.beginPath(); x.arc(cx + s[0], cy + s[1], R * 2.2, 0, 7); x.fill();
      });
      x.fillStyle = "rgba(201,212,238,.8)"; x.font = "12px 'JetBrains Mono', monospace"; x.textAlign = "center";
      x.fillText("[111] zone axis · you found it", cx, H - 28);
      if (!still && reach < Math.hypot(W, H)) requestAnimationFrame(frame);
    }
    function close() { c.style.opacity = 0; setTimeout(function () { c.remove(); }, 800); }
    document.body.appendChild(c); requestAnimationFrame(frame);
    c.addEventListener("click", close); setTimeout(close, 4500);
  }
})();
