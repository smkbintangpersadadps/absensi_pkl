// ===============================
// MAIN APP INIT
// ===============================

window.onload = function () {
    initializeApp();
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