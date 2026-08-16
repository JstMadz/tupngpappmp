// Renders the procurement projects table and handles add / edit / delete for
// individual rows. This is the module most other features (import, PDF
// export, print) read `projects` through indirectly via js/state.js, but
// come here for resetProjectForm()/renderTable() after they change the list.
window.PPMP = window.PPMP || {};

window.PPMP.projectsTable = (function () {
  const { projects, getEditIndex, setEditIndex } = window.PPMP.state;
  const { escapeHtml } = window.PPMP.text;
  const { formatCurrencyDisplay } = window.PPMP.currency;

  // Inline SVG icons (Feather-style line icons, stroke=currentColor) for
  // the row/form action buttons this module renders as HTML strings.
  const ICON_ATTRS =
    'class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const ICON_PLUS = `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
  const ICON_SAVE = `<svg ${ICON_ATTRS}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`;
  const ICON_EDIT = `<svg ${ICON_ATTRS}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
  const ICON_TRASH = `<svg ${ICON_ATTRS}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

  let tableBody, totalBudgetEl, addBtn;

  function renderTable() {
    tableBody.innerHTML = "";

    if (projects.length === 0) {
      const row = document.createElement("tr");
      row.className = "empty-row";
      row.innerHTML = `<td colspan="14">No procurement projects added yet.</td>`;
      tableBody.appendChild(row);
      totalBudgetEl.textContent = formatCurrencyDisplay(0);
      return;
    }

    let total = 0;
    projects.forEach((p, i) => {
      total += p.budget;
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${i + 1}</td>
          <td>${escapeHtml(p.description)}</td>
          <td>${escapeHtml(p.type)}</td>
          <td>${escapeHtml(p.quantity)}</td>
          <td>${escapeHtml(p.mode)}</td>
          <td>${escapeHtml(p.preProc)}</td>
          <td>${escapeHtml(p.start)}</td>
          <td>${escapeHtml(p.end)}</td>
          <td>${escapeHtml(p.implementation)}</td>
          <td>${escapeHtml(p.source)}</td>
          <td class="budget-cell">${formatCurrencyDisplay(p.budget)}</td>
          <td>${escapeHtml(p.docs)}</td>
          <td>${escapeHtml(p.remarks)}</td>
          <td>
            <div class="row-actions">
              <button type="button" class="edit-btn" data-index="${i}">${ICON_EDIT} Edit</button>
              <button type="button" class="delete-btn" data-index="${i}">${ICON_TRASH} Delete</button>
            </div>
          </td>`;
      tableBody.appendChild(row);
    });
    totalBudgetEl.textContent = formatCurrencyDisplay(total);
  }

  function resetProjectForm() {
    const { setSelectedDocs } = window.PPMP.formOptions;
    setEditIndex(null);
    addBtn.innerHTML = `${ICON_PLUS} Add Project`;
    document.getElementById("projectForm").reset();
    setSelectedDocs("");
  }

  function editProject(index) {
    const { syncDatePicker } = window.PPMP.datepicker;
    const { setSelectedDocs } = window.PPMP.formOptions;
    const { formatCurrencyDisplay } = window.PPMP.currency;

    const p = projects[index];
    if (!p) return;
    document.getElementById("description").value = p.description;
    document.getElementById("type").value = p.type;
    document.getElementById("quantity").value = p.quantity;
    document.getElementById("mode").value = p.mode;
    document.getElementById("preProc").value = p.preProc;
    document.getElementById("startDate").value = p.start;
    document.getElementById("endDate").value = p.end;
    document.getElementById("implementation").value = p.implementation;
    syncDatePicker("startDate", p.start);
    syncDatePicker("endDate", p.end);
    syncDatePicker("implementation", p.implementation);
    document.getElementById("source").value = p.source;
    document.getElementById("budget").value = formatCurrencyDisplay(p.budget);
    setSelectedDocs(p.docs);
    document.getElementById("remarks").value = p.remarks;

    setEditIndex(index);
    addBtn.innerHTML = `${ICON_SAVE} Update Project`;
    document.getElementById("description").focus();
  }

  async function deleteProject(index) {
    const { showConfirm } = window.PPMP.confirmModal;
    const { show: showToast } = window.PPMP.toast;
    const { saveState } = window.PPMP.persistence;

    const confirmed = await showConfirm(
      "Are you sure you want to delete this project?",
    );
    if (!confirmed) return;

    projects.splice(index, 1);
    if (getEditIndex() === index) resetProjectForm();
    renderTable();
    saveState();
    showToast("Project deleted.", "info");
  }

  function init() {
    tableBody = document.querySelector("#ppmpTable tbody");
    totalBudgetEl = document.getElementById("totalBudget");
    addBtn = document.getElementById("addProject");

    tableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-index]");
      if (!btn) return;
      const index = Number(btn.dataset.index);
      if (btn.classList.contains("edit-btn")) editProject(index);
      else if (btn.classList.contains("delete-btn")) deleteProject(index);
    });

    addBtn.addEventListener("click", () => {
      const { validateProjectForm } = window.PPMP.validation;
      const { show: showToast } = window.PPMP.toast;
      const { saveState } = window.PPMP.persistence;

      const { valid, data, firstInvalid } = validateProjectForm();
      if (!valid) {
        showToast("Please fix the highlighted fields.", "error");
        if (firstInvalid) document.getElementById(firstInvalid).focus();
        return;
      }

      if (getEditIndex() !== null) {
        projects[getEditIndex()] = data;
        showToast("Project updated.", "success");
      } else {
        projects.push(data);
        showToast("Project added.", "success");
      }

      renderTable();
      saveState();
      resetProjectForm();
    });
  }

  return { init, renderTable, resetProjectForm, editProject, deleteProject };
})();
