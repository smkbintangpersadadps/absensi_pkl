// // ===============================
// // NAVIGATION.JS
// // Handle page switching + menu builder
// // Support role:
// // - admin
// // - wali
// // - siswa
// // ===============================


// // ===============================
// // NAVIGATE PAGE
// // ===============================
// const PageLifecycle = {
//     onLeave: {},
//     onEnter: {}
// };

// function navigateTo(pageId) {

//     // ===============================
//     // RUN CLEANUP PAGE SEBELUMNYA
//     // ===============================
//     Object.values(PageLifecycle.onLeave || {}).forEach(fn => {
//         try { fn?.(); } catch (e) {}
//     });

//     // ===============================
//     // HIDE ALL PAGE
//     // ===============================
//     const pages = [
//         "page-login",
//         "page-admin-dashboard",
//         "page-admin-users",
//         "page-history",
//         "page-admin-settings",
//         "page-user-dashboard",
//         "page-user-absen"
//     ];

//     pages.forEach(id => {
//         document.getElementById(id)?.classList.add("hidden-page");
//     });

//     document.getElementById(pageId)?.classList.remove("hidden-page");

//     // layout toggle
//     document.getElementById("layout-main")?.classList.toggle(
//         "hidden-page",
//         pageId === "page-login"
//     );

//     // ===============================
//     // RUN PAGE INIT
//     // ===============================
//     runPageLoader(pageId);
// }


// // ===============================
// // PAGE AUTO LOADER
// // ===============================
// function runPageLoader(pageId) {
//     // 🔴 selalu stop kamera dulu saat pindah page
//     stopCamera?.();

//     switch (pageId) {

//         case "page-admin-dashboard":
//             loadAdminDashboardStats?.();
//             break;

//         case "page-admin-users":
//             loadUsers?.();
//             break;

//         case "page-admin-settings":
//             populateLocationSettingsForm?.();
//             break;

//         case "page-user-dashboard":
//             loadUserDashboardStats?.();
//             break;

//         case "page-user-absen":
//             initAbsenForm?.();
//             startCamera?.(); // optional start di sini
//             startGPS?.();
//             break;

//         case "page-history":
//             loadHistoryData?.();
//             break;
//     }
// }


// // ===============================
// // ADMIN MENU
// // ===============================
// function buildAdminMenu() {
//     const menu = document.getElementById("nav-menu");

//     menu.innerHTML = `
//         <a href="#" onclick="navigateTo('page-admin-dashboard')" class="nav-link">
//             Dashboard
//         </a>

//         <a href="#" onclick="navigateTo('page-admin-users')" class="nav-link">
//             Kelola User
//         </a>

//         <a href="#" onclick="navigateTo('page-history')" class="nav-link">
//             Rekap Absensi
//         </a>

//         <a href="#" onclick="navigateTo('page-admin-settings')" class="nav-link">
//             Pengaturan Lokasi
//         </a>
//     `;
// }


// // ===============================
// // WALI MENU
// // ===============================
// function buildWaliMenu() {
//     const menu = document.getElementById("nav-menu");

//     menu.innerHTML = `
//         <a href="#" onclick="navigateTo('page-wali-dashboard')" class="nav-link">
//             Dashboard
//         </a>

//         <a href="#" onclick="navigateTo('page-wali-monitoring')" class="nav-link">
//             Monitoring Siswa
//         </a>

//         <a href="#" onclick="navigateTo('page-wali-approval')" class="nav-link">
//             Approval Izin
//         </a>

//         <a href="#" onclick="navigateTo('page-history')" class="nav-link">
//             Riwayat
//         </a>
//     `;
// }


// // ===============================
// // SISWA MENU
// // ===============================
// function buildSiswaMenu() {
//     const menu = document.getElementById("nav-menu");

//     menu.innerHTML = `
//         <a href="#" onclick="navigateTo('page-user-dashboard')" class="nav-link">
//             Dashboard
//         </a>

//         <a href="#" onclick="navigateTo('page-user-absen')" class="nav-link">
//             Mulai Absen
//         </a>

//         <a href="#" onclick="navigateTo('page-history')" class="nav-link">
//             Riwayat Saya
//         </a>
//     `;
// }

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
    document.querySelectorAll(".bottom-nav button")
        .forEach(btn => btn.classList.remove("nav-active"));

    // highlight sederhana berdasarkan page
    if (pageId === "page-user-dashboard") {
        document.querySelector('[onclick*="page-user-dashboard"]')
            ?.classList.add("nav-active");
    }

    if (pageId === "page-user-absen") {
        document.querySelector('[onclick*="page-user-absen"]')
            ?.classList.add("nav-active");
    }

    if (pageId === "page-history") {
        document.querySelector('[onclick*="page-history"]')
            ?.classList.add("nav-active");
    }
}