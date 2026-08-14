// Excel/CSV export, and CSV/TSV/Excel import (including the delimited-text
// parser and the header-row-to-field mapping used to interpret arbitrary
// spreadsheet exports).
window.PPMP = window.PPMP || {};

window.PPMP.importExport = (function () {
  const { projects } = window.PPMP.state;
  const { parseCurrency } = window.PPMP.currency;
  const { parseFullDate } = window.PPMP.dates;

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
    const { validateFiscalYear, validateRequiredText } = window.PPMP.validation;

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

  function initExport() {
    document.getElementById("exportExcel").onclick = () => {
      const { show: showToast } = window.PPMP.toast;
      const { getPlanTypeLabel } = window.PPMP.planInfo;

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
  }

  function initImport() {
    const importFileInput = document.getElementById("importFile");
    document
      .getElementById("importFileBtn")
      .addEventListener("click", () => importFileInput.click());

    importFileInput.addEventListener("change", async () => {
      const { showConfirm } = window.PPMP.confirmModal;
      const { show: showToast } = window.PPMP.toast;
      const { saveState } = window.PPMP.persistence;
      const { resetProjectForm, renderTable } = window.PPMP.projectsTable;

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
        resetProjectForm();

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
  }

  function init() {
    initExport();
    initImport();
  }

  return { init };
})();
