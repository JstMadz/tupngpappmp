document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "ppmp_ngpa_v3_state";
  const HEADER_FIELD_IDS = [
    "fiscalYear",
    "unit",
    "office",
    "unitDesignation",
    "indicative",
    "final",
    "headUnit",
    "headDesignation",
  ];

  const nextYear = new Date().getFullYear() + 1;
  flatpickr(".month-picker", {
    dateFormat: "m/Y",
    defaultDate: `01/01/${nextYear}`,
  });

  const projects = [];
  let editIndex = null;

  const tableBody = document.querySelector("#ppmpTable tbody");
  const totalBudgetEl = document.getElementById("totalBudget");
  const addBtn = document.getElementById("addProject");

  // ---------- Utilities ----------

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function formatCurrencyDisplay(num) {
    return Number(num || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function parseCurrency(str) {
    const cleaned = String(str || "").replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function formatCurrencyLive(e) {
    const el = e.target;
    const cleaned = el.value.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    let intPart = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
    let decPart = firstDot === -1 ? undefined : cleaned.slice(firstDot + 1, firstDot + 3);
    intPart = intPart.replace(/^0+(?=\d)/, "");
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    el.value = decPart !== undefined ? `${grouped}.${decPart}` : grouped;
  }

  function parseMonthYear(str) {
    const match = /^(\d{1,2})\/(\d{4})$/.exec(String(str || "").trim());
    if (!match) return null;
    const month = Number(match[1]);
    const year = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return new Date(year, month - 1, 1);
  }

  function uppercaseLive(e) {
    const el = e.target;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.toUpperCase();
    if (start !== null && end !== null) el.setSelectionRange(start, end);
  }

  const UPPERCASE_FIELD_IDS = [
    "description",
    "quantity",
    "remarks",
    "unit",
    "office",
    "unitDesignation",
    "headUnit",
    "docsOthersText",
  ];
  UPPERCASE_FIELD_IDS.forEach((id) => {
    document.getElementById(id).addEventListener("input", uppercaseLive);
  });

  // ---------- Dynamic form options (designations / supporting documents) ----------
  // Baseline options live in the HTML itself so the form works offline (e.g. opened
  // via file://); this fetch lets data/form-options.json override them at runtime so
  // the lists can be edited later without touching the code.

  function populateHeadDesignations(options) {
    const select = document.getElementById("headDesignation");
    const currentValue = select.value;
    select.innerHTML = "";
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = "-- Select Designation --";
    select.appendChild(blankOption);
    options.forEach((label) => {
      const opt = document.createElement("option");
      opt.textContent = label;
      select.appendChild(opt);
    });
    if (options.includes(currentValue)) select.value = currentValue;
  }

  function populateSupportingDocs(options) {
    const group = document.getElementById("docsCheckboxGroup");
    const checkedValues = new Set(
      Array.from(group.querySelectorAll(".docs-checkbox:checked")).map((el) => el.value)
    );
    group.innerHTML = "";
    options.forEach((label) => {
      const item = document.createElement("label");
      item.className = "checkbox-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "docs-checkbox";
      checkbox.value = label;
      if (checkedValues.has(label)) checkbox.checked = true;
      const labelSpan = document.createElement("span");
      labelSpan.textContent = label;
      item.appendChild(checkbox);
      item.appendChild(labelSpan);
      group.appendChild(item);
    });
  }

  async function loadFormOptions() {
    try {
      const res = await fetch("data/form-options.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.headDesignations) && data.headDesignations.length) {
        populateHeadDesignations(data.headDesignations);
      }
      if (Array.isArray(data.supportingDocuments) && data.supportingDocuments.length) {
        populateSupportingDocs(data.supportingDocuments);
      }
    } catch (e) {
      console.warn("Using built-in default designations/supporting documents.", e);
    }
  }
  loadFormOptions();

  function getSelectedDocs() {
    const checked = Array.from(document.querySelectorAll(".docs-checkbox:checked")).map(
      (el) => el.value
    );
    const othersChecked = document.getElementById("docsOthersCheck").checked;
    const othersText = document.getElementById("docsOthersText").value.trim();
    if (othersChecked && othersText) {
      checked.push(`OTHERS: ${othersText}`);
    }
    return checked.join("; ");
  }

  function setSelectedDocs(docsString) {
    document.querySelectorAll(".docs-checkbox").forEach((cb) => (cb.checked = false));
    const othersCheck = document.getElementById("docsOthersCheck");
    const othersText = document.getElementById("docsOthersText");
    othersCheck.checked = false;
    othersText.value = "";
    othersText.disabled = true;

    const segments = String(docsString || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const knownCheckboxes = Array.from(document.querySelectorAll(".docs-checkbox"));
    const leftover = [];

    segments.forEach((segment) => {
      const othersMatch = /^OTHERS:\s*(.*)$/i.exec(segment);
      if (othersMatch) {
        if (othersMatch[1]) leftover.push(othersMatch[1]);
        return;
      }
      const match = knownCheckboxes.find(
        (cb) => cb.value.toUpperCase() === segment.toUpperCase()
      );
      if (match) match.checked = true;
      else leftover.push(segment);
    });

    if (leftover.length) {
      othersCheck.checked = true;
      othersText.disabled = false;
      othersText.value = leftover.join("; ");
    }
  }

  document.getElementById("docsOthersCheck").addEventListener("change", (e) => {
    const othersText = document.getElementById("docsOthersText");
    othersText.disabled = !e.target.checked;
    if (!e.target.checked) othersText.value = "";
  });

  // ---------- CSV / TSV import ----------

  function parseDelimitedText(text, delimiter) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        row.push(field);
        field = "";
      } else if (char === "\r") {
        // ignore; \n (below) ends the row
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function normalizeHeader(h) {
    return String(h || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  const HEADER_IMPORT_KEYS = [
    "fiscalYear",
    "unit",
    "office",
    "unitDesignation",
    "planType",
    "headUnit",
    "headDesignation",
  ];

  const IMPORT_FIELD_MAP = {
    fiscalyear: "fiscalYear",
    fy: "fiscalYear",
    unit: "unit",
    enduser: "unit",
    implementingunit: "unit",
    enduserimplementingunit: "unit",
    office: "office",
    unitdesignation: "unitDesignation",
    enduserdesignation: "unitDesignation",
    plantype: "planType",
    headunit: "headUnit",
    headofimplementingunitsector: "headUnit",
    headimplementingunitsector: "headUnit",
    headdesignation: "headDesignation",
    headunitdesignation: "headDesignation",
    description: "description",
    type: "type",
    procurementtype: "type",
    quantity: "quantity",
    quantitysize: "quantity",
    mode: "mode",
    modeofprocurement: "mode",
    preproc: "preProc",
    preprocurementconf: "preProc",
    preprocurementconference: "preProc",
    start: "start",
    startdate: "start",
    end: "end",
    enddate: "end",
    implementation: "implementation",
    implementationperiod: "implementation",
    source: "source",
    sourceoffunds: "source",
    budget: "budget",
    estimatedbudget: "budget",
    docs: "docs",
    supportingdocs: "docs",
    remarks: "remarks",
  };

  function buildProjectFromRow(rowObj) {
    return {
      description: String(rowObj.description || "").trim().toUpperCase(),
      type: String(rowObj.type || "Goods").trim(),
      quantity: String(rowObj.quantity || "").trim().toUpperCase(),
      mode: String(rowObj.mode || "Competitive Bidding").trim(),
      preProc: String(rowObj.preProc || "Yes").trim(),
      start: String(rowObj.start || "").trim(),
      end: String(rowObj.end || "").trim(),
      implementation: String(rowObj.implementation || "").trim(),
      source: String(rowObj.source || "GAA - Current / Continuing").trim(),
      budget: parseCurrency(rowObj.budget),
      docs: String(rowObj.docs || "").trim().toUpperCase(),
      remarks: String(rowObj.remarks || "").trim().toUpperCase(),
    };
  }

  function isImportedProjectValid(p) {
    if (!p.description || p.description.length < 3) return false;
    if (!p.quantity) return false;
    if (!p.budget || p.budget <= 0) return false;
    const s = parseMonthYear(p.start);
    const e = parseMonthYear(p.end);
    const impl = parseMonthYear(p.implementation);
    if (!s || !e || !impl) return false;
    if (e < s) return false;
    return true;
  }

  function processImportedRows(rows) {
    if (!rows || rows.length < 2) {
      return { projects: [], header: {}, skipped: 0, total: 0 };
    }

    const headerRow = rows[0].map(normalizeHeader);
    const fieldIndexes = {};
    headerRow.forEach((h, i) => {
      const mapped = IMPORT_FIELD_MAP[h];
      if (mapped && !(mapped in fieldIndexes)) fieldIndexes[mapped] = i;
    });

    const dataRows = rows
      .slice(1)
      .filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""));

    const importedProjects = [];
    const headerValues = {};
    let skipped = 0;

    dataRows.forEach((cells) => {
      const rowObj = {};
      Object.entries(fieldIndexes).forEach(([field, idx]) => {
        rowObj[field] = cells[idx] ?? "";
      });
      HEADER_IMPORT_KEYS.forEach((key) => {
        if (!headerValues[key] && rowObj[key]) {
          headerValues[key] = String(rowObj[key]).trim();
        }
      });
      const project = buildProjectFromRow(rowObj);
      if (isImportedProjectValid(project)) {
        importedProjects.push(project);
      } else {
        skipped++;
      }
    });

    return { projects: importedProjects, header: headerValues, skipped, total: dataRows.length };
  }

  function applyImportedHeader(header) {
    if (!header) return;

    if (header.fiscalYear) {
      document.getElementById("fiscalYear").value = header.fiscalYear;
      validateFiscalYear();
    }
    if (header.unit) {
      document.getElementById("unit").value = header.unit.toUpperCase();
      validateRequiredText("unit", "End-User / Implementing Unit", 1);
    }
    if (header.office) document.getElementById("office").value = header.office.toUpperCase();
    if (header.unitDesignation) {
      document.getElementById("unitDesignation").value = header.unitDesignation.toUpperCase();
    }
    if (header.headUnit) {
      document.getElementById("headUnit").value = header.headUnit.toUpperCase();
      validateRequiredText("headUnit", "Head of Implementing Unit / Sector", 1);
    }
    if (header.headDesignation) {
      document.getElementById("headDesignation").value = header.headDesignation.toUpperCase();
    }
    if (header.planType) {
      const normalized = header.planType.trim().toLowerCase();
      if (normalized === "final") document.getElementById("final").checked = true;
      else if (normalized === "indicative") document.getElementById("indicative").checked = true;
    }
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function getPlanTypeLabel() {
    if (document.getElementById("final").checked) return "Final";
    if (document.getElementById("indicative").checked) return "Indicative";
    return "";
  }

  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // ---------- Field-level error display ----------

  function setFieldError(id, message) {
    const el = document.getElementById(id);
    const errorEl = document.getElementById(`${id}Error`);
    if (!el) return;
    if (message) {
      el.classList.add("invalid");
      el.setAttribute("aria-invalid", "true");
      if (errorEl) errorEl.textContent = message;
    } else {
      el.classList.remove("invalid");
      el.removeAttribute("aria-invalid");
      if (errorEl) errorEl.textContent = "";
    }
  }

  document.querySelectorAll(".error-message").forEach((span) => {
    const inputId = span.id.replace(/Error$/, "");
    const input = document.getElementById(inputId);
    if (input) input.setAttribute("aria-describedby", span.id);
  });

  // ---------- Validators ----------

  function validateRequiredText(id, label, minLen = 1) {
    const val = document.getElementById(id).value.trim();
    if (!val) {
      setFieldError(id, `${label} is required.`);
      return false;
    }
    if (val.length < minLen) {
      setFieldError(id, `${label} must be at least ${minLen} characters.`);
      return false;
    }
    setFieldError(id, "");
    return true;
  }

  function validateBudgetField() {
    const raw = document.getElementById("budget").value;
    const val = parseCurrency(raw);
    if (!raw.trim() || val <= 0) {
      setFieldError("budget", "Enter a valid budget greater than 0.");
      return false;
    }
    setFieldError("budget", "");
    return true;
  }

  function validateDateField(id, label) {
    const val = document.getElementById(id).value.trim();
    if (!val) {
      setFieldError(id, `${label} is required.`);
      return false;
    }
    setFieldError(id, "");
    return true;
  }

  function validateDateOrder() {
    const startVal = document.getElementById("startDate").value.trim();
    const endVal = document.getElementById("endDate").value.trim();
    if (!startVal || !endVal) return true;
    const s = parseMonthYear(startVal);
    const e = parseMonthYear(endVal);
    if (s && e && e < s) {
      setFieldError("endDate", "End date cannot be earlier than start date.");
      return false;
    }
    return true;
  }

  function validateFiscalYear() {
    const val = document.getElementById("fiscalYear").value.trim();
    const num = Number(val);
    if (!val || isNaN(num) || num < 2000 || num > 2100) {
      setFieldError("fiscalYear", "Enter a valid 4-digit fiscal year.");
      return false;
    }
    setFieldError("fiscalYear", "");
    return true;
  }

  document.getElementById("description").addEventListener("blur", () =>
    validateRequiredText("description", "Description", 3)
  );
  document.getElementById("quantity").addEventListener("blur", () =>
    validateRequiredText("quantity", "Quantity / Size", 1)
  );
  document.getElementById("budget").addEventListener("blur", validateBudgetField);
  document.getElementById("budget").addEventListener("input", formatCurrencyLive);
  document.getElementById("startDate").addEventListener("blur", () => {
    validateDateField("startDate", "Start date");
    validateDateOrder();
  });
  document.getElementById("endDate").addEventListener("blur", () => {
    validateDateField("endDate", "End date");
    validateDateOrder();
  });
  document.getElementById("implementation").addEventListener("blur", () =>
    validateDateField("implementation", "Implementation period")
  );
  document.getElementById("fiscalYear").addEventListener("blur", validateFiscalYear);
  document.getElementById("unit").addEventListener("blur", () =>
    validateRequiredText("unit", "End-User / Implementing Unit", 1)
  );
  document.getElementById("headUnit").addEventListener("blur", () =>
    validateRequiredText("headUnit", "Head of Implementing Unit / Sector", 1)
  );

  function validateProjectForm() {
    const checks = [
      validateRequiredText("description", "Description", 3),
      validateRequiredText("quantity", "Quantity / Size", 1),
      validateBudgetField(),
      validateDateField("startDate", "Start date"),
      validateDateField("endDate", "End date"),
      validateDateField("implementation", "Implementation period"),
    ];
    const dateOrderOk = validateDateOrder();
    const valid = checks.every(Boolean) && dateOrderOk;

    const data = {
      description: document.getElementById("description").value.trim().toUpperCase(),
      type: document.getElementById("type").value,
      quantity: document.getElementById("quantity").value.trim().toUpperCase(),
      mode: document.getElementById("mode").value,
      preProc: document.getElementById("preProc").value,
      start: document.getElementById("startDate").value.trim(),
      end: document.getElementById("endDate").value.trim(),
      implementation: document.getElementById("implementation").value.trim(),
      source: document.getElementById("source").value,
      budget: parseCurrency(document.getElementById("budget").value),
      docs: getSelectedDocs(),
      remarks: document.getElementById("remarks").value.trim().toUpperCase(),
    };

    const firstInvalid = [
      "description",
      "quantity",
      "budget",
      "startDate",
      "endDate",
      "implementation",
    ].find((id) => document.getElementById(id).classList.contains("invalid"));

    return { valid, data, firstInvalid };
  }

  function validateHeaderForm() {
    const checks = [
      validateFiscalYear(),
      validateRequiredText("unit", "End-User / Implementing Unit", 1),
      validateRequiredText("headUnit", "Head of Implementing Unit / Sector", 1),
    ];
    const valid = checks.every(Boolean);
    const firstInvalid = ["fiscalYear", "unit", "headUnit"].find((id) =>
      document.getElementById(id).classList.contains("invalid")
    );
    return { valid, firstInvalid };
  }

  // ---------- Persistence (localStorage) ----------

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
        JSON.stringify({ header: getHeaderState(), projects })
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

  const debouncedSave = debounce(saveState, 400);
  HEADER_FIELD_IDS.forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener("input", debouncedSave);
    el.addEventListener("change", debouncedSave);
  });
  window.addEventListener("beforeunload", saveState);

  // ---------- Table rendering ----------

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

  tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    const index = Number(btn.dataset.index);
    if (btn.classList.contains("edit-btn")) editProject(index);
    else if (btn.classList.contains("delete-btn")) deleteProject(index);
  });

  function editProject(index) {
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
    document.getElementById("source").value = p.source;
    document.getElementById("budget").value = formatCurrencyDisplay(p.budget);
    setSelectedDocs(p.docs);
    document.getElementById("remarks").value = p.remarks;

    editIndex = index;
    addBtn.textContent = "💾 Update Project";
    document.getElementById("description").focus();
  }

  function deleteProject(index) {
    if (confirm("Are you sure you want to delete this project?")) {
      projects.splice(index, 1);
      if (editIndex === index) {
        editIndex = null;
        addBtn.textContent = "➕ Add Project";
        document.getElementById("projectForm").reset();
        setSelectedDocs("");
      }
      renderTable();
      saveState();
      showToast("Project deleted.", "info");
    }
  }

  // ---------- Add / Update project ----------

  addBtn.addEventListener("click", () => {
    const { valid, data, firstInvalid } = validateProjectForm();
    if (!valid) {
      showToast("Please fix the highlighted fields.", "error");
      if (firstInvalid) document.getElementById(firstInvalid).focus();
      return;
    }

    if (editIndex !== null) {
      projects[editIndex] = data;
      editIndex = null;
      addBtn.textContent = "➕ Add Project";
      showToast("Project updated.", "success");
    } else {
      projects.push(data);
      showToast("Project added.", "success");
    }

    renderTable();
    saveState();
    document.getElementById("projectForm").reset();
    setSelectedDocs("");
  });

  // ---------- Clear saved data ----------

  document.getElementById("clearData").addEventListener("click", () => {
    if (
      !confirm(
        "This will permanently delete all saved PPMP data from this browser. Continue?"
      )
    )
      return;

    localStorage.removeItem(STORAGE_KEY);
    projects.length = 0;
    editIndex = null;
    addBtn.textContent = "➕ Add Project";
    document.getElementById("projectForm").reset();
    setSelectedDocs("");
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

  // ---------- Export to Excel / CSV ----------

  document.getElementById("exportExcel").onclick = () => {
    if (projects.length === 0) {
      showToast("No projects to export.", "error");
      return;
    }
    const headerSnapshot = {
      fiscalYear: document.getElementById("fiscalYear").value || "",
      unit: document.getElementById("unit").value || "",
      office: document.getElementById("office").value || "",
      unitDesignation: document.getElementById("unitDesignation").value || "",
      planType: getPlanTypeLabel(),
      headUnit: document.getElementById("headUnit").value || "",
      headDesignation: document.getElementById("headDesignation").value || "",
    };
    const exportRows = projects.map((p) => ({ ...headerSnapshot, ...p }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PPMP Projects");
    XLSX.writeFile(wb, "PPMP_Projects.xlsx");
    showToast("Exported to Excel.", "success");
  };

  // ---------- Import CSV / TSV / Excel ----------

  const importFileInput = document.getElementById("importFile");
  document.getElementById("importFileBtn").addEventListener("click", () => importFileInput.click());

  importFileInput.addEventListener("change", async () => {
    const file = importFileInput.files[0];
    if (!file) return;

    try {
      const name = file.name.toLowerCase();
      let rows;

      if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
      } else {
        const text = await file.text();
        let delimiter = name.endsWith(".tsv") ? "\t" : ",";
        if (!name.endsWith(".csv") && !name.endsWith(".tsv")) {
          const firstLine = text.split(/\r?\n/, 1)[0] || "";
          const tabCount = (firstLine.match(/\t/g) || []).length;
          const commaCount = (firstLine.match(/,/g) || []).length;
          delimiter = tabCount > commaCount ? "\t" : ",";
        }
        rows = parseDelimitedText(text, delimiter);
      }

      const result = processImportedRows(rows);

      if (result.total === 0) {
        showToast("The file has no data rows to import.", "error");
        return;
      }
      if (result.projects.length === 0) {
        showToast(
          "No valid rows found. Check Description, Quantity, Budget, and dates (MM/YYYY).",
          "error"
        );
        return;
      }

      if (projects.length > 0) {
        const confirmed = confirm(
          `Importing will replace the current ${projects.length} project(s) with ${result.projects.length} imported project(s). Continue?`
        );
        if (!confirmed) return;
      }

      projects.length = 0;
      projects.push(...result.projects);
      editIndex = null;
      addBtn.textContent = "➕ Add Project";
      document.getElementById("projectForm").reset();
      setSelectedDocs("");

      applyImportedHeader(result.header);

      renderTable();
      saveState();

      const skippedMsg =
        result.skipped > 0
          ? ` (${result.skipped} row${result.skipped === 1 ? "" : "s"} skipped — missing/invalid data)`
          : "";
      showToast(
        `Imported ${result.projects.length} project(s)${skippedMsg}.`,
        result.skipped > 0 ? "info" : "success"
      );
    } catch (err) {
      console.error(err);
      showToast("Could not read the file. Make sure it's a valid CSV, TSV, or Excel export.", "error");
    } finally {
      importFileInput.value = "";
    }
  });

  // ---------- Print or Save as PDF ----------

  document.getElementById("printPPMP").onclick = () => {
    const { valid, firstInvalid } = validateHeaderForm();
    if (!valid) {
      showToast("Please complete the required plan information before printing.", "error");
      if (firstInvalid) document.getElementById(firstInvalid).focus();
      return;
    }
    if (projects.length === 0) {
      showToast("Add at least one project before printing.", "error");
      return;
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

    const printedOn = `Printed on: ${new Date().toLocaleString("en-PH", {
      dateStyle: "long",
      timeStyle: "short",
    })}`;
    document.getElementById("footerDate").textContent = printedOn;

    const logoUrl = new URL("assets/tup_logo.png", window.location.href).href;
    const officeName = escapeHtml(document.getElementById("office").value || "");
    const unitName = escapeHtml(document.getElementById("unit").value || "");
    const fiscalYearVal = escapeHtml(document.getElementById("fiscalYear").value || "");
    const planType = getPlanTypeLabel();

    const metaParts = [`Fiscal Year ${fiscalYearVal}`];
    if (planType) metaParts.push(planType);
    if (unitName) metaParts.push(unitName);
    if (officeName) metaParts.push(officeName);

    const headerHTML = `
        <div class="print-letterhead">
          <img src="${logoUrl}" width="70" height="70" alt="TUP Manila Logo" />
          <div class="print-letterhead-text">
            <h1>Technological University of the Philippines - Manila</h1>
            <h2>Project Procurement Management Plan (PPMP)</h2>
            <p class="print-meta">${metaParts.join(" &middot; ")}</p>
          </div>
        </div>`;

    const tableHTML = document.querySelector(".table-display").outerHTML;
    const signatureHTML = document.querySelector(".signature-container").outerHTML;
    const footerHTML = `<p class="print-footer-note">${printedOn}</p>`;

    const printDoc = `<!DOCTYPE html>
        <html><head><title>PPMP - ${unitName || "Print"}</title>
        <meta charset="UTF-8" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body { font-family:'Poppins',sans-serif; margin:24px; color:#1a1718; }
          .print-letterhead { display:flex; align-items:center; gap:16px; border-bottom:3px solid #8c1d40; padding-bottom:12px; margin-bottom:16px; }
          .print-letterhead h1 { margin:0; font-size:18px; }
          .print-letterhead h2 { margin:2px 0 0; font-size:14px; font-weight:500; }
          .print-meta { margin:6px 0 0; font-size:12px; color:#444; }
          h3 { font-size:14px; margin:12px 0 6px; }
          table { width:100%; border-collapse:collapse; font-size:11px; }
          thead { display:table-header-group; }
          tr { break-inside:avoid; }
          th, td { border:1px solid #999; padding:6px; text-align:center; }
          th { background:#8c1d40; color:#fff; }
          td.budget-cell { text-align:right; }
          th:last-child, td:last-child { display:none; }
          .total-container { text-align:right; margin-top:8px; font-weight:600; font-size:13px; }
          .signature-container { display:flex; justify-content:space-around; margin-top:48px; text-align:center; gap:16px; }
          .signature-block { flex:1; }
          .signature-name { font-weight:600; margin:0; }
          .signature-designation { margin:2px 0 8px; font-size:12px; color:#444; }
          .signature-date { font-size:11px; color:#444; }
          .print-footer-note { text-align:right; font-size:10px; color:#666; margin-top:24px; }
          @page { size: landscape; margin: 14mm; }
        </style>
        </head><body>${headerHTML}${tableHTML}${signatureHTML}${footerHTML}</body></html>`;

    const newWin = window.open("", "_blank");
    if (!newWin) {
      showToast("Please allow pop-ups to print the PPMP.", "error");
      return;
    }
    newWin.document.write(printDoc);
    newWin.document.close();
    newWin.onload = () => newWin.print();
    showToast("Preparing print preview...", "info");
  };

  // ---------- Init ----------

  loadState();
  if (!document.getElementById("fiscalYear").value) {
    document.getElementById("fiscalYear").value = nextYear;
  }
  renderTable();
});
