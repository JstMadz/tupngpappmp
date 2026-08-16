// App-wide constants: storage keys, field lists, and the visitor-counter backend.
// No DOM access here — safe to load first, before anything else depends on it.
window.PPMP = window.PPMP || {};

window.PPMP.config = (function () {
  const STORAGE_KEY = "ppmp_ngpa_v3_state";

  // Must match the literal string in the inline bootstrap script at the top
  // of index.html's <head> — that script runs before this file loads, so it
  // can't reference this constant, only duplicate its value.
  const THEME_STORAGE_KEY = "ppmp_theme_preference";

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

  const nextYear = new Date().getFullYear() + 1;

  // Self-hosted Supabase counter (see docs/USER_MANUAL.md for how it's secured).
  // The publishable key is meant to be public; it can only call increment_counter(),
  // not read or write the underlying table directly.
  const SUPABASE_URL = "https://ttosgivhrncnxzjyndrk.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_zuYJNUbaIk-hlr8WkEac6Q_tKvdN0Bo";
  const SUPABASE_COUNTER_KEY = "tup-manila-ppmp-site-visits";

  return {
    STORAGE_KEY,
    THEME_STORAGE_KEY,
    HEADER_FIELD_IDS,
    UPPERCASE_FIELD_IDS,
    nextYear,
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_COUNTER_KEY,
  };
})();
