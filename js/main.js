// Entry point: wires up every feature module once the DOM is ready, then
// restores any autosaved plan and renders the initial table.
//
// Adding a new feature? Write it as its own js/<name>.js module that hangs
// its public functions off window.PPMP.<name>, then call its init() here.
document.addEventListener("DOMContentLoaded", () => {
  const {
    config,
    theme,
    datepicker,
    formOptions,
    confirmModal,
    validation,
    persistence,
    projectsTable,
    importExport,
    pdfExport,
    printDocument,
    visitorCounter,
  } = window.PPMP;

  theme.init();
  datepicker.init();
  formOptions.init();
  confirmModal.init();
  validation.init();
  persistence.initAutosave();
  projectsTable.init();
  persistence.initClearDataButton();
  importExport.init();
  pdfExport.init();
  printDocument.init();

  persistence.loadState();
  if (!document.getElementById("fiscalYear").value) {
    document.getElementById("fiscalYear").value = config.nextYear;
  }
  projectsTable.renderTable();
  visitorCounter.init();
});
