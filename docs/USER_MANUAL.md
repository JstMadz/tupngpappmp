# PPMP Web App — User Manual

This guide walks through everyday use of the Project Procurement Management Plan (PPMP) tool. It's written for end users filling out a plan — for developer/technical documentation, see the main [README](../README.md).

## Contents

1. [Opening the app](#1-opening-the-app)
2. [Filling in Plan Information](#2-filling-in-plan-information)
3. [Filling in the Approving Official](#3-filling-in-the-approving-official)
4. [Adding a procurement project](#4-adding-a-procurement-project)
5. [Editing or deleting a project](#5-editing-or-deleting-a-project)
6. [Understanding the total budget](#6-understanding-the-total-budget)
7. [Saving your work automatically](#7-saving-your-work-automatically)
8. [Importing projects from a file](#8-importing-projects-from-a-file)
9. [Exporting to Excel / CSV](#9-exporting-to-excel--csv)
10. [Saving the plan as a PDF](#10-saving-the-plan-as-a-pdf)
11. [Printing the plan](#11-printing-the-plan)
12. [Clearing saved data](#12-clearing-saved-data)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Opening the app

Open the app's link in any modern browser (Chrome, Edge, Firefox, or Safari). No installation, login, or internet connection is required to fill out a plan — the page itself just needs to load once. A fresh internet connection is only needed the first time the page loads (it pulls a few small libraries), and to update the visitor counter in the footer.

If you were given the project as a folder of files instead of a link, you can also double-click `index.html` to open it directly in your browser — no setup needed.

## 2. Filling in Plan Information

At the top of the page, fill in:

| Field | Notes |
|---|---|
| **Fiscal Year** | Required. A 4-digit year, e.g. `2027`. Defaults to next year if left blank. |
| **End-User / Implementing Unit** | Required. Automatically converted to CAPITAL LETTERS as you type. |
| **Office** | Optional, but used to build the Transaction ID (see §10). |
| **Designation** | Optional — the End-User's position/title. |
| **PPMP No.** | Optional. Printed on the generated document if filled in. |
| **Plan Type** | Choose **Indicative** or **Final**. Printed as a checked box on the document. |

Fields marked with a red **\*** are required before you can add a project, save a PDF, or print.

## 3. Filling in the Approving Official

Under **Approving Official**, enter the **Head of Implementing Unit / Sector** (required) and pick their **Designation** from the dropdown. This appears in the "Approved by" signature block on the generated document.

## 4. Adding a procurement project

Fill out the **Add Procurement Project** form:

- **Description** — what's being procured (minimum 3 characters).
- **Procurement Type** — Goods, Infrastructure, or Consultancy.
- **Quantity / Size**.
- **Mode of Procurement**, **Pre-Procurement Conference** (Yes/No).
- **Start Date**, **End Date**, **Implementation Period** — click each field to open the date picker. The End Date and Implementation Period can't be earlier than the Start Date; the app will highlight the field in red if they are.
- **Source of Funds**.
- **Estimated Budget (₱)** — type digits; the field automatically formats them with comma separators as you type (e.g. `1500000` becomes `1,500,000.00`).
- **Supporting Documents** — check any that apply. If a document you need isn't listed, check **OTHERS** and type it in.
- **Remarks** — optional notes.

Click **➕ Add Project**. If anything required is missing or invalid, the offending field turns red with an explanation underneath it, and the form scrolls/focuses to the first one.

Once added, the project appears in the **Procurement Projects List** table below.

## 5. Editing or deleting a project

In the projects table, each row has:

- **✏️ Edit** — loads that project's data back into the form above and changes the **Add Project** button to **💾 Update Project**. Make your changes and click it to save, or edit a different field and click a different row's Edit to switch (the form always reflects whichever project you're currently editing).
- **🗑️ Delete** — asks for confirmation, then removes the row. If you were editing that exact project, the form resets.

## 6. Understanding the total budget

The **Total Budget** shown below the table is the sum of every project's Estimated Budget, recalculated automatically every time you add, edit, delete, or import projects.

## 7. Saving your work automatically

Everything you type — plan information and the project list — is saved automatically to your browser's local storage a fraction of a second after you stop typing, and again right before you close the tab. Reopening the page later (in the same browser, on the same device) restores exactly where you left off.

**This is not a shared save** — it lives only in the browser you used. It is not backed up anywhere else, does not sync between devices, and is lost if you clear your browser's site data. For anything you need to keep or share, use **Save as PDF** (§10) or **Export to Excel / CSV** (§9).

## 8. Importing projects from a file

Click **📤 Import CSV / TSV** to bulk-load projects from a `.csv`, `.tsv`, or `.xlsx`/`.xls` file (for example, a spreadsheet you built separately, or a file this app previously exported).

**Required columns:** Description, Quantity, Budget, and Start/End/Implementation dates in `MM/DD/YYYY` format. Rows missing any of these, or with an invalid date order, are skipped — you'll see a message telling you how many rows were imported and how many were skipped.

**Optional columns** (applied to the plan header if present): Fiscal Year, End-User/Implementing Unit, Office, Designation, PPMP No., Plan Type, Head of Implementing Unit/Sector, and their Designation.

Column names are matched flexibly (not case-sensitive, spacing/punctuation ignored) — e.g. "End User", "End-User", and "Implementing Unit" are all recognized as the same field.

**Importing replaces your current project list.** If you already have projects entered, you'll be asked to confirm before they're overwritten.

## 9. Exporting to Excel / CSV

Click **⬇️ Export to Excel / CSV** to download the current plan header and all projects as an `.xlsx` file (`PPMP_Projects.xlsx`). This is useful for keeping a working copy, sharing data with someone who needs to edit it in a spreadsheet, or re-importing later.

## 10. Saving the plan as a PDF

Click **💾 Save as PDF**. The app builds a landscape, letterhead-formatted PDF matching the official **TUPM-F-PRO-20-PMP** template — logo, header, the full projects table with totals, signature blocks, and a Transaction ID — and downloads it straight to your computer (typically your Downloads folder, or wherever your browser asks you to save files).

The Transaction ID is generated from your Office and End-User initials plus the current date/time, e.g. `TUPM-PO-PPMP-JD-01152027-0230PM`.

This requires the required Plan Information fields (§2) to be filled in and at least one project added — you'll get an error message pointing at what's missing otherwise.

## 11. Printing the plan

Click **🖨️ Print** to open a print-ready version of the document in a new browser tab, which then opens your browser's normal print dialog automatically. From there, pick your printer and print as usual — or, if you'd rather get a PDF this way instead of a printout, choose "Save as PDF" as the destination inside that dialog (though the dedicated **Save as PDF** button in §10 is the more direct way to do that).

If nothing happens when you click Print, your browser likely blocked the pop-up — look for a pop-up-blocked icon in the address bar and allow pop-ups for this site, then try again.

## 12. Clearing saved data

Click **🗑️ Clear Saved Data** to permanently erase the autosaved plan from this browser and reset the entire form. You'll be asked to confirm first. **This cannot be undone** — if you need to keep the data, export it (§9) or save it as a PDF (§10) first.

## 13. Troubleshooting

**A field won't let me submit / turns red.** Read the small red text under the field — it states exactly what's wrong (e.g. "End date cannot be earlier than start date").

**"Please allow pop-ups" when clicking Print.** Your browser blocked the new tab. Allow pop-ups for this site (usually a one-click option in the address bar) and click Print again.

**Import says "No valid rows found."** Check that your file has the required columns (Description, Quantity, Budget, and all three dates) and that dates are in `MM/DD/YYYY` format.

**I closed the tab and lost my work.** If you were on the same browser and device as before, your work should still be there when you reopen the page (§7). If you'd cleared your browser data, or used a different device/browser, it won't be recoverable — this is why it's worth exporting or saving a PDF of anything important.

**The visitor count in the footer looks wrong or stuck at a small number just for me.** That counter is shared across all visitors under normal conditions. If the app can't reach its counting service for any reason, it silently falls back to counting only your own visits to this browser, which will look much lower than the real total. This doesn't affect anything else in the app.
