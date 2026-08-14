// Date parsing helper shared by validation, date pickers, and CSV/TSV import.
window.PPMP = window.PPMP || {};

window.PPMP.dates = (function () {
  function parseFullDate(str) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
      String(str || "").trim(),
    );
    if (!match) return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  return { parseFullDate };
})();
