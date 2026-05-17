function showToast(message, isError = false) {
  alert(message);
}

function showLoader(text = "Loading...") {
  console.log(text);
}

function hideLoader() {}

// ===============================
// DATE HELPER
// ===============================

function parseDateID(dateStr) {
    if (!dateStr) return new Date();

    const [datePart, timePart] = dateStr.split(" ");
    const [d, m, y] = datePart.split("/");

    return new Date(`${y}-${m}-${d}T${timePart || "00:00:00"}`);
}

function formatTodayID() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();

    return `${d}/${m}/${y}`;
}

