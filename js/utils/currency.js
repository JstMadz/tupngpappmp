// Currency parsing/formatting helpers (Philippine peso display conventions).
window.PPMP = window.PPMP || {};

window.PPMP.currency = (function () {
  function formatCurrencyDisplay(num) {
    return Number(num || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseCurrency(str) {
    const cleaned = String(str || "").replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function formatCurrencyLive(e) {
    const el = e.target;
    const cleaned = el.value.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    let intPart = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
    let decPart =
      firstDot === -1 ? undefined : cleaned.slice(firstDot + 1, firstDot + 3);
    intPart = intPart.replace(/^0+(?=\d)/, "");
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    el.value = decPart !== undefined ? `${grouped}.${decPart}` : grouped;
  }

  return { formatCurrencyDisplay, parseCurrency, formatCurrencyLive };
})();
