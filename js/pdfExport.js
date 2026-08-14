// "Save as PDF": builds the PPMP document with jsPDF + AutoTable and
// downloads it directly (no print dialog, no browser rendering involved —
// see docs/USER_MANUAL.md for why this replaced the old print-to-PDF flow).
window.PPMP = window.PPMP || {};

window.PPMP.pdfExport = (function () {
  const { projects } = window.PPMP.state;

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

  function init() {
    document.getElementById("savePdfBtn").onclick = async () => {
      const { prepareDocumentGeneration } = window.PPMP.documentGeneration;
      const { generate: generateTransactionId } = window.PPMP.transactionId;
      const { getPlanTypeLabel } = window.PPMP.planInfo;
      const { formatCurrencyDisplay } = window.PPMP.currency;
      const { show: showToast } = window.PPMP.toast;

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
          doc.text(
            row[0],
            margin + logoW + orgW + 2,
            rowY + headerRowH / 2 + 1.3,
          );
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
          53.4, 19.7, 25.3, 25.3, 14.1, 14.1, 14.1, 16.9, 22.5, 22.5, 30.9,
          22.5,
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
  }

  return { init };
})();
