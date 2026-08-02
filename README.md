# PPMP Web App

A browser-based tool for creating and managing a **Project Procurement Management Plan (PPMP)** for the Technological University of the Philippines - Manila. It runs entirely client-side (no backend/server required) and lets a unit fill out plan details, add procurement projects, and export or print a formatted PPMP document.

## Features

- **Plan Information & Approving Official** — capture fiscal year, implementing unit, plan type (Indicative/Final), and the approving official's name/designation.
- **Procurement Project Entries** — add projects with description, procurement type, quantity, mode of procurement, pre-procurement conference, start/end/implementation dates (month-year picker), source of funds, estimated budget, supporting documents, and remarks.
- **Form Validation** — required-field and format checks (e.g. valid fiscal year, budget, date order) with inline error messages.
- **Import** — bulk-load projects from CSV, TSV, or a previously exported Excel/CSV file.
- **Export** — download the current plan as an Excel/CSV file.
- **Print / Save as PDF** — generate a print-ready, letterhead-formatted version of the PPMP with signature blocks.
- **Autosave** — plan data is saved to the browser's `localStorage` so it persists across page reloads.

## Tech Stack

- Vanilla HTML, CSS, and JavaScript — no build step required.
- [Flatpickr](https://flatpickr.js.org/) for the month/year date pickers.
- [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs) for Excel/CSV import and export.
- Google Fonts (Poppins).

## Project Structure

```
.
├── index.html              # App markup
├── style.css                # Styling
├── script.js                 # App logic (validation, import/export, print, persistence)
├── data/
│   └── form-options.json     # Configurable dropdown/checkbox options
└── assets/
    └── tup_logo.png           # University logo
```

## Getting Started

This is a static site — no installation or build step is needed.

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/tupngpappmp.git
   cd tupngpappmp
   ```
2. Open `index.html` directly in a browser, or serve it locally, e.g.:
   ```bash
   npx serve .
   ```

## Usage

1. Fill in the **Plan Information** and **Approving Official** sections.
2. Use the **Add Procurement Project** form to add one or more projects to the plan, or click **Import CSV / TSV** to bulk-import projects from a file.
3. Review the projects list and total budget in the table.
4. Click **Export to Excel / CSV** to download the data, or **Print / Save as PDF** to generate a signed, letterhead-formatted document.
5. Click **Clear Saved Data** to reset the form and remove the autosaved plan from local storage.

### Import format

Imported files should include the columns: Description, Quantity, Budget, and Start/End/Implementation dates (`MM/YYYY`). If present, Fiscal Year, End-User/Implementing Unit, Office, Designation, Plan Type, and Head of Implementing Unit/Sector & Designation columns will also be applied to the plan header.
