// Custom confirm dialog that replaces window.confirm() so styling and
// keyboard/focus handling stay consistent with the rest of the app.
// showConfirm(message) returns a Promise<boolean>, same calling convention
// as window.confirm would have.
window.PPMP = window.PPMP || {};

window.PPMP.confirmModal = (function () {
  let confirmModal, confirmModalMessage, confirmModalOk, confirmModalCancel;
  let confirmModalResolve = null;
  let confirmModalTrigger = null;

  function closeConfirmModal(result) {
    confirmModal.hidden = true;
    document.removeEventListener("keydown", handleConfirmModalKeydown);
    if (confirmModalTrigger) confirmModalTrigger.focus();
    if (confirmModalResolve) {
      confirmModalResolve(result);
      confirmModalResolve = null;
    }
  }

  function handleConfirmModalKeydown(e) {
    if (e.key === "Escape") closeConfirmModal(false);
  }

  function showConfirm(message) {
    confirmModalMessage.textContent = message;
    confirmModalTrigger = document.activeElement;
    confirmModal.hidden = false;
    confirmModalOk.focus();
    document.addEventListener("keydown", handleConfirmModalKeydown);
    return new Promise((resolve) => {
      confirmModalResolve = resolve;
    });
  }

  function init() {
    confirmModal = document.getElementById("confirmModal");
    confirmModalMessage = document.getElementById("confirmModalMessage");
    confirmModalOk = document.getElementById("confirmModalOk");
    confirmModalCancel = document.getElementById("confirmModalCancel");

    confirmModalOk.addEventListener("click", () => closeConfirmModal(true));
    confirmModalCancel.addEventListener("click", () => closeConfirmModal(false));
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) closeConfirmModal(false);
    });
  }

  return { init, showConfirm };
})();
