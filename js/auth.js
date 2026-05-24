// ===============================
// AUTH.JS (PRODUCTION READY)
// ===============================

// Ensure global state exists
window.AppState = window.AppState || {
    currentUser: null,
    appSettings: null,
    riwayat: []
};

// ===============================
// LOGIN
// ===============================
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("login-username")?.value?.trim();
    const password = document.getElementById("login-password")?.value?.trim();

    if (!username || !password) {
        showToast("Username dan password wajib diisi", true);
        return;
    }

    try {
        // ===============================
        // SHOW LOADER
        // ===============================
        showLoading();

        // ===============================
        // API LOGIN
        // ===============================
        const user = await ApiService.call({
            action: "login",
            username,
            password
        });

        const settings = await ApiService.call({
            action: "get_settings"
        });

        // ===============================
        // SET APP STATE
        // ===============================
        AppState.currentUser = user;

        AppState.appSettings = {
            lat: parseFloat(settings?.lat || 0),
            lng: parseFloat(settings?.lng || 0),
            radius: parseInt(settings?.radius || 0)
        };

        // ===============================
        // SAVE SESSION
        // ===============================
        localStorage.setItem("absen_user", JSON.stringify(AppState.currentUser));
        localStorage.setItem("absen_settings", JSON.stringify(AppState.appSettings));

        // ===============================
        // BUILD UI
        // ===============================
        const remember =
        document.getElementById("remember-username")?.checked;
        if (remember) {
            localStorage.setItem(
                "remember_username",
                username
            );
        } else {
            localStorage.removeItem(
                "remember_username"
            );
        }

        Swal.fire({
            icon: "success",
            title: "Login Berhasil",
            text: `Selamat datang, ${user.nama}`,
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true    // opsional: bar timer
        }).then(() => {
            startSessionTimer();
            setupUserInterface?.();
        });

        

    } catch (error) {
        console.error("Login error:", error);
        showToast(error.message || "Login gagal", true);

    } finally {
        hideLoading();
    }
}

// ===============================
// LOGOUT
// ===============================
// function logout() {

//     AppState.currentUser = null;

//     localStorage.removeItem("absen_user");
//     localStorage.removeItem("absen_settings");

//     // STOP CAMERA WAJIB
//     if (typeof stopCamera === "function") {
//         stopCamera();
//     }

//     // optional reset UI
//     document.getElementById("login-form")?.reset();

//     navigateTo("page-login");

//     showToast("Berhasil logout");
// }

function logout() {
    Swal.fire({
        title: "Keluar dari aplikasi?",
        text: "Sesi login Anda akan diakhiri.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, Logout",
        cancelButtonText: "Batal",
        confirmButtonColor: "#ef4444"
    }).then((result) => {
        if (result.isConfirmed) {

            // STOP SESSION TIMER
            stopSessionTimer?.();
            
            AppState.currentUser = null;
            AppState.currentUserLocation = null;
            AppState.currentLocation = null;

            localStorage.removeItem("absen_user");
            localStorage.removeItem("absen_settings");

            if (typeof stopCamera === "function") {
                stopCamera();
            }

            document.getElementById("login-form")?.reset();

            Swal.fire({
                icon: "success",
                title: "Berhasil Logout",
                timer: 2000,
                showConfirmButton: false,
                timerProgressBar: true    // opsional: bar timer
            }).then(() => {
                navigateTo("page-login");
                loadRememberedUsername?.();
            });
        }
    });
}

// ===============================
// REMEMBER USERNAME
// ===============================
function loadRememberedUsername() {
    const savedUsername = localStorage.getItem("remember_username");

    if (savedUsername) {
        const usernameInput = document.getElementById("login-username");
        const rememberCheck = document.getElementById("remember-username");

        if (usernameInput) usernameInput.value = savedUsername;
        if (rememberCheck) rememberCheck.checked = true;
    }
}

