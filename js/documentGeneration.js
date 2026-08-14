// Shared pre-flight step for both "Save as PDF" and "Print": validates the
// plan header, requires at least one project, and refreshes the on-page
// signature-block preview. Both generators call this before doing their own
// (very different) document-building work.
window.PPMP = window.PPMP || {};

window.PPMP.documentGeneration = (function () {
  const { projects } = window.PPMP.state;

  function prepareDocumentGeneration() {
    const { validateHeaderForm } = window.PPMP.validation;
    const { show: showToast } = window.PPMP.toast;

    const { valid, firstInvalid } = validateHeaderForm();
    if (!valid) {
      showToast(
        "Please complete the required plan information before printing.",
        "error",
      );
      if (firstInvalid) document.getElementById(firstInvalid).focus();
      return false;
    }
    if (projects.length === 0) {
      showToast("Add at least one project before printing.", "error");
      return false;
    }

    document.getElementById("endUserName").textContent =
      document.getElementById("unit").value || "(End-User / Implementing Unit)";
    document.getElementById("endUserDesignation").textContent =
      document.getElementById("unitDesignation").value || "";
    document.getElementById("headUnitName").textContent =
      document.getElementById("headUnit").value ||
      "(Head of Implementing Unit / Sector)";
    document.getElementById("headUnitDesignation").textContent =
      document.getElementById("headDesignation").value || "";

    document.getElementById("footerDate").textContent =
      `Printed on: ${new Date().toLocaleString("en-PH", {
        dateStyle: "long",
        timeStyle: "short",
      })}`;

    return true;
  }

  return { prepareDocumentGeneration };
})();
