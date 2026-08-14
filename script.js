document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "ppmp_ngpa_v3_state";
  const HEADER_FIELD_IDS = [
    "fiscalYear",
    "unit",
    "office",
    "unitDesignation",
    "ppmpNo",
    "indicative",
    "final",
    "headUnit",
    "headDesignation",
  ];

  const nextYear = new Date().getFullYear() + 1;

  const AIR_DATEPICKER_LOCALE_EN = {
    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    monthsShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    today: "Today",
    clear: "Clear",
    dateFormat: "MM/dd/yyyy",
    timeFormat: "hh:mm aa",
    firstDay: 0,
  };

  const datePickers = {};
  document.querySelectorAll(".month-picker").forEach((el) => {
    const instance = new AirDatepicker(el, {
      locale: AIR_DATEPICKER_LOCALE_EN,
      dateFormat: "MM/dd/yyyy",
      isMobile: true,
      autoClose: true,
      buttons: ["today", "clear"],
      onSelect: ({ date }) => {
        el.dispatchEvent(new Event("blur"));
        if (el.id === "startDate" && date instanceof Date) {
          if (datePickers.endDate) datePickers.endDate.update({ minDate: date });
          if (datePickers.implementation) {
            datePickers.implementation.update({ minDate: date });
          }
        }
      },
    });
    instance.selectDate(new Date(nextYear, 0, 1), { silent: true });
    datePickers[el.id] = instance;
  });

  function syncDatePicker(id, value) {
    const instance = datePickers[id];
    if (!instance) return;
    const date = parseFullDate(value);
    if (date) instance.selectDate(date, { silent: true });
    else instance.clear({ silent: true });
  }

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
    let decPart =
      firstDot === -1 ? undefined : cleaned.slice(firstDot + 1, firstDot + 3);
    intPart = intPart.replace(/^0+(?=\d)/, "");
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    el.value = decPart !== undefined ? `${grouped}.${decPart}` : grouped;
  }

  function parseFullDate(str) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
      String(str || "").trim(),
    );
    if (!match) return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  function getInitials(str) {
    return String(str || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  // Format: TUPM-AAA(Office Code)-BBB(Type of Transaction)-CCC(Initial of employee)
  // -MMDDYYYY(month day year)-HHMMAM/PM(hour:minutes AM/PM)
  function generateTransactionId() {
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
      Array.from(group.querySelectorAll(".docs-checkbox:checked")).map(
        (el) => el.value,
      ),
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
      if (
        Array.isArray(data.headDesignations) &&
        data.headDesignations.length
      ) {
        populateHeadDesignations(data.headDesignations);
      }
      if (
        Array.isArray(data.supportingDocuments) &&
        data.supportingDocuments.length
      ) {
        populateSupportingDocs(data.supportingDocuments);
      }
    } catch (e) {
      console.warn(
        "Using built-in default designations/supporting documents.",
        e,
      );
    }
  }
  loadFormOptions();

  function getSelectedDocs() {
    const checked = Array.from(
      document.querySelectorAll(".docs-checkbox:checked"),
    ).map((el) => el.value);
    const othersChecked = document.getElementById("docsOthersCheck").checked;
    const othersText = document.getElementById("docsOthersText").value.trim();
    if (othersChecked && othersText) {
      checked.push(`OTHERS: ${othersText}`);
    }
    return checked.join("; ");
  }

  function setSelectedDocs(docsString) {
    document
      .querySelectorAll(".docs-checkbox")
      .forEach((cb) => (cb.checked = false));
    const othersCheck = document.getElementById("docsOthersCheck");
    const othersText = document.getElementById("docsOthersText");
    othersCheck.checked = false;
    othersText.value = "";
    othersText.disabled = true;

    const segments = String(docsString || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const knownCheckboxes = Array.from(
      document.querySelectorAll(".docs-checkbox"),
    );
    const leftover = [];

    segments.forEach((segment) => {
      const othersMatch = /^OTHERS:\s*(.*)$/i.exec(segment);
      if (othersMatch) {
        if (othersMatch[1]) leftover.push(othersMatch[1]);
        return;
      }
      const match = knownCheckboxes.find(
        (cb) => cb.value.toUpperCase() === segment.toUpperCase(),
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
    "ppmpNo",
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
    ppmpno: "ppmpNo",
    ppmpnumber: "ppmpNo",
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
      description: String(rowObj.description || "")
        .trim()
        .toUpperCase(),
      type: String(rowObj.type || "Goods").trim(),
      quantity: String(rowObj.quantity || "")
        .trim()
        .toUpperCase(),
      mode: String(rowObj.mode || "Competitive Bidding").trim(),
      preProc: String(rowObj.preProc || "Yes").trim(),
      start: String(rowObj.start || "").trim(),
      end: String(rowObj.end || "").trim(),
      implementation: String(rowObj.implementation || "").trim(),
      source: String(rowObj.source || "GAA - Current / Continuing").trim(),
      budget: parseCurrency(rowObj.budget),
      docs: String(rowObj.docs || "")
        .trim()
        .toUpperCase(),
      remarks: String(rowObj.remarks || "")
        .trim()
        .toUpperCase(),
    };
  }

  function isImportedProjectValid(p) {
    if (!p.description || p.description.length < 3) return false;
    if (!p.quantity) return false;
    if (!p.budget || p.budget <= 0) return false;
    const s = parseFullDate(p.start);
    const e = parseFullDate(p.end);
    const impl = parseFullDate(p.implementation);
    if (!s || !e || !impl) return false;
    if (e < s) return false;
    if (impl < s) return false;
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

    return {
      projects: importedProjects,
      header: headerValues,
      skipped,
      total: dataRows.length,
    };
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
    if (header.office)
      document.getElementById("office").value = header.office.toUpperCase();
    if (header.unitDesignation) {
      document.getElementById("unitDesignation").value =
        header.unitDesignation.toUpperCase();
    }
    if (header.ppmpNo) document.getElementById("ppmpNo").value = header.ppmpNo;
    if (header.headUnit) {
      document.getElementById("headUnit").value = header.headUnit.toUpperCase();
      validateRequiredText("headUnit", "Head of Implementing Unit / Sector", 1);
    }
    if (header.headDesignation) {
      document.getElementById("headDesignation").value =
        header.headDesignation.toUpperCase();
    }
    if (header.planType) {
      const normalized = header.planType.trim().toLowerCase();
      if (normalized === "final")
        document.getElementById("final").checked = true;
      else if (normalized === "indicative")
        document.getElementById("indicative").checked = true;
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

  // ---------- Confirm modal (replaces window.confirm) ----------

  const confirmModal = document.getElementById("confirmModal");
  const confirmModalMessage = document.getElementById("confirmModalMessage");
  const confirmModalOk = document.getElementById("confirmModalOk");
  const confirmModalCancel = document.getElementById("confirmModalCancel");
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

  confirmModalOk.addEventListener("click", () => closeConfirmModal(true));
  confirmModalCancel.addEventListener("click", () => closeConfirmModal(false));
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) closeConfirmModal(false);
  });

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
    const s = parseFullDate(startVal);
    const e = parseFullDate(endVal);
    if (s && e && e < s) {
      setFieldError("endDate", "End date cannot be earlier than start date.");
      return false;
    }
    setFieldError("endDate", "");
    return true;
  }

  function validateImplementationOrder() {
    const startVal = document.getElementById("startDate").value.trim();
    const implVal = document.getElementById("implementation").value.trim();
    if (!startVal || !implVal) return true;
    const s = parseFullDate(startVal);
    const impl = parseFullDate(implVal);
    if (s && impl && impl < s) {
      setFieldError(
        "implementation",
        "Implementation date cannot be earlier than start date.",
      );
      return false;
    }
    setFieldError("implementation", "");
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

  document
    .getElementById("description")
    .addEventListener("blur", () =>
      validateRequiredText("description", "Description", 3),
    );
  document
    .getElementById("quantity")
    .addEventListener("blur", () =>
      validateRequiredText("quantity", "Quantity / Size", 1),
    );
  document
    .getElementById("budget")
    .addEventListener("blur", validateBudgetField);
  document
    .getElementById("budget")
    .addEventListener("input", formatCurrencyLive);
  document.getElementById("startDate").addEventListener("blur", () => {
    validateDateField("startDate", "Start date");
    validateDateOrder();
    validateImplementationOrder();
  });
  document.getElementById("endDate").addEventListener("blur", () => {
    validateDateField("endDate", "End date");
    validateDateOrder();
  });
  document.getElementById("implementation").addEventListener("blur", () => {
    validateDateField("implementation", "Implementation period");
    validateImplementationOrder();
  });
  document
    .getElementById("fiscalYear")
    .addEventListener("blur", validateFiscalYear);
  document
    .getElementById("unit")
    .addEventListener("blur", () =>
      validateRequiredText("unit", "End-User / Implementing Unit", 1),
    );
  document
    .getElementById("headUnit")
    .addEventListener("blur", () =>
      validateRequiredText("headUnit", "Head of Implementing Unit / Sector", 1),
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
    const implementationOrderOk = validateImplementationOrder();
    const valid = checks.every(Boolean) && dateOrderOk && implementationOrderOk;

    const data = {
      description: document
        .getElementById("description")
        .value.trim()
        .toUpperCase(),
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
      document.getElementById(id).classList.contains("invalid"),
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
    syncDatePicker("startDate", p.start);
    syncDatePicker("endDate", p.end);
    syncDatePicker("implementation", p.implementation);
    document.getElementById("source").value = p.source;
    document.getElementById("budget").value = formatCurrencyDisplay(p.budget);
    setSelectedDocs(p.docs);
    document.getElementById("remarks").value = p.remarks;

    editIndex = index;
    addBtn.textContent = "💾 Update Project";
    document.getElementById("description").focus();
  }

  async function deleteProject(index) {
    const confirmed = await showConfirm(
      "Are you sure you want to delete this project?",
    );
    if (!confirmed) return;

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

  document.getElementById("clearData").addEventListener("click", async () => {
    const confirmed = await showConfirm(
      "This will permanently delete all saved PPMP data from this browser. Continue?",
    );
    if (!confirmed) return;

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
      ppmpNo: document.getElementById("ppmpNo").value || "",
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
  document
    .getElementById("importFileBtn")
    .addEventListener("click", () => importFileInput.click());

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
        rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          raw: false,
        });
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
          "No valid rows found. Check Description, Quantity, Budget, and dates (MM/DD/YYYY).",
          "error",
        );
        return;
      }

      if (projects.length > 0) {
        const confirmed = await showConfirm(
          `Importing will replace the current ${projects.length} project(s) with ${result.projects.length} imported project(s). Continue?`,
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
        result.skipped > 0 ? "info" : "success",
      );
    } catch (err) {
      console.error(err);
      showToast(
        "Could not read the file. Make sure it's a valid CSV, TSV, or Excel export.",
        "error",
      );
    } finally {
      importFileInput.value = "";
    }
  });

  // ---------- Print or Save as PDF (matches official TUPM-F-PRO-20-PMP template) ----------

  async function loadImageAsDataUrl(url, maxSize = 200) {
    const res = await fetch(url);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }

  function prepareDocumentGeneration() {
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

  document.getElementById("savePdfBtn").onclick = async () => {
    if (!prepareDocumentGeneration()) return;

    const saveBtn = document.getElementById("savePdfBtn");
    const originalLabel = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "Generating PDF...";
    showToast("Generating PDF...", "info");

    try {
      const unitName = document.getElementById("unit").value.trim();
      const unitDesignationVal = document
        .getElementById("unitDesignation")
        .value.trim();
      const headUnitVal = document.getElementById("headUnit").value.trim();
      const headDesignationVal = document
        .getElementById("headDesignation")
        .value.trim();
      const fiscalYearVal = document.getElementById("fiscalYear").value.trim();
      const ppmpNoVal = document.getElementById("ppmpNo").value.trim();
      const planType = getPlanTypeLabel();
      const transactionId = generateTransactionId();

      let logoDataUrl = null;
      try {
        const logoUrl = new URL(
          "assets/tup_logo.png",
          window.location.href,
        ).href;
        logoDataUrl = await loadImageAsDataUrl(logoUrl);
      } catch (e) {
        logoDataUrl = null;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      doc.setLineWidth(0.2);
      doc.setDrawColor(0);

      // ----- Header table -----
      const logoW = 22;
      const metaLabelW = 32;
      const metaValueW = 40;
      const orgW = contentWidth - logoW - metaLabelW - metaValueW;
      const headerRowH = 6.5;
      const headerH = headerRowH * 4;

      doc.rect(margin, y, logoW, headerH);
      if (logoDataUrl) {
        const imgSize = 16;
        doc.addImage(
          logoDataUrl,
          "PNG",
          margin + (logoW - imgSize) / 2,
          y + (headerH - imgSize) / 2,
          imgSize,
          imgSize,
        );
      }

      doc.rect(margin + logoW, y, orgW, headerH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        "TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES",
        margin + logoW + orgW / 2,
        y + 9,
        { align: "center" },
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(
        "Ayala Blvd., Ermita, Manila, 1000, Philippines | Tel No. +632-5301-3001 local 132",
        margin + logoW + orgW / 2,
        y + 15,
        { align: "center" },
      );
      doc.text(
        "Fax No. +632-8521-4063 | Email: procurement@tup.edu.ph | Website: www.tup.edu.ph",
        margin + logoW + orgW / 2,
        y + 19,
        { align: "center" },
      );

      const metaRows = [
        ["Index No.", "TUPM-F-PRO-20-PMP"],
        ["Revision No.", "02"],
        ["Date", "07/13/2026"],
        ["Page", "1/1"],
      ];
      metaRows.forEach((row, i) => {
        const rowY = y + i * headerRowH;
        doc.rect(margin + logoW + orgW, rowY, metaLabelW, headerRowH);
        doc.rect(
          margin + logoW + orgW + metaLabelW,
          rowY,
          metaValueW,
          headerRowH,
        );
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(row[0], margin + logoW + orgW + 2, rowY + headerRowH / 2 + 1.3);
        doc.setFont("helvetica", "normal");
        doc.text(
          row[1],
          margin + logoW + orgW + metaLabelW + 2,
          rowY + headerRowH / 2 + 1.3,
        );
      });

      y += headerH;

      // ----- Title bar -----
      const titleH = 8;
      doc.rect(margin, y, contentWidth, titleH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(
        "PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP)",
        pageWidth / 2,
        y + titleH / 2 + 1.5,
        { align: "center" },
      );
      y += titleH;

      // ----- Topline: PPMP No + plan type checkboxes -----
      const toplineH = 8;
      doc.rect(margin, y, contentWidth, toplineH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const toplineTextY = y + toplineH / 2 + 1.3;
      doc.text(
        `PPMP NO. ${ppmpNoVal || "___________________"}`,
        pageWidth / 2 - 55,
        toplineTextY,
        { align: "center" },
      );

      function drawCheckbox(label, checked, cx) {
        const boxSize = 3.2;
        const boxY = toplineTextY - boxSize + 0.5;
        doc.rect(cx, boxY, boxSize, boxSize);
        if (checked) {
          doc.setFontSize(7);
          doc.text("X", cx + boxSize / 2, boxY + boxSize - 0.5, {
            align: "center",
          });
          doc.setFontSize(10);
        }
        doc.text(label, cx + boxSize + 1.5, toplineTextY);
      }
      drawCheckbox("INDICATIVE", planType === "Indicative", pageWidth / 2 + 8);
      drawCheckbox("FINAL", planType === "Final", pageWidth / 2 + 50);

      y += toplineH;

      // ----- Plan meta -----
      const metaH = 10;
      doc.rect(margin, y, contentWidth, metaH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`Fiscal Year: ${fiscalYearVal}`, margin + 3, y + 4.5);
      doc.text(
        `End-User or Implementing Unit: ${unitName}`,
        margin + 3,
        y + 8.5,
      );
      y += metaH;

      // ----- Main procurement table -----
      let total = 0;
      const bodyRows = projects.map((p) => {
        total += p.budget;
        return [
          p.description,
          p.type,
          p.quantity,
          p.mode,
          p.preProc,
          p.start,
          p.end,
          p.implementation,
          p.source,
          formatCurrencyDisplay(p.budget),
          p.docs,
          p.remarks,
        ];
      });

      const colWidths = [
        53.4, 19.7, 25.3, 25.3, 14.1, 14.1, 14.1, 16.9, 22.5, 22.5, 30.9, 22.5,
      ];
      const columnStyles = {};
      colWidths.forEach((w, i) => {
        columnStyles[i] = { cellWidth: w };
      });
      columnStyles[0].halign = "left";
      columnStyles[2].halign = "left";
      columnStyles[9].halign = "right";
      columnStyles[10].halign = "left";
      columnStyles[11].halign = "left";

      doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 6.3,
          cellPadding: 1.2,
          halign: "center",
          valign: "middle",
          lineColor: [0, 0, 0],
          lineWidth: 0.15,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 6.3,
          lineWidth: 0.15,
        },
        columnStyles,
        head: [
          [
            { content: "PROCUREMENT PROJECT DETAILS", colSpan: 5 },
            { content: "PROJECTED TIMELINE (MM/DD/YYYY)", colSpan: 3 },
            { content: "FUNDING DETAILS", colSpan: 2 },
            { content: "ATTACHED SUPPORTING DOCUMENTS", rowSpan: 2 },
            { content: "REMARKS", rowSpan: 2 },
          ],
          [
            "General Description and Objective of the Project to be Procured",
            "Type of the Project to be Procured (Goods, Infrastructure, Consulting Services)",
            "Quantity and Size of the Project to be Procured",
            "Recommended Mode of Procurement",
            "Pre-Procurement Conference, if applicable (Yes/No)",
            "Start of Procurement Activity",
            "End of Procurement Activity",
            "Expected Delivery/ Implementation Period",
            "Source of Funds",
            "Estimated Budget / Authorized Budgetary Allocation (PhP)",
          ],
          [
            "Column 1",
            "Column 2",
            "Column 3",
            "Column 4",
            "Column 5",
            "Column 6",
            "Column 7",
            "Column 8",
            "Column 9",
            "Column 10",
            "Column 11",
            "Column 12",
          ],
        ],
        body: bodyRows,
        foot: [
          [
            {
              content: "TOTAL BUDGET:",
              colSpan: 9,
              styles: { halign: "right", fontStyle: "bold" },
            },
            {
              content: formatCurrencyDisplay(total),
              styles: { halign: "right", fontStyle: "bold" },
            },
            { content: "", colSpan: 2 },
          ],
        ],
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.15,
        },
      });

      y = doc.lastAutoTable.finalY + 6;

      // ----- Signature blocks -----
      const sigBlockH = 34;
      if (y + sigBlockH > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      const sigColW = contentWidth / 2;

      function drawSignature(x, label, name, designation, roleCaption) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(label, x, y);
        doc.line(x, y + 12, x + sigColW - 10, y + 12);
        doc.setFont("helvetica", "bold");
        doc.text(name || "", x, y + 16);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Signature over Printed Name", x, y + 20);
        doc.text(designation || "Position/Designation", x, y + 24);
        doc.setFont("helvetica", "italic");
        doc.text(roleCaption, x, y + 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text("Date: ___________________", x, y + 33);
      }

      drawSignature(
        margin,
        "Prepared by:",
        unitName,
        unitDesignationVal,
        "[End-User or Implementing Unit]",
      );
      drawSignature(
        margin + sigColW,
        "Approved by:",
        headUnitVal,
        headDesignationVal,
        "[Head of the End-User or Implementing Unit]",
      );

      y += sigBlockH + 4;

      // ----- Footer table -----
      const footerRowH = 6;
      if (y + footerRowH * 2 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(8);
      doc.rect(margin, y, 40, footerRowH);
      doc.rect(margin + 40, y, contentWidth - 40, footerRowH);
      doc.setFont("helvetica", "bold");
      doc.text("Transaction ID", margin + 2, y + 4);
      doc.setFont("helvetica", "normal");
      doc.text(transactionId, margin + 42, y + 4);
      y += footerRowH;
      doc.rect(margin, y, 40, footerRowH);
      doc.rect(margin + 40, y, contentWidth - 40, footerRowH);
      doc.setFont("helvetica", "bold");
      doc.text("Signature", margin + 2, y + 4);

      const safeUnit = (unitName || "PPMP").replace(/[^a-z0-9]+/gi, "_");
      const filename = `PPMP_${safeUnit}_${fiscalYearVal || ""}`
        .replace(/_+/g, "_")
        .replace(/_$/, "");
      doc.save(`${filename}.pdf`);

      showToast("PDF saved.", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not generate the PDF. Please try again.", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel;
    }
  };

  document.getElementById("printBtn").onclick = () => {
    if (!prepareDocumentGeneration()) return;

    const logoUrl = new URL("assets/tup_logo.png", window.location.href).href;
    const unitName = escapeHtml(document.getElementById("unit").value || "");
    const unitDesignationVal = escapeHtml(
      document.getElementById("unitDesignation").value || "",
    );
    const headUnitVal = escapeHtml(
      document.getElementById("headUnit").value || "",
    );
    const headDesignationVal = escapeHtml(
      document.getElementById("headDesignation").value || "",
    );
    const fiscalYearVal = escapeHtml(
      document.getElementById("fiscalYear").value || "",
    );
    const ppmpNoVal = escapeHtml(document.getElementById("ppmpNo").value || "");
    const planType = getPlanTypeLabel();
    const transactionId = generateTransactionId();

    let total = 0;
    const rowsHTML = projects
      .map((p) => {
        total += p.budget;
        return `<tr>
          <td class="text-col">${escapeHtml(p.description)}</td>
          <td>${escapeHtml(p.type)}</td>
          <td class="text-col">${escapeHtml(p.quantity)}</td>
          <td>${escapeHtml(p.mode)}</td>
          <td>${escapeHtml(p.preProc)}</td>
          <td>${escapeHtml(p.start)}</td>
          <td>${escapeHtml(p.end)}</td>
          <td>${escapeHtml(p.implementation)}</td>
          <td>${escapeHtml(p.source)}</td>
          <td class="num-col">${formatCurrencyDisplay(p.budget)}</td>
          <td class="text-col">${escapeHtml(p.docs)}</td>
          <td class="text-col">${escapeHtml(p.remarks)}</td>
        </tr>`;
      })
      .join("");

    const printDoc = `<!DOCTYPE html>
        <html><head><title>PPMP - ${unitName || "Print"}</title>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 10mm; color:#000; font-size:9px; }
          table { border-collapse: collapse; width:100%; }

          .header-table td { border:1px solid #000; padding:4px 8px; vertical-align:middle; }
          .header-table .logo-cell { width:64px; text-align:center; }
          .header-table .logo-cell img { display:block; margin:0 auto; }
          .header-table .org-cell { text-align:center; }
          .header-table .org-name { font-weight:700; font-size:11px; }
          .header-table .org-address { font-size:7.5px; margin-top:2px; }
          .header-table .meta-label { width:78px; font-weight:600; font-size:8px; }
          .header-table .meta-value { width:110px; font-size:8px; }

          .title-bar { text-align:center; font-weight:700; font-size:12px; border:1px solid #000; border-top:none; padding:5px; letter-spacing:0.02em; }

          .ppmp-topline { display:flex; justify-content:center; align-items:center; gap:36px; border:1px solid #000; border-top:none; padding:5px; font-size:10px; font-weight:600; }
          .checkbox { display:inline-flex; align-items:center; gap:4px; }
          .checkbox .box { display:inline-block; width:10px; height:10px; border:1px solid #000; text-align:center; line-height:10px; font-size:8px; font-weight:700; }

          .plan-meta { border:1px solid #000; border-top:none; padding:5px 8px; font-size:9.5px; }
          .plan-meta div { margin:2px 0; font-weight:600; }

          .ppmp-table { border:1px solid #000; border-top:none; table-layout:fixed; }
          .ppmp-table th, .ppmp-table td { border:1px solid #000; padding:3px 4px; font-size:7.2px; text-align:center; vertical-align:middle; word-wrap:break-word; }
          .ppmp-table thead th { font-weight:700; }
          .ppmp-table td.text-col { text-align:left; }
          .ppmp-table td.num-col { text-align:right; }
          .total-row td { font-weight:700; text-align:right; }

          .sign-table { margin-top:12px; }
          .sign-table td { border:none; vertical-align:top; padding:2px 10px; width:50%; font-size:9px; }
          .sign-line { border-bottom:1px solid #000; height:34px; }
          .sign-name { font-weight:700; margin-top:2px; }
          .sign-caption { font-size:8px; color:#333; }
          .sign-caption em { font-style:italic; }
          .sign-date { font-size:8.5px; margin-top:8px; }

          .footer-table { margin-top:14px; }
          .footer-table td { border:1px solid #000; padding:4px 8px; font-size:8px; }
          .footer-table .flabel { width:120px; font-weight:600; }

          @page { size: A4 landscape; margin: 8mm; }
        </style>
        </head><body>
          <table class="header-table">
            <tr>
              <td class="logo-cell" rowspan="4"><img src="${logoUrl}" width="56" height="56" alt="TUP Logo" /></td>
              <td class="org-cell" rowspan="4">
                <div class="org-name">TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES</div>
                <div class="org-address">Ayala Blvd., Ermita, Manila, 1000, Philippines | Tel No. +632-5301-3001 local 132</div>
                <div class="org-address">Fax No. +632-8521-4063 | Email: procurement@tup.edu.ph | Website: www.tup.edu.ph</div>
              </td>
              <td class="meta-label">Index No.</td>
              <td class="meta-value">TUPM-F-PRO-20-PMP</td>
            </tr>
            <tr><td class="meta-label">Revision No.</td><td class="meta-value">02</td></tr>
            <tr><td class="meta-label">Date</td><td class="meta-value">07/13/2026</td></tr>
            <tr><td class="meta-label">Page</td><td class="meta-value">1/1</td></tr>
          </table>

          <div class="title-bar">PROJECT PROCUREMENT MANAGEMENT PLAN (PPMP)</div>

          <div class="ppmp-topline">
            <span>PPMP NO. ${ppmpNoVal || "___________________"}</span>
            <span class="checkbox"><span class="box">${planType === "Indicative" ? "X" : ""}</span> INDICATIVE</span>
            <span class="checkbox"><span class="box">${planType === "Final" ? "X" : ""}</span> FINAL</span>
          </div>

          <div class="plan-meta">
            <div>Fiscal Year: ${fiscalYearVal}</div>
            <div>End-User or Implementing Unit: ${unitName}</div>
          </div>

          <table class="ppmp-table">
            <colgroup>
              <col style="width:19%" /><col style="width:7%" /><col style="width:9%" />
              <col style="width:9%" /><col style="width:5%" /><col style="width:5%" />
              <col style="width:5%" /><col style="width:6%" /><col style="width:8%" />
              <col style="width:8%" /><col style="width:11%" /><col style="width:8%" />
            </colgroup>
            <thead>
              <tr>
                <th colspan="5">PROCUREMENT PROJECT DETAILS</th>
                <th colspan="3">PROJECTED TIMELINE (MM/DD/YYYY)</th>
                <th colspan="2">FUNDING DETAILS</th>
                <th rowspan="2">ATTACHED SUPPORTING DOCUMENTS</th>
                <th rowspan="2">REMARKS</th>
              </tr>
              <tr>
                <th>General Description and Objective of the Project to be Procured</th>
                <th>Type of the Project to be Procured (whether Goods, Infrastructure and Consulting Services)</th>
                <th>Quantity and Size of the Project to be Procured</th>
                <th>Recommended Mode of Procurement</th>
                <th>Pre-Procurement Conference, if applicable (Yes/No)</th>
                <th>Start of Procurement Activity</th>
                <th>End of Procurement Activity</th>
                <th>Expected Delivery/ Implementation Period</th>
                <th>Source of Funds</th>
                <th>Estimated Budget / Authorized Budgetary Allocation (PhP)</th>
              </tr>
              <tr>
                <th>Column 1</th><th>Column 2</th><th>Column 3</th><th>Column 4</th><th>Column 5</th>
                <th>Column 6</th><th>Column 7</th><th>Column 8</th><th>Column 9</th><th>Column 10</th>
                <th>Column 11</th><th>Column 12</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
              <tr class="total-row">
                <td colspan="9">TOTAL BUDGET:</td>
                <td class="num-col">${formatCurrencyDisplay(total)}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>

          <table class="sign-table">
            <tr>
              <td>
                Prepared by:
                <div class="sign-line"></div>
                <div class="sign-name">${unitName || "&nbsp;"}</div>
                <div class="sign-caption">Signature over Printed Name</div>
                <div class="sign-caption">${unitDesignationVal || "Position/Designation"}</div>
                <div class="sign-caption"><em>[End-User or Implementing Unit]</em></div>
                <div class="sign-date">Date: ___________________</div>
              </td>
              <td>
                Approved by:
                <div class="sign-line"></div>
                <div class="sign-name">${headUnitVal || "&nbsp;"}</div>
                <div class="sign-caption">Signature over Printed Name</div>
                <div class="sign-caption">${headDesignationVal || "Position/Designation"}</div>
                <div class="sign-caption"><em>[Head of the End-User or Implementing Unit]</em></div>
                <div class="sign-date">Date: ___________________</div>
              </td>
            </tr>
          </table>

          <table class="footer-table">
            <tr><td class="flabel">Transaction ID</td><td>${transactionId}</td></tr>
            <tr><td class="flabel">Signature</td><td>&nbsp;</td></tr>
          </table>
        </body></html>`;

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

  // ---------- Visitor counter ----------

  function animateVisitorCount(target) {
    const el = document.getElementById("visitorCount");
    if (!el) return;
    const start = 0;
    const duration = 1200;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = value.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString();
        el.classList.add("is-counting");
        setTimeout(() => el.classList.remove("is-counting"), 250);
      }
    }
    requestAnimationFrame(step);
  }

  function trackVisitorLocally() {
    const count =
      (parseInt(localStorage.getItem("ppmpVisitorCount"), 10) || 0) + 1;
    localStorage.setItem("ppmpVisitorCount", String(count));
    animateVisitorCount(count);
  }

  const SUPABASE_URL = "https://ttosgivhrncnxzjyndrk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_zuYJNUbaIk-hlr8WkEac6Q_tKvdN0Bo";

  function initVisitorCounter() {
    fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_counter`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ counter_key: "tup-manila-ppmp-site-visits" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Supabase request failed");
        return res.json();
      })
      .then((value) => animateVisitorCount(value))
      .catch(() => trackVisitorLocally());
  }

  // ---------- Init ----------

  loadState();
  if (!document.getElementById("fiscalYear").value) {
    document.getElementById("fiscalYear").value = nextYear;
  }
  renderTable();
  initVisitorCounter();
});
