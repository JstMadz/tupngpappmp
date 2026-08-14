// Renders the procurement projects table and handles add / edit / delete for
// individual rows. This is the module most other features (import, PDF
// export, print) read `projects` through indirectly via js/state.js, but
// come here for resetProjectForm()/renderTable() after they change the list.
window.PPMP = window.PPMP || {};

window.PPMP.projectsTable = (function () {
  const { projects, getEditIndex, setEditIndex } = window.PPMP.state;
  const { escapeHtml } = window.PPMP.text;
  const { formatCurrencyDisplay } = window.PPMP.currency;

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
            <button type="button" class="edit-btn" data-index="${i}">✏️ Edit</button>
            <button type="button" class="delete-btn" data-index="${i}">🗑️ Delete</button>
          </td>`;
      tableBody.appendChild(row);
    });
    totalBudgetEl.textContent = formatCurrencyDisplay(total);
  }

  function resetProjectForm() {
    const { setSelectedDocs } = window.PPMP.formOptions;
    setEditIndex(null);
    addBtn.textContent = "➕ Add Project";
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
    addBtn.textContent = "💾 Update Project";
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
