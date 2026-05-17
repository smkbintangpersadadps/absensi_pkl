// ===============================
// NAVIGATION.JS (STABLE VERSION)
// ===============================

// Lifecycle hooks (aman)
const PageLifecycle = {
    onEnter: {},
    onLeave: {}
};

// optional global cleanup handler
let pageCleanup = null;

// ===============================
// NAVIGATE PAGE
// ===============================
function navigateTo(pageId) {

    // 1. RUN CLEANUP PAGE SEBELUMNYA
    if (typeof pageCleanup === "function") {
        try {
            pageCleanup();
        } catch (e) {
            console.warn("Cleanup error:", e);
        }
        pageCleanup = null;
    }

    // 2. HIDE ALL PAGES
    const pages = document.querySelectorAll("section[id^='page-']");
    pages.forEach(p => p.classList.add("hidden-page"));

    // 3. SHOW TARGET PAGE
    const target = document.getElementById(pageId);
    if (target) target.classList.remove("hidden-page");

    // 4. TOGGLE LAYOUT
    const layout = document.getElementById("layout-main");
    if (layout) {
        layout.classList.toggle("hidden-page", pageId === "page-login");
    }

    // 5. PAGE LOADER
    runPageLoader(pageId);
    setActiveNav(pageId); // 👈 panggil di sini
}

// ===============================
// PAGE LOADER (SAFE VERSION)
// ===============================
function runPageLoader(pageId) {

    // ===============================
    // ALWAYS CLEANUP FIRST
    // ===============================
    if (typeof stopCamera === "function") {
        stopCamera();
    }

    // ===============================
    // ROUTING PAGE INIT
    // ===============================
    switch (pageId) {

        case "page-admin-dashboard":
            loadAdminDashboardStats?.();
            break;

        case "page-admin-users":
            loadUsers?.();
            break;

        case "page-admin-settings":
            populateLocationSettingsForm?.();
            break;

        case "page-user-dashboard":
            loadUserDashboardStats?.();
            break;

        case "page-user-absen":
            // ONLY THIS ONE CONTROL CAMERA + GPS
            initAbsenForm?.();
            break;

        case "page-history":
            loadHistory?.();
            break;
    }
}

// ===============================
// MENU BUILDER (ROLE BASED)
// ===============================
function buildMenu(user) {
    const menu = document.getElementById("nav-menu");
    if (!menu || !user) return;

    const role = user.role;

    if (role === "admin") {
        menu.innerHTML = `
            <a href="#" onclick="navigateTo('page-admin-dashboard')">Dashboard</a>
            <a href="#" onclick="navigateTo('page-admin-users')">Kelola User</a>
            <a href="#" onclick="navigateTo('page-history')">Rekap Absensi</a>
            <a href="#" onclick="navigateTo('page-admin-settings')">Pengaturan</a>
        `;
    }

    else if (role === "wali") {
        menu.innerHTML = `
            <a href="#" onclick="navigateTo('page-wali-dashboard')">Dashboard</a>
            <a href="#" onclick="navigateTo('page-wali-monitoring')">Monitoring Siswa</a>
            <a href="#" onclick="navigateTo('page-wali-approval')">Approval Izin</a>
            <a href="#" onclick="navigateTo('page-history')">Riwayat</a>
        `;
    }

    else {
        // siswa
        menu.innerHTML = `
            <a href="#" onclick="navigateTo('page-user-dashboard')">Dashboard</a>
            <a href="#" onclick="navigateTo('page-user-absen')">Absen</a>
            <a href="#" onclick="navigateTo('page-history')">Riwayat</a>
        `;
    }
}

function setActiveNav(pageId) {
    const map = {
        "page-user-dashboard": 0,
        "page-user-absen": 1,
        "page-history": 2
    };

    const index = map[pageId];

    document.querySelectorAll(".bottom-nav").forEach((btn, i) => {
        if (i === index) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}
