// Manages the two dropdown/checkbox option lists (approving-official
// designations, supporting documents) and the "Supporting Documents" picker
// on the project form.
//
// Baseline options live in the HTML itself so the form works offline (e.g.
// opened via file://); loadFormOptions() lets data/form-options.json override
// them at runtime so the lists can be edited later without touching the code.
window.PPMP = window.PPMP || {};

window.PPMP.formOptions = (function () {
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

  function init() {
    loadFormOptions();
    document
      .getElementById("docsOthersCheck")
      .addEventListener("change", (e) => {
        const othersText = document.getElementById("docsOthersText");
        othersText.disabled = !e.target.checked;
        if (!e.target.checked) othersText.value = "";
      });
  }

  return { init, getSelectedDocs, setSelectedDocs };
})();
