// Plain string/text helpers used across the app (HTML escaping, initials,
// live-uppercase input formatting). No dependencies on other PPMP modules.
window.PPMP = window.PPMP || {};

window.PPMP.text = (function () {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function getInitials(str) {
    return String(str || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  function uppercaseLive(e) {
    const el = e.target;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.toUpperCase();
    if (start !== null && end !== null) el.setSelectionRange(start, end);
  }

  return { escapeHtml, getInitials, uppercaseLive };
})();
