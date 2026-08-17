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
// NAVIGASI
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
            RekapBulananService.init(true);
            break;
        case "page-wali-history":
            HistoryService.init(true);
            break;
        
        case "page-wali-approval":
            setApprovalMode?.(AppState.approvalMode || "wali");
            break;
                
        case "page-user-dashboard":
            loadUserDashboardStats?.();
            break;
        case "page-user-absen":
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
            KepsekDashboardService.init(true);
            break;
        case "page-master-siswa":
            loadMasterSiswa();
            break;
        case "page-master-lokasi":
            loadMasterLokasi();
            break;
        case "page-kepsek-hari-libur":
            initHariLiburPage();
            break;
        case "page-user-profile":
            loadProfile();
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
            <a href="#"
                data-page="page-wali-dashboard"
                onclick="navigateTo('page-wali-dashboard'); return false;"
                class="sidebar-link active">
                <i class="fa-solid fa-chart-line w-5"></i>
                <span>Dashboard Monitoring</span>
            </a>
            <a href="#"
                data-page="page-wali-approval"
                onclick="navigateTo('page-wali-approval'); return false;"
                class="sidebar-link">
                <i class="fa-solid fa-clipboard-check w-5"></i>
                <span>Approval Status</span>
            </a>
            <a href="#"
                data-page="page-wali-rekap"
                onclick="navigateTo('page-wali-rekap'); return false;"
                class="sidebar-link">
                <i class="fa-solid fa-table-list w-5"></i>
                <span>Rekap Bulanan</span>
            </a>
            <a href="#"
                data-page="page-wali-history"
                onclick="navigateTo('page-wali-history'); return false;"
                class="sidebar-link">
                <i class="fa-solid fa-clock-rotate-left w-5"></i>
                <span>Monitoring Harian</span>
            </a>
        `;
    }
    else if (role === "kepsek") {
        menu.innerHTML = `
            <a href="#"
                data-page="page-kepsek-dashboard"
                onclick="navigateTo('page-kepsek-dashboard'); return false;"
                class="sidebar-link active">
                <i class="fa-solid fa-school w-5"></i>
                <span>Dashboard Kepsek</span>
            </a>
            <a href="#"
                data-page="page-wali-rekap"
                onclick="navigateTo('page-wali-rekap'); return false;"
                class="sidebar-link">
                <i class="fa-solid fa-table-list w-5"></i>
                <span>Rekap Bulanan</span>
            </a>
            <a href="#"
                data-page="page-master-siswa"
                onclick="navigateTo('page-master-siswa'); return false;"
                class="sidebar-link">
                <i class="fa-solid fa-user w-5"></i>
                <span>Data Siswa</span>
            </a>
            <a href="#"
                data-page="page-master-lokasi"
                onclick="navigateTo('page-master-lokasi'); return false;"
                class="sidebar-link">
                <i class="fa-solid fa-building w-5"></i>
                <span>Data Lokasi PKL</span>
            </a>
            <a href="#"
                data-page="page-kepsek-hari-libur"
                onclick="navigateTo('page-kepsek-hari-libur'); return false;"
                class="sidebar-link">
                <i class="fa-solid fa-calendar-xmark w-5"></i>
                <span>Data Hari Libur</span>
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
                <a href="#" onclick="navigateTo('page-user-status-history')">Riwayat Status</a>
                <a href="#" onclick="navigateTo('page-history')">Riwayat</a>
                <a href="#" onclick="navigateTo('page-user-profile')">Profil</a>
            `;
        }
    }
}

// =========================================================
// ACTIVE PAGE - MOBILE BOTTOM NAV
// =========================================================
function setActiveNav(pageId) {
    if (!pageId) {
        return;
    }
    // =====================================================
    // HAPUS ACTIVE DARI SEMUA MENU
    // =====================================================
    document
        .querySelectorAll(
            "#mobile-bottom-menu .bottom-nav, " +
            "#mobile-bottom-menu .bottom-nav-kep"
        )
        .forEach(btn => {
            btn.classList.remove(
                "active",
                "text-indigo-600",
                "text-gray-500"
            );
        });
    // =====================================================
    // CARI MENU BERDASARKAN DATA-PAGE
    // =====================================================
    const activeButton =
        document.querySelector(
            `#mobile-bottom-menu [data-page="${pageId}"]`
        );
    if (!activeButton) {
        return;
    }
    // =====================================================
    // ACTIVE
    // =====================================================
    activeButton.classList.add(
        "active",
        "text-indigo-600"
    );
    activeButton.classList.remove(
        "text-gray-500"
    );

}
// =========================================================
// MOBILE BOTTOM MENU
// =========================================================
function buildMobileBottomMenu(user) {
    const menu =
        document.getElementById(
            "mobile-bottom-menu"
        );
    if (!menu || !user) {
        return;
    }
    const role =
        String(
            user.role || ""
        )
        .trim()
        .toLowerCase();
    // =====================================================
    // ADMIN
    // =====================================================
    if (role === "admin") {
        menu.innerHTML = `
            <button
                type="button"
                data-page="page-admin-dashboard"
                onclick="navigateTo('page-admin-dashboard')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-chart-line text-lg"></i>
                <span>
                    Dashboard
                </span>
            </button>
            <button
                type="button"
                data-page="page-admin-users"
                onclick="navigateTo('page-admin-users')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-users text-lg"></i>
                <span>
                    User
                </span>
            </button>
            <button
                type="button"
                data-page="page-history"
                onclick="navigateTo('page-history')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                <span>
                    Riwayat
                </span>
            </button>
        `;
    }
    // =====================================================
    // WALI
    // =====================================================
    else if (role === "wali") {
        menu.innerHTML = `
            <button
                type="button"
                data-page="page-wali-dashboard"
                onclick="navigateTo('page-wali-dashboard')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-chart-line text-lg"></i>
                <span>
                    Monitoring
                </span>
            </button>
            <button
                type="button"
                data-page="page-wali-approval"
                onclick="navigateTo('page-wali-approval')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-clipboard-check text-lg"></i>
                <span>
                    Approval
                </span>
            </button>
            <button
                type="button"
                data-page="page-wali-rekap"
                onclick="navigateTo('page-wali-rekap')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-table-list text-lg"></i>
                <span>
                    Rekap
                </span>
            </button>
            <button
                type="button"
                data-page="page-wali-history"
                onclick="navigateTo('page-wali-history')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                <span>
                    Monitoring Harian
                </span>
            </button>
        `;
    }
    // =====================================================
    // PEMBIMBING
    // =====================================================
    else if (role === "pembimbing") {
        menu.innerHTML = `
            <button
                type="button"
                data-page="page-wali-dashboard"
                onclick="navigateTo('page-wali-dashboard')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-chart-line text-lg"></i>
                <span>
                    Monitoring
                </span>
            </button>
            <button
                type="button"
                data-page="page-wali-approval"
                onclick="navigateTo('page-wali-approval')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-clipboard-check text-lg"></i>
                <span>
                    Approval
                </span>
            </button>
            <button
                type="button"
                data-page="page-wali-rekap"
                onclick="navigateTo('page-wali-rekap')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-table-list text-lg"></i>
                <span>
                    Rekap
                </span>
            </button>
            <button
                type="button"
                data-page="page-wali-history"
                onclick="navigateTo('page-wali-history')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                <span>
                    Monitoring Harian
                </span>
            </button>
        `;
    }
    // =====================================================
    // KEPALA SEKOLAH
    // =====================================================
    else if (role === "kepsek") {
        menu.innerHTML = `
            <button
                type="button"
                data-page="page-kepsek-dashboard"
                onclick="navigateTo('page-kepsek-dashboard')"
                class="bottom-nav-kep flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-school text-lg"></i>
                <span>
                    Kepsek
                </span>
            </button>
            <button
                type="button"
                data-page="page-wali-rekap"
                onclick="navigateTo('page-wali-rekap')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-table-list text-lg"></i>
                <span>
                    Rekap
                </span>
            </button>
            <button
                type="button"
                data-page="page-master-siswa"
                onclick="navigateTo('page-master-siswa')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-user-graduate text-lg"></i>
                <span>
                    Siswa
                </span>
            </button>
            <button
                type="button"
                data-page="page-master-lokasi"
                onclick="navigateTo('page-master-lokasi')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-location-dot text-lg"></i>
                <span>
                    Lokasi
                </span>
            </button>
            <button
                type="button"
                data-page="page-kepsek-hari-libur"
                onclick="navigateTo('page-kepsek-hari-libur')"
                class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                <i class="fa-solid fa-calendar-plus text-lg"></i>
                <span>
                    Libur
                </span>
            </button>
        `;
    }
    // =====================================================
    // SISWA
    // =====================================================
    else {
        // =================================================
        // ORANG TUA
        // =================================================
        if (
            AppState.accessMode === "ortu"
        ) {
            menu.innerHTML = `
                <button
                    type="button"
                    data-page="page-user-dashboard"
                    onclick="navigateTo('page-user-dashboard')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-house text-lg"></i>
                    <span>
                        Home
                    </span>
                </button>
                <button
                    type="button"
                    data-page="page-history"
                    onclick="navigateTo('page-history')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    <span>
                        Riwayat
                    </span>
                </button>
            `;
        }
        // =================================================
        // SISWA
        // =================================================
        else {
            menu.innerHTML = `
                <button
                    type="button"
                    data-page="page-user-dashboard"
                    onclick="navigateTo('page-user-dashboard')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-house text-lg"></i>
                    <span>
                        Home
                    </span>
                </button>
                <button
                    type="button"
                    data-page="page-user-absen"
                    onclick="navigateTo('page-user-absen')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-camera text-lg"></i>
                    <span>
                        Absen
                    </span>
                </button>
                <button
                    type="button"
                    data-page="page-user-status"
                    onclick="navigateTo('page-user-status')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-calendar-check text-lg"></i>
                    <span>
                        Status
                    </span>
                </button>
                <button
                    type="button"
                    data-page="page-user-status-history"
                    onclick="navigateTo('page-user-status-history')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-list-check text-lg"></i>
                    <span>
                        Approval
                    </span>
                </button>
                <button
                    type="button"
                    data-page="page-history"
                    onclick="navigateTo('page-history')"
                    class="bottom-nav flex flex-col items-center text-xs text-gray-500 transition">
                    <i class="fa-solid fa-clock-rotate-left text-lg"></i>
                    <span>
                        Riwayat
                    </span>
                </button>
            `;
        }
    }
    // =====================================================
    // SET ACTIVE PAGE SAAT MENU SELESAI DIBUAT
    // =====================================================
    const activePage =
        document.querySelector(
            ".page.active, .page:not(.hidden-page)"
        );
    if (activePage) {
        setActiveNav(
            activePage.id
        );
    }
}
