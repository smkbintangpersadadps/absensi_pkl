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
// function navigateTo(pageId) {

//     // 1. RUN CLEANUP PAGE SEBELUMNYA
//     if (typeof pageCleanup === "function") {
//         try {
//             pageCleanup();
//         } catch (e) {
//             console.warn("Cleanup error:", e);
//         }
//         pageCleanup = null;
//     }

//     // 2. HIDE ALL PAGES
//     const pages = document.querySelectorAll("section[id^='page-']");
//     pages.forEach(p => p.classList.add("hidden-page"));

//     // 3. SHOW TARGET PAGE
//     const target = document.getElementById(pageId);
//     if (target) target.classList.remove("hidden-page");

//     // 4. TOGGLE LAYOUT
//     const layout = document.getElementById("layout-main");
//     if (layout) {
//         layout.classList.toggle("hidden-page", pageId === "page-login");
//     }

//     // 5. PAGE LOADER
//     runPageLoader(pageId);
//     setActiveNav(pageId); // 👈 panggil di sini
// }

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

    // 5. ACTIVE SIDEBAR MENU
    document.querySelectorAll(".sidebar-link").forEach(link => {
        link.classList.remove("active");
    });

    const activeLink = document.querySelector(`.sidebar-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add("active");
    }

    // 6. PAGE LOADER
    runPageLoader(pageId);

    // 7. ACTIVE NAV BAWAH / NAV LAINNYA
    if (typeof setActiveNav === "function") {
        setActiveNav(pageId);
    }
    console.log("NAVIGATE TO:", pageId);
    console.log("TARGET:", document.getElementById(pageId));
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

        case "page-wali-dashboard":
            setMonitoringMode?.(AppState.monitoringMode || "wali");
            break;

        case "page-wali-rekap":
            initRekapBulananPage?.();
            break;

        case "page-wali-history":
            setHistoryMode?.(AppState.historyMode || "wali");
            break;
        
        case "page-wali-approval":
            setApprovalMode?.(AppState.approvalMode || "wali");
            break;
                
        case "page-user-dashboard":
            loadUserDashboardStats?.();
            break;

        case "page-user-absen":
            // ONLY THIS ONE CONTROL CAMERA + GPS
            // initAbsenForm?.();
            // break;
            if (AppState.accessMode === "ortu") {
                showToast("Orang tua tidak memiliki akses absensi", true);
                navigateTo("page-user-dashboard");
                return;
            }

            initAbsenForm?.();
            break;
        
        case "page-user-status":
            initStatusHarianForm?.();
            break;

        case "page-user-status-history":
            loadStatusHistory?.(true);
            break;

        case "page-history":
            loadHistory(true);
            break;
        
        case "page-kepsek-dashboard":
            loadKepsekDashboard?.(true);
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
            <a href="#" data-page="page-wali-dashboard" onclick="navigateTo('page-wali-dashboard')"
                class="sidebar-link active">
                <i class="fa-solid fa-chart-line w-5"></i>
                <span>Dashboard Monitoring</span>
            </a>

            <a href="#" onclick="navigateTo('page-wali-approval')"
                class="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
                <i class="fa-solid fa-clipboard-check w-5"></i>
                <span>Approval Status</span>
            </a>

            <a href="#" onclick="navigateTo('page-wali-rekap')"
                class="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
                <i class="fa-solid fa-table-list w-5"></i>
                <span>Rekap Bulanan</span>
            </a>

            <a href="#" data-page="page-wali-history" onclick="navigateTo('page-wali-history')"
                class="sidebar-link">
                <i class="fa-solid fa-clock-rotate-left w-5"></i>
                <span>Riwayat</span>
            </a>
        `;
    }

    else if (role === "kepsek") {
        menu.innerHTML = `
            <a href="#" onclick="navigateTo('page-kepsek-dashboard')"
                class="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
                <i class="fa-solid fa-school w-5"></i>
                <span>Dashboard Kepsek</span>
            </a>

            <a href="#" onclick="navigateTo('page-wali-rekap')"
                class="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
                <i class="fa-solid fa-table-list w-5"></i>
                <span>Rekap Bulanan</span>
            </a>
        `;
    }

    else {
        if (AppState.accessMode === "ortu") {
            menu.innerHTML = `
                <a href="#" onclick="navigateTo('page-user-dashboard')">Dashboard</a>
                <a href="#" onclick="navigateTo('page-history')">Riwayat</a>
            `;
        } else {
            menu.innerHTML = `
                <a href="#" onclick="navigateTo('page-user-dashboard')">Dashboard</a>
                <a href="#" onclick="navigateTo('page-user-absen')">Absen</a>
                <a href="#" onclick="navigateTo('page-user-status')">Konfirmasi Kehadiran</a>
                <a href="#" onclick="navigateTo('page-user-status-history')"
                    class="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
                    <i class="fa-solid fa-list-check w-5"></i>
                    <span>Riwayat Status</span>
                </a>
                <a href="#" onclick="navigateTo('page-history')">Riwayat</a>
            `;
        }
    }
}

