// ===============================
// MAIN APP INIT
// ===============================

window.onload = function () {
    initializeApp();
    loadRememberedUsername?.();
};

function initializeApp() {
    try {

        // pastikan AppState ada
        if (typeof AppState === "undefined") {
            console.error("AppState belum terdefinisi");
            navigateTo("page-login");
            return;
        }

        restoreSession();

    } catch (error) {
        console.error("Init error:", error);
        navigateTo("page-login");
    }
}

function restoreSession() {
    try {
        const savedUser = localStorage.getItem("absen_user");
        const savedSettings = localStorage.getItem("absen_settings");

        if (!savedUser || !savedSettings) {
            navigateTo("page-login");
            return;
        }

        AppState.currentUser = JSON.parse(savedUser);
        AppState.appSettings = JSON.parse(savedSettings);

        setupUserInterface();

    } catch (error) {
        console.error("Restore session gagal:", error);

        localStorage.removeItem("absen_user");
        localStorage.removeItem("absen_settings");

        navigateTo("page-login");
    }
}

// ===============================
// SESSION TIMEOUT
// ===============================
let sessionTimer = null;
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 menit

function startSessionTimer() {
    clearTimeout(sessionTimer);

    if (!AppState.currentUser) return;

    sessionTimer = setTimeout(() => {
        autoLogoutByTimeout();
    }, SESSION_TIMEOUT);
}

function resetSessionTimer() {
    if (!AppState.currentUser) return;
    startSessionTimer();
}

function stopSessionTimer() {
    clearTimeout(sessionTimer);
    sessionTimer = null;
}

function autoLogoutByTimeout() {
    AppState.currentUser = null;
    AppState.currentUserLocation = null;
    AppState.currentLocation = null;

    localStorage.removeItem("absen_user");
    localStorage.removeItem("absen_settings");

    if (typeof stopCamera === "function") {
        stopCamera();
    }

    Swal.fire({
        icon: "warning",
        title: "Sesi Berakhir",
        text: "Anda logout otomatis karena tidak ada aktivitas selama 5 menit.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5"
    }).then(() => {
        navigateTo("page-login");
        loadRememberedUsername?.();
    });
}

["click", "mousemove", "keydown", "touchstart", "scroll"].forEach(eventName => {
    document.addEventListener(eventName, resetSessionTimer, true);
});

function resetAppCache() {

    Swal.fire({
        title: "Reset Cache?",
        text: "Data sementara aplikasi akan dibersihkan.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Reset",
        cancelButtonText: "Batal",
        confirmButtonColor: "#f59e0b"
    }).then((result) => {

        if (!result.isConfirmed) return;

        try {

            // STOP CAMERA
            stopCamera?.();

            // CLEAR TEMP STATE
            capturedPhoto = null;

            currentLocation = null;

            AppState.currentUserLocation = null;

            // OPTIONAL STORAGE
            localStorage.removeItem("absen_settings");

            // RESET GPS UI
            document.getElementById("gps-status").innerText = "-";
            document.getElementById("gps-distance").innerText = "-";

            // RESET PREVIEW
            const preview = document.getElementById("foto-preview");

            if (preview) {
                preview.src = "";
                preview.classList.add("hidden");
            }

            Swal.fire({
                icon: "success",
                title: "Cache berhasil dibersihkan",
                text: "Aplikasi akan dimuat ulang",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {

                location.reload();

            });

        } catch (error) {

            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Gagal reset cache"
            });
        }
    });
}

function updateTopbarClock() {
    const now = new Date();

    const timeEl = document.getElementById("topbar-time");
    const dateEl = document.getElementById("topbar-date");

    if (!timeEl || !dateEl) return;

    timeEl.textContent = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    dateEl.textContent = now.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

setInterval(updateTopbarClock, 1000);
updateTopbarClock();