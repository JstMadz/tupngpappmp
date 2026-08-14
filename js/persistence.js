// Autosaves the plan header + project list to localStorage (debounced on
// every input/change, and once more on tab close) and restores it on load.
// Also owns "Clear Saved Data", since that's the inverse operation.
window.PPMP = window.PPMP || {};

window.PPMP.persistence = (function () {
  const { STORAGE_KEY, HEADER_FIELD_IDS, nextYear } = window.PPMP.config;
  const { projects } = window.PPMP.state;

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function isToggleInput(el) {
    return el.type === "checkbox" || el.type === "radio";
  }

  function getHeaderState() {
    const state = {};
    HEADER_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      state[id] = isToggleInput(el) ? el.checked : el.value;
    });
    return state;
  }

  function applyHeaderState(state) {
    if (!state) return;
    HEADER_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!(id in state)) return;
      if (isToggleInput(el)) el.checked = !!state[id];
      else el.value = state[id];
    });
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ header: getHeaderState(), projects }),
      );
    } catch (e) {
      console.warn("Unable to save PPMP data locally.", e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      applyHeaderState(parsed.header);
      if (Array.isArray(parsed.projects)) {
        projects.length = 0;
        projects.push(...parsed.projects);
      }
    } catch (e) {
      console.warn("Unable to load saved PPMP data.", e);
    }
  }

  function initAutosave() {
    const debouncedSave = debounce(saveState, 400);
    HEADER_FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener("input", debouncedSave);
      el.addEventListener("change", debouncedSave);
    });
    window.addEventListener("beforeunload", saveState);
  }

  function initClearDataButton() {
    document.getElementById("clearData").addEventListener("click", async () => {
      const { showConfirm } = window.PPMP.confirmModal;
      const { show: showToast } = window.PPMP.toast;
      const { setFieldError } = window.PPMP.validation;
      const { resetProjectForm, renderTable } = window.PPMP.projectsTable;

      const confirmed = await showConfirm(
        "This will permanently delete all saved PPMP data from this browser. Continue?",
      );
      if (!confirmed) return;

      localStorage.removeItem(STORAGE_KEY);
      projects.length = 0;
      resetProjectForm();
      HEADER_FIELD_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (isToggleInput(el)) el.checked = false;
        else el.value = "";
        setFieldError(id, "");
      });
      document.getElementById("fiscalYear").value = nextYear;
      renderTable();
      showToast("Saved data cleared.", "info");
    });
  }

  return { saveState, loadState, initAutosave, initClearDataButton };
})();
