// Light/Dark/System theme switcher. The actual "no flash of wrong theme on
// load" work happens in an inline script at the top of index.html's <head>
// (it has to run before this file — and every other CSS/JS — even loads);
// this module's job is just to wire up the header toggle and keep the
// applied theme in sync with the OS when the preference is "system".
window.PPMP = window.PPMP || {};

window.PPMP.theme = (function () {
  const MEDIA_DARK = window.matchMedia("(prefers-color-scheme: dark)");

  function getPreference() {
    const { THEME_STORAGE_KEY } = window.PPMP.config;
    return localStorage.getItem(THEME_STORAGE_KEY) || "system";
  }

  function resolve(preference) {
    if (preference === "dark") return "dark";
    if (preference === "light") return "light";
    return MEDIA_DARK.matches ? "dark" : "light";
  }

  function syncToggleUI(preference) {
    document.querySelectorAll(".theme-option").forEach((btn) => {
      btn.setAttribute(
        "aria-pressed",
        String(btn.dataset.themeChoice === preference),
      );
    });
  }

  function apply(preference) {
    document.documentElement.setAttribute("data-theme", resolve(preference));
    syncToggleUI(preference);
  }

  function setPreference(preference) {
    const { THEME_STORAGE_KEY } = window.PPMP.config;
    localStorage.setItem(THEME_STORAGE_KEY, preference);
    apply(preference);
  }

  function init() {
    apply(getPreference());

    document.querySelectorAll(".theme-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        setPreference(btn.dataset.themeChoice);
      });
    });

    // Live-update if the OS theme changes while the page is open and the
    // user's preference is "system" (not locked to light or dark).
    MEDIA_DARK.addEventListener("change", () => {
      if (getPreference() === "system") apply("system");
    });
  }

  return { init };
})();