// ===============================
// RESTORE SESSION
// ===============================
function restoreSession() {
    try {
        const savedUser = localStorage.getItem("absen_user");
        const savedSettings = localStorage.getItem("absen_settings");

        if (!savedUser) {
            navigateTo("page-login");
            return;
        }

        AppState.currentUser = JSON.parse(savedUser);

        if (savedSettings) {
            AppState.appSettings = JSON.parse(savedSettings);
        }

        if (typeof setupUserInterface === "function") {
            setupUserInterface();
        }

    } catch (error) {
        console.error("Restore session error:", error);

        localStorage.removeItem("absen_user");
        localStorage.removeItem("absen_settings");

        navigateTo("page-login");
    }
}

// ===============================
// UI SETUP ROLE
// ===============================
function setupUserInterface() {
    const user = AppState.currentUser;

    if (!user) {
        navigateTo("page-login");
        return;
    }

    // ===============================
    // ROLE MAP
    // ===============================
    const roleMap = {
        admin: "Administrator",
        wali: "Wali / Pembimbing",
        siswa: "Siswa"
    };

    const roleLabel = roleMap[user.role] || user.role;

    // ===============================
    // SAFE DOM HELPERS
    // ===============================
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    const setShow = (id, show) => {
        const el = document.getElementById(id);
        if (!el) return;
        show ? el.classList.remove("hidden-page") : el.classList.add("hidden-page");
    };

    // ===============================
    // SIDEBAR (DESKTOP)
    // ===============================
    setText("nav-user-name", user.nama);
    const avatarDesktop = document.getElementById("nav-user-avatar-desktop");
        if (avatarDesktop) {
            avatarDesktop.innerText = user.nama?.charAt(0)?.toUpperCase() || "U";
        }
    setText("nav-user-role", `Level : ${roleLabel}`);

    const kategoriEl = document.getElementById("nav-user-kategori");
    if (kategoriEl) {
        if (user.kategori && user.kategori !== "-") {
            kategoriEl.innerText = `Kelas : ${user.kategori}`;
            kategoriEl.classList.remove("hidden-page");
        } else {
            kategoriEl.classList.add("hidden-page");
        }
    }

    // ===============================
    // MOBILE HEADER
    // ===============================
    setText("nav-user-name-mobile", user.nama);
    setText("nav-user-role-mobile", roleLabel);

    const avatarEl = document.getElementById("nav-user-avatar");
    if (avatarEl) {
        avatarEl.innerText = user.nama?.charAt(0)?.toUpperCase() || "U";
    }

    // ===============================
    // MENU BUILDER (ROLE BASED)
    // ===============================
    if (typeof buildMenu === "function") {
        buildMenu(user);
    }
    buildMobileBottomMenu?.(user);

    // ===============================
    // ROUTING BY ROLE
    // ===============================
    switch (user.role) {

        case "admin":
            navigateTo("page-admin-dashboard");
            break;

        case "wali":
            showLoader("Memuat data siswa...");
            navigateTo("page-wali-dashboard");
            break;

        case "siswa":
            pilihModeSiswaOrtu();
            break;

        default:
            showToast("Role tidak dikenali", true);
            logout();
            break;
    }
}

function showLoading() {

  document
    .getElementById("loadingOverlay")
    .classList.add("show");
}

function hideLoading() {

  document
    .getElementById("loadingOverlay")
    .classList.remove("show");
}

function showLoader(text = "Memeriksa data...") {
    const overlay = document.getElementById("loadingOverlay");
    const textEl = document.querySelector("#loadingOverlay .loading-text");

    if (textEl) {
        textEl.innerText = text;
    }

    if (overlay) {
        overlay.classList.add("show");
    }
}

function hideLoader() {
    const overlay = document.getElementById("loadingOverlay");

    if (overlay) {
        overlay.classList.remove("show");
    }
}

function togglePassword() {

    const input = document.getElementById("login-password");
    const icon = document.getElementById("toggle-password-icon");

    if (!input || !icon) return;

    if (input.type === "password") {

        input.type = "text";

        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");

    } else {

        input.type = "password";

        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}