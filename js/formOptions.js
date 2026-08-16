// Manages the two dropdown/checkbox option lists (approving-official
// designations, supporting documents) and the "Supporting Documents"
// checklist on the project form.
//
// The supporting-documents checklist is split into cards per Procurement
// Type (Goods, Consultancy, Infrastructure), plus two extra checklists that
// appear conditionally on top of whichever card is showing:
//   - Certificate of Exclusivity, when Type is Goods and Mode of
//     Procurement is "Direct Contracting" (the GPPB mode reserved for
//     proprietary/sole-source goods).
//   - The "funded by another agency" checklist, toggled manually since no
//     existing Source of Funds option maps cleanly to "another agency".
//
// Baseline options live in the HTML itself so the form works offline (e.g.
// opened via file://); loadFormOptions() lets data/form-options.json override
// them at runtime so the lists can be edited later without touching the code.
// To add a document to an existing type, edit its array in that JSON file —
// no code changes needed.
window.PPMP = window.PPMP || {};

window.PPMP.formOptions = (function () {
  let docsCardGoods,
    docsCardConsultancy,
    docsCardInfrastructure,
    docsGroupGoods,
    docsGroupConsultancy,
    docsGroupInfrastructure,
    docsExclusiveDealerBlock,
    docsGroupExclusiveDealer,
    otherAgencyFundingToggle,
    docsGroupOtherAgencyFunding;

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

  function populateDocsGroup(container, options) {
    if (!container || !Array.isArray(options)) return;
    const checkedValues = new Set(
      Array.from(container.querySelectorAll(".docs-checkbox:checked")).map(
        (el) => el.value,
      ),
    );
    container.innerHTML = "";
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
      container.appendChild(item);
    });
  }

  function populateSupportingDocs(groups) {
    populateDocsGroup(docsGroupGoods, groups.Goods);
    populateDocsGroup(docsGroupConsultancy, groups.Consultancy);
    populateDocsGroup(docsGroupInfrastructure, groups.Infrastructure);
    populateDocsGroup(docsGroupExclusiveDealer, groups.exclusiveDealer);
    populateDocsGroup(docsGroupOtherAgencyFunding, groups.otherAgencyFunding);
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
        data.supportingDocuments &&
        typeof data.supportingDocuments === "object" &&
        !Array.isArray(data.supportingDocuments)
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

  function setGroupChecked(container, checked) {
    if (!container) return;
    container
      .querySelectorAll(".docs-checkbox")
      .forEach((cb) => (cb.checked = checked));
  }

  // Shows the checklist card matching the selected Procurement Type (hiding
  // and clearing the other two), and shows the Certificate of Exclusivity
  // checklist only when Type is Goods and Mode is Direct Contracting.
  function updateDocsVisibility() {
    const type = document.getElementById("type").value;
    const mode = document.getElementById("mode").value;

    [
      { card: docsCardGoods, group: docsGroupGoods, match: type === "Goods" },
      {
        card: docsCardConsultancy,
        group: docsGroupConsultancy,
        match: type === "Consultancy",
      },
      {
        card: docsCardInfrastructure,
        group: docsGroupInfrastructure,
        match: type === "Infrastructure",
      },
    ].forEach(({ card, group, match }) => {
      card.hidden = !match;
      if (!match) setGroupChecked(group, false);
    });

    const showExclusive = type === "Goods" && mode === "Direct Contracting";
    docsExclusiveDealerBlock.hidden = !showExclusive;
    if (!showExclusive) setGroupChecked(docsGroupExclusiveDealer, false);
  }

  function updateOtherAgencyFundingVisibility() {
    const show = otherAgencyFundingToggle.checked;
    docsGroupOtherAgencyFunding.hidden = !show;
    if (!show) setGroupChecked(docsGroupOtherAgencyFunding, false);
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
    const segments = String(docsString || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const segmentValues = new Set(segments.map((s) => s.toUpperCase()));

    // The "funded by another agency" toggle has no field of its own — infer
    // it from whether docsString contains any of its checklist items, and do
    // this BEFORE the visibility pass below so that group is actually shown
    // (and its checkboxes are valid match candidates) when we get to them.
    const otherAgencyValues = Array.from(
      docsGroupOtherAgencyFunding.querySelectorAll(".docs-checkbox"),
    ).map((cb) => cb.value.toUpperCase());
    otherAgencyFundingToggle.checked = otherAgencyValues.some((v) =>
      segmentValues.has(v),
    );

    // Reflect Type/Mode/toggle, so the right cards exist (and are visible)
    // before we go looking for boxes to check.
    updateDocsVisibility();
    updateOtherAgencyFundingVisibility();

    document
      .querySelectorAll(".docs-checkbox")
      .forEach((cb) => (cb.checked = false));
    const othersCheck = document.getElementById("docsOthersCheck");
    const othersText = document.getElementById("docsOthersText");
    othersCheck.checked = false;
    othersText.value = "";
    othersText.disabled = true;

    // Several documents (e.g. "PURCHASE REQUEST") appear with the same
    // value in more than one card. Only match against checkboxes that are
    // currently visible, so a value restores into the card that's actually
    // relevant right now instead of always the first matching card in the
    // DOM (which would always be the Goods card).
    const knownCheckboxes = Array.from(
      document.querySelectorAll(".docs-checkbox"),
    ).filter((cb) => cb.offsetParent !== null);
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
    docsCardGoods = document.getElementById("docsCardGoods");
    docsCardConsultancy = document.getElementById("docsCardConsultancy");
    docsCardInfrastructure = document.getElementById("docsCardInfrastructure");
    docsGroupGoods = document.getElementById("docsGroupGoods");
    docsGroupConsultancy = document.getElementById("docsGroupConsultancy");
    docsGroupInfrastructure = document.getElementById(
      "docsGroupInfrastructure",
    );
    docsExclusiveDealerBlock = document.getElementById(
      "docsExclusiveDealerBlock",
    );
    docsGroupExclusiveDealer = document.getElementById(
      "docsGroupExclusiveDealer",
    );
    otherAgencyFundingToggle = document.getElementById(
      "otherAgencyFundingToggle",
    );
    docsGroupOtherAgencyFunding = document.getElementById(
      "docsGroupOtherAgencyFunding",
    );

    loadFormOptions();

    document
      .getElementById("docsOthersCheck")
      .addEventListener("change", (e) => {
        const othersText = document.getElementById("docsOthersText");
        othersText.disabled = !e.target.checked;
        if (!e.target.checked) othersText.value = "";
      });

    document
      .getElementById("type")
      .addEventListener("change", updateDocsVisibility);
    document
      .getElementById("mode")
      .addEventListener("change", updateDocsVisibility);
    otherAgencyFundingToggle.addEventListener(
      "change",
      updateOtherAgencyFundingVisibility,
    );

    updateDocsVisibility();
  }

  return { init, getSelectedDocs, setSelectedDocs };
})();
