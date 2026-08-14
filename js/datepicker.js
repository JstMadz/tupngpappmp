// Wires up AirDatepicker on every ".month-picker" field and keeps the
// end-date/implementation pickers' minimum date in sync with the start date.
window.PPMP = window.PPMP || {};

window.PPMP.datepicker = (function () {
  const { parseFullDate } = window.PPMP.dates;
  const { nextYear } = window.PPMP.config;

  const AIR_DATEPICKER_LOCALE_EN = {
    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    monthsShort: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    today: "Today",
    clear: "Clear",
    dateFormat: "MM/dd/yyyy",
    timeFormat: "hh:mm aa",
    firstDay: 0,
  };

  const datePickers = {};

  function init() {
    document.querySelectorAll(".month-picker").forEach((el) => {
      const instance = new AirDatepicker(el, {
        locale: AIR_DATEPICKER_LOCALE_EN,
        dateFormat: "MM/dd/yyyy",
        isMobile: true,
        autoClose: true,
        buttons: ["today", "clear"],
        onSelect: ({ date }) => {
          el.dispatchEvent(new Event("blur"));
          if (el.id === "startDate" && date instanceof Date) {
            if (datePickers.endDate) datePickers.endDate.update({ minDate: date });
            if (datePickers.implementation) {
              datePickers.implementation.update({ minDate: date });
            }
          }
        },
      });
      instance.selectDate(new Date(nextYear, 0, 1), { silent: true });
      datePickers[el.id] = instance;
    });
  }

  function syncDatePicker(id, value) {
    const instance = datePickers[id];
    if (!instance) return;
    const date = parseFullDate(value);
    if (date) instance.selectDate(date, { silent: true });
    else instance.clear({ silent: true });
  }

  return { init, syncDatePicker };
})();
