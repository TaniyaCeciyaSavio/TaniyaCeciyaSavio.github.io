/* Pixel cursor: the pixel arrow from Taniya's deck, with a red pixel trail,
   a tilt + red outline over clickable things, and a pixel burst on click.
   Only for mouse/trackpad devices; touch devices keep their normal behaviour. */
(function () {
  "use strict";
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  var cur = document.createElement("div");
  cur.className = "pxcur";
  cur.setAttribute("aria-hidden", "true");
  cur.innerHTML = '<img src="assets/img/cursor.svg" alt="" draggable="false">';
  var layer = document.createElement("div");           // trail + bursts live here
  layer.className = "pxcur-fx";
  layer.setAttribute("aria-hidden", "true");

  var TRAIL = reduce ? 0 : 6, dots = [];
  for (var i = 0; i < TRAIL; i++) {
    var d = document.createElement("i");
    d.className = "pxdot";
    d.style.opacity = String(0.9 - i * 0.13);
    layer.appendChild(d);
    dots.push({ el: d, x: -100, y: -100 });
  }

  var x = -100, y = -100, shown = false;
  function host() {
    // Inside an open modal dialog (top layer) the cursor must live in the dialog to stay visible.
    var dlg = document.querySelector("dialog[open]");
    return dlg || document.body;
  }
  function mount() {
    var h = host();
    if (cur.parentNode !== h) { h.appendChild(layer); h.appendChild(cur); }
  }
  function enable(on) { root.classList.toggle("pxcur-on", on); }

  document.addEventListener("mousemove", function (e) {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; cur.style.opacity = "1"; layer.style.opacity = "1"; mount(); enable(true); }
    cur.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    var t = e.target;
    var hot = t && t.closest && t.closest("a, button, [role='button'], .jump, .lift, .vcard, video, summary, label");
    cur.classList.toggle("hot", !!hot);
  }, { passive: true });

  document.addEventListener("mouseleave", function () { shown = false; cur.style.opacity = "0"; layer.style.opacity = "0"; });
  document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) { shown = false; cur.style.opacity = "0"; layer.style.opacity = "0"; } });

  // Trail follows with a little lag, pixel-snapped.
  if (TRAIL) (function loop() {
    var px = x, py = y;
    dots.forEach(function (d, i) {
      d.x += (px - d.x) * 0.32;
      d.y += (py - d.y) * 0.32;
      d.el.style.transform = "translate3d(" + Math.round(d.x / 2) * 2 + "px," + Math.round(d.y / 2) * 2 + "px,0)";
      px = d.x; py = d.y;
    });
    requestAnimationFrame(loop);
  })();

  // Click: press + pixel burst.
  document.addEventListener("mousedown", function () {
    cur.classList.add("down");
    if (reduce) return;
    var colors = ["#E80000", "#FFCB05", "#E80000", "#ffffff"];
    for (var k = 0; k < 8; k++) {
      var p = document.createElement("i");
      p.className = "pxburst";
      var a = (Math.PI * 2 * k) / 8 + Math.random() * 0.4;
      var dist = 16 + Math.random() * 14;
      p.style.left = x + "px"; p.style.top = y + "px";
      p.style.background = colors[k % colors.length];
      p.style.setProperty("--bx", Math.round(Math.cos(a) * dist) + "px");
      p.style.setProperty("--by", Math.round(Math.sin(a) * dist) + "px");
      layer.appendChild(p);
      setTimeout(function (n) { return function () { n.parentNode && n.parentNode.removeChild(n); }; }(p), 520);
    }
  });
  document.addEventListener("mouseup", function () { cur.classList.remove("down"); });

  // Re-home the cursor when a dialog opens/closes; hand back the system cursor in fullscreen video.
  new MutationObserver(mount).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  function onFs() { var fs = document.fullscreenElement || document.webkitFullscreenElement; enable(!fs && shown); cur.style.display = fs ? "none" : ""; layer.style.display = fs ? "none" : ""; }
  document.addEventListener("fullscreenchange", onFs);
  document.addEventListener("webkitfullscreenchange", onFs);

  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
