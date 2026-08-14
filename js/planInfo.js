// Reads the Indicative/Final plan-type radio selection.
window.PPMP = window.PPMP || {};

window.PPMP.planInfo = (function () {
  function getPlanTypeLabel() {
    if (document.getElementById("final").checked) return "Final";
    if (document.getElementById("indicative").checked) return "Indicative";
    return "";
  }

  return { getPlanTypeLabel };
})();
