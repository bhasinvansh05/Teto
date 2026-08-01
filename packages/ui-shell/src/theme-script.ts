/**
 * Tiny progressive-enhancement script for SSR demos / static HTML.
 * Toggles `data-theme` on `.teto-shell` and persists to localStorage.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function () {
  var root = document.querySelector(".teto-shell");
  if (!root) return;
  var key = "teto-theme";
  function apply(theme) {
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-color-scheme", theme);
    try { localStorage.setItem(key, theme); } catch (e) {}
    document.documentElement.style.colorScheme = theme;
    document.querySelectorAll(".teto-theme-toggle__btn").forEach(function (btn) {
      var selected = btn.getAttribute("data-theme") === theme;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-checked", selected ? "true" : "false");
    });
    var group = document.querySelector(".teto-theme-toggle");
    if (group) group.setAttribute("data-active-theme", theme);
  }
  var stored = null;
  try { stored = localStorage.getItem(key); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var initial = stored === "light" || stored === "dark"
    ? stored
    : (prefersDark ? "dark" : (root.getAttribute("data-theme") || "light"));
  apply(initial);
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var btn = target.closest("[data-action='set-theme']");
    if (!btn) return;
    var theme = btn.getAttribute("data-theme");
    if (theme === "light" || theme === "dark") apply(theme);
  });
})();`;
