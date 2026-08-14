// Generates the human-readable transaction ID stamped on generated documents.
window.PPMP = window.PPMP || {};

window.PPMP.transactionId = (function () {
  const { getInitials } = window.PPMP.text;

  // Format: TUPM-AAA(Office Code)-BBB(Type of Transaction)-CCC(Initial of employee)
  // -MMDDYYYY(month day year)-HHMMAM/PM(hour:minutes AM/PM)
  function generate() {
    const officeVal = document.getElementById("office").value;
    const officeCode = getInitials(officeVal) || "NA";
    const employeeVal = document.getElementById("unit").value;
    const employeeCode = getInitials(employeeVal) || "NA";
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yyyy = now.getFullYear();
    let hours = now.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const hh = String(hours).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `TUPM-${officeCode}-PPMP-${employeeCode}-${mm}${dd}${yyyy}-${hh}${min}${ampm}`;
  }

  return { generate };
})();
