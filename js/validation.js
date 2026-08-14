// Field-level and form-level validation for both the project entry form and
// the plan-information header. Also wires the live input formatters
// (uppercase-as-you-type, currency grouping) and blur-triggered validators.
window.PPMP = window.PPMP || {};

window.PPMP.validation = (function () {
  const { parseCurrency, formatCurrencyLive } = window.PPMP.currency;
  const { parseFullDate } = window.PPMP.dates;
  const { uppercaseLive } = window.PPMP.text;

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

  function validateProjectForm() {
    const { getSelectedDocs } = window.PPMP.formOptions;
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

  function init() {
    document.querySelectorAll(".error-message").forEach((span) => {
      const inputId = span.id.replace(/Error$/, "");
      const input = document.getElementById(inputId);
      if (input) input.setAttribute("aria-describedby", span.id);
    });

    window.PPMP.config.UPPERCASE_FIELD_IDS.forEach((id) => {
      document.getElementById(id).addEventListener("input", uppercaseLive);
    });

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
        validateRequiredText(
          "headUnit",
          "Head of Implementing Unit / Sector",
          1,
        ),
      );
  }

  return {
    init,
    setFieldError,
    validateRequiredText,
    validateBudgetField,
    validateDateField,
    validateDateOrder,
    validateImplementationOrder,
    validateFiscalYear,
    validateProjectForm,
    validateHeaderForm,
  };
})();
