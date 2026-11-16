// Theme toggle and footer year, shared by every page.
(function () {
  var root = document.documentElement;
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  var btn = document.getElementById("theme-btn");
  if (!btn) return;
  function current() {
    if (root.dataset.theme) return root.dataset.theme;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function paint() {
    var next = current() === "dark" ? "light" : "dark";
    btn.textContent = next === "dark" ? "Dark" : "Light";
    btn.setAttribute("aria-label", "Switch to " + next + " theme");
  }
  btn.addEventListener("click", function () {
    root.dataset.theme = current() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    paint();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paint);
  paint();
})();
