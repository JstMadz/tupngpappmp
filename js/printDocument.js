// "Print": opens a print-formatted copy of the document in a new tab and
// hands off to the browser's native print dialog / the device's printer.
// Kept deliberately separate from pdfExport.js — this is for quick physical
// printing, not for saving a file (see docs/USER_MANUAL.md).
window.PPMP = window.PPMP || {};

window.PPMP.printDocument = (function () {
  const { projects } = window.PPMP.state;
  const { escapeHtml } = window.PPMP.text;
  const { formatCurrencyDisplay } = window.PPMP.currency;

  function init() {
    document.getElementById("printBtn").onclick = () => {
      const { prepareDocumentGeneration } = window.PPMP.documentGeneration;
      const { generate: generateTransactionId } = window.PPMP.transactionId;
      const { getPlanTypeLabel } = window.PPMP.planInfo;
      const { show: showToast } = window.PPMP.toast;

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
      const ppmpNoVal = escapeHtml(
        document.getElementById("ppmpNo").value || "",
      );
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
  }

  return { init };
})();
