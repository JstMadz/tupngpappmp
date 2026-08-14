// Lightweight toast notifications (info / success / error).
window.PPMP = window.PPMP || {};

window.PPMP.toast = (function () {
  function show(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  return { show };
})();