function setActiveNav(pageId) {
    const map = {
        "page-user-dashboard": 0,
        "page-user-absen": 1,
        "page-user-status": 2,
        "page-user-status-history": 3,
        "page-history": 4
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

function buildMobileBottomMenu(user) {

    const menu = document.getElementById("mobile-bottom-menu");

    if (!menu || !user) return;

    const role = user.role;

    // ===============================
    // ADMIN
    // ===============================
    if (role === "admin") {

        menu.innerHTML = `
            <button onclick="navigateTo('page-admin-dashboard')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">

                <i class="fa-solid fa-chart-line text-lg"></i>
                <span>Dashboard</span>
            </button>

            <button onclick="navigateTo('page-admin-users')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">

                <i class="fa-solid fa-users text-lg"></i>
                <span>User</span>
            </button>

            <button onclick="navigateTo('page-history')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">

                <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                <span>Riwayat</span>
            </button>
        `;
    }

    // ===============================
    // WALI / PEMBIMBING
    // ===============================
    else if (role === "wali") {

        menu.innerHTML = `
            <button onclick="navigateTo('page-wali-dashboard')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">

                <i class="fa-solid fa-chart-line text-lg"></i>
                <span>Monitoring</span>
            </button>

            <button onclick="navigateTo('page-wali-approval')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-clipboard-check text-lg"></i>
                <span>Approval</span>
            </button>

            <button onclick="navigateTo('page-wali-rekap')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-table-list text-lg"></i>
                <span>Rekap</span>
            </button>

            <button onclick="navigateTo('page-wali-history')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">

                <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                <span>Riwayat</span>
            </button>
        `;
    }

    // ===============================
    // KEPALA SEKOLAH
    // ===============================
    else if (role === "kepsek") {

        menu.innerHTML = `
            <button onclick="navigateTo('page-kepsek-dashboard')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">

                <i class="fa-solid fa-school text-lg"></i>
                <span>Kepsek</span>
            </button>

            <button onclick="navigateTo('page-wali-rekap')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-table-list text-lg"></i>
                <span>Rekap</span>
            </button>
        `;
    }

    // ===============================
    // SISWA
    // ===============================
    else {
        if (AppState.accessMode === "ortu") {
            menu.innerHTML = `
                <button onclick="navigateTo('page-user-dashboard')" class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-house text-lg"></i>
                    <span>Home</span>
                </button>

                <button onclick="navigateTo('page-history')" class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    <span>Riwayat</span>
                </button>
            `;
        } else {
            menu.innerHTML = `
                <button onclick="navigateTo('page-user-dashboard')" class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-house text-lg"></i>
                    <span>Home</span>
                </button>

                <button onclick="navigateTo('page-user-absen')" class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-camera text-lg"></i>
                    <span>Absen</span>
                </button>

                <button onclick="navigateTo('page-user-status')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-calendar-check text-lg"></i>
                    <span>Status</span>
                </button>

                <button onclick="navigateTo('page-user-status-history')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-list-check text-lg"></i>
                    <span>Approval</span>
                </button>

                <button onclick="navigateTo('page-history')" class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    <span>Riwayat</span>
                </button>
            `;
        }
    }
}
