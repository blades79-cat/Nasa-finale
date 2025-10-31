// APOD archive begins 1995-06-16
const earliestDate = "1995-06-16";
const todayISO = new Date().toISOString().split("T")[0];

// Sets up the date inputs: default last 9 days, clamped to archive → today
function setupDateInputs(startInput, endInput) {
  startInput.min = earliestDate; endInput.min = earliestDate;
  startInput.max = todayISO;     endInput.max = todayISO;

  const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 8);
  startInput.value = lastWeek.toISOString().split("T")[0];
  endInput.value = todayISO;

  startInput.addEventListener("change", () => {
    const s = new Date(startInput.value);
    const e = new Date(s); e.setDate(s.getDate() + 8);
    const cap = new Date(todayISO);
    endInput.value = (e > cap) ? todayISO : e.toISOString().split("T")[0];
  });
}
