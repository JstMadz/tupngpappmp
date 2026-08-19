<div align="center">

<img src="assets/tup_logo.png" alt="TUP Logo" width="96" />

# PPMP Web App

A browser-based tool for creating and managing a **Project Procurement Management Plan (PPMP)** for the Technological University of the Philippines – Manila.

[![Made with](https://img.shields.io/badge/made%20with-HTML%2FCSS%2FJS-e34c26?logo=html5&logoColor=white)](#tech-stack)
[![No build step](https://img.shields.io/badge/build%20step-none-success)](#tech-stack)
[![License](https://img.shields.io/badge/license-unlicensed-lightgrey)](#license)

[Features](#features) •
[Tech Stack](#tech-stack) •
[Project Structure](#project-structure) •
[Getting Started](#getting-started) •
[Usage](#usage) •
[User Manual](docs/USER_MANUAL.md)

</div>

---

It runs entirely client-side (no backend/server required) and lets a unit fill out plan details, add procurement projects, and export, save, or print a formatted PPMP document that follows the official **TUPM-F-PRO-20-PMP** template.

> For step-by-step instructions aimed at end users (not developers), see the **[User Manual](docs/USER_MANUAL.md)**.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
  - [Why plain scripts instead of ES modules or a bundler](#why-plain-scripts-instead-of-es-modules-or-a-bundler)
  - [Editing dropdown & checklist options](#editing-dropdown--checklist-options)
  - [Adding a new feature](#adding-a-new-feature)
- [Getting Started](#getting-started)
- [Usage](#usage)
  - [Import format](#import-format)
- [License](#license)

## Features

- **Plan Information & Approving Official** — capture fiscal year, implementing unit, plan type (Indicative/Final), PPMP number, and the approving official's name/designation.
- **Procurement Project Entries** — add projects with description, procurement type, quantity, mode of procurement, pre-procurement conference, start/end/implementation dates, source of funds, estimated budget, supporting documents, and remarks.
- **Supporting Documents checklist** — a separate checklist card per Procurement Type (Goods & Services, Consultancy, Infrastructure), plus two checklists that appear automatically when relevant: **Certificate of Exclusivity** (Goods + "Direct Contracting" mode) and the extra documents required when a project is **funded by another agency**. The lists are data-driven from `data/form-options.json` — see [Editing dropdown & checklist options](#editing-dropdown--checklist-options) below.
- **Form Validation** — required-field and format checks (valid fiscal year, budget, date order) with inline error messages.
- **Autosave** — plan data is saved to the browser's `localStorage` so it persists across page reloads.
- **Import** — bulk-load projects from CSV, TSV, or a previously exported Excel file.
- **Export to Excel / CSV** — download the current plan as a spreadsheet.
- **Save as PDF** — generate and download a signed, letterhead-formatted PDF of the PPMP, built directly with a PDF library (no print dialog involved).
- **Print** — open a print-ready version in a new tab and hand off to the browser's print dialog / the device's printer.
- **Visitor counter** — a lifetime visit count in the footer, backed by a self-hosted Supabase counter with a local-storage fallback.
- **Light / Dark / System theme** — a switcher in the header remembers your choice in `localStorage` and, on "System", follows the OS setting live (including if it changes while the page is open). Applied before first paint, so there's no flash of the wrong theme.

## Tech Stack

- Vanilla HTML, CSS, and JavaScript — no build step, no bundler, no framework.
- [Air Datepicker](https://air-datepicker.com/) for the date fields.
- [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs) for Excel/CSV import and export.
- [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) for generating the downloadable PDF.
- [Supabase](https://supabase.com/) (Postgres + auto REST API) for the visitor counter backend.
- Google Fonts (Poppins).

All of the above are loaded from CDNs in `index.html` — there is nothing to `npm install`.

> **Browser support:** any modern evergreen browser (Chrome, Edge, Firefox, Safari). The app relies on CSS Grid/Flexbox, `fetch`, and ES2015+ syntax; Internet Explorer is not supported.

## Project Structure

```text
.
├── index.html                    # App markup + script/stylesheet loading order
├── css/
│   └── style.css                  # All styling
├── js/
│   ├── main.js                     # Entry point — wires up every module on DOMContentLoaded
│   ├── config.js                    # Constants: storage keys, field lists, Supabase config
│   ├── state.js                      # In-memory app state (project list, current edit index)
│   ├── utils/
│   │   ├── text.js                    # escapeHtml, getInitials, uppercase-as-you-type
│   │   ├── currency.js                 # Peso formatting/parsing, live currency input
│   │   └── dates.js                     # Date string parsing (MM/DD/YYYY)
│   ├── datepicker.js                # Air Datepicker setup + start/end/implementation sync
│   ├── formOptions.js               # Designation/supporting-doc option lists + checkboxes
│   ├── toast.js                     # Toast notifications
│   ├── confirmModal.js              # Custom confirm() dialog
│   ├── validation.js                # All field/form validators + their event wiring
│   ├── persistence.js               # localStorage autosave/restore + "Clear Saved Data"
│   ├── transactionId.js             # Transaction ID generation
│   ├── planInfo.js                  # Reads the Indicative/Final plan-type selection
│   ├── projectsTable.js             # Renders the table; add/edit/delete a project
│   ├── importExport.js              # CSV/TSV/Excel import + Excel export
│   ├── documentGeneration.js        # Shared pre-flight checks for PDF export and Print
│   ├── pdfExport.js                 # "Save as PDF" — builds the PDF with jsPDF + AutoTable
│   ├── printDocument.js             # "Print" — opens a print-formatted tab and calls print()
│   └── visitorCounter.js            # Supabase-backed visit counter + local fallback
├── docs/
│   └── USER_MANUAL.md             # End-user instructions
├── data/
│   └── form-options.json          # Editable dropdown/checkbox option lists
└── assets/
    └── tup_logo.png               # University logo
```

### Why plain scripts instead of ES modules or a bundler

Each `js/*.js` file attaches its public functions to a single shared `window.PPMP` namespace (e.g. `window.PPMP.validation.validateHeaderForm`) instead of using `import`/`export`. This is deliberate: browsers refuse to load `type="module"` scripts over the `file://` protocol (a CORS restriction), which would break directly double-clicking `index.html` — something this app explicitly supports. Plain `<script>` tags don't have that restriction, so the app stays fully buildless while still being split into focused, single-responsibility files.

### Editing dropdown & checklist options

`data/form-options.json` drives two parts of the form with no code changes required:

- `headDesignations` — the options in the Approving Official's **Designation** dropdown.
- `supportingDocuments` — the Supporting Documents checklist, grouped by key: `Goods`, `Consultancy`, `Infrastructure`, `exclusiveDealer` (Certificate of Exclusivity, shown for Goods + Direct Contracting), and `otherAgencyFunding` (shown when a project is funded by another agency).

To add, remove, or reword an entry, edit its array in that file and refresh the page — `js/formOptions.js` fetches it on startup (`loadFormOptions()`) and silently falls back to the defaults baked into `index.html` if the file can't be loaded (e.g. a stricter local setup where `fetch` can't read local files).

### Adding a new feature

1. Create `js/yourFeature.js` that assigns its functions to `window.PPMP.yourFeature = (function () { ... return {...}; })();`.
2. Add `<script src="js/yourFeature.js"></script>` in `index.html`, before `js/main.js`.
3. Call `window.PPMP.yourFeature.init()` (if it needs one) from `js/main.js`.

Modules talk to each other only through their returned public functions (never by reaching into another file's internals), and shared state always goes through `js/state.js`.

## Getting Started

This is a static site — no installation or build step is needed.

1. Clone the repository:
   ```bash
   git clone https://github.com/JstMadz/PPMP_NGPA_v3.git
   cd PPMP_NGPA_v3
   ```
2. Open `index.html` directly in a browser, or serve it locally, e.g.:
   ```bash
   npx serve .
   ```

## Usage

1. Fill in the **Plan Information** and **Approving Official** sections.
2. Use the **Add Procurement Project** form to add one or more projects to the plan, or click **Import CSV / TSV** to bulk-import projects from a file.
3. Review the projects list and total budget in the table.
4. Click **Save as PDF** to download a signed, letterhead-formatted PDF, **Print** to send it straight to a printer, or **Export to Excel / CSV** to download the raw data.
5. Click **Clear Saved Data** to reset the form and remove the autosaved plan from local storage.

See the **[User Manual](docs/USER_MANUAL.md)** for detailed, screenshot-free walkthroughs of every feature, including the CSV/TSV import format and troubleshooting tips.

### Import format

Imported files should include the columns: Description, Quantity, Budget, and Start/End/Implementation dates (`MM/DD/YYYY`). If present, Fiscal Year, End-User/Implementing Unit, Office, Designation, Plan Type, and Head of Implementing Unit/Sector & Designation columns will also be applied to the plan header.

## License

No license has been declared for this repository yet — all rights are reserved by default. Add a `LICENSE` file to open-source it.

<div align="right">

[Back to top ↑](#ppmp-web-app)

</div>
