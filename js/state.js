// Single source of truth for in-memory app state: the project list and which
// row (if any) is currently being edited. Other modules read/mutate `projects`
// directly (always in place — push/splice/length=0 — so every module sees the
// same list) and go through the getter/setter for editIndex.
window.PPMP = window.PPMP || {};

window.PPMP.state = (function () {
  const projects = [];
  let editIndex = null;

  function getEditIndex() {
    return editIndex;
  }

  function setEditIndex(value) {
    editIndex = value;
  }

  return { projects, getEditIndex, setEditIndex };
})();
