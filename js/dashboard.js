// ===============================
// WALI DASHBOARD
// ===============================
function setMonitoringMode(mode) {

    AppState.monitoringMode = mode;

    const btnWali =
        document.getElementById("btn-mode-wali");

    const btnPembimbing =
        document.getElementById("btn-mode-pembimbing");

    // RESET STYLE
    btnWali?.classList.remove(
        "bg-indigo-600",
        "text-white"
    );

    btnPembimbing?.classList.remove(
        "bg-indigo-600",
        "text-white"
    );

    btnWali?.classList.add(
        "bg-slate-100",
        "text-slate-700"
    );

    btnPembimbing?.classList.add(
        "bg-slate-100",
        "text-slate-700"
    );

    // ACTIVE STYLE
    if (mode === "wali") {

        btnWali?.classList.remove(
            "bg-slate-100",
            "text-slate-700"
        );

        btnWali?.classList.add(
            "bg-indigo-600",
            "text-white"
        );

    } else {

        btnPembimbing?.classList.remove(
            "bg-slate-100",
            "text-slate-700"
        );

        btnPembimbing?.classList.add(
            "bg-indigo-600",
            "text-white"
        );
    }

    // RELOAD DASHBOARD
    loadWaliDashboard?.(true);
}

async function loadWaliDashboard(useLoader = false) {

    try {

        const user = AppState.currentUser;

        if (!user) return;

        if (useLoader) {
            showLoader("Memuat data siswa...");
        }

        if (!AppState.monitoringMode) {
            AppState.monitoringMode = "wali";
        }

        const data = await ApiService.call({
            action: "get_monitoring_dashboard",
            mode: AppState.monitoringMode,
            username: user.username,
            kategori: user.kategori
        });

        const siswa = data.siswa || [];
        const riwayat = data.riwayat || [];
        const contentBox = document.getElementById("wali-dashboard-content");
        const emptyBox = document.getElementById("wali-dashboard-empty");

            if (contentBox) contentBox.classList.remove("hidden");
            if (emptyBox) {
                emptyBox.classList.add("hidden");
                emptyBox.innerHTML = "";
            }

        if (AppState.monitoringMode === "wali" && siswa.length === 0) {
            if (contentBox) contentBox.classList.add("hidden");

            if (emptyBox) {
                emptyBox.classList.remove("hidden");
                emptyBox.innerHTML = `
                    <p>
                        Tidak memiliki siswa yang sedang PKL sebagai <b>Wali Kelas</b>.
                    </p>

                    <button onclick="setMonitoringMode('pembimbing')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Pembimbing PKL
                    </button>
                `;
            }

            return;
        }

        if (AppState.monitoringMode === "pembimbing" && siswa.length === 0) {
            if (contentBox) contentBox.classList.add("hidden");

            if (emptyBox) {
                emptyBox.classList.remove("hidden");
                emptyBox.innerHTML = `
                    <p>
                        Anda tidak sedang menjadi <b>Pembimbing PKL</b>.
                    </p>

                    <button onclick="setMonitoringMode('wali')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Wali Kelas
                    </button>
                `;
            }

            return;
        }

        const today = new Date();

        const todayStr =
            today.getDate().toString().padStart(2, "0") + "/" +
            (today.getMonth() + 1).toString().padStart(2, "0") + "/" +
            today.getFullYear();

        // ===============================
        // SISWA SUDAH HADIR
        // ===============================
        const hadirHariIni = riwayat.filter(r =>
            r.timestamp?.startsWith(todayStr) &&
            r.tipe === "Masuk"
        );

        const hadirUsernames = new Set(
            hadirHariIni.map(r => r.username)
        );

        // ===============================
        // SISWA BELUM HADIR
        // ===============================
        const belumHadir = siswa.filter(s =>
            !hadirUsernames.has(s.username)
        );

        // ===============================
        // SUMMARY
        // ===============================
        document.getElementById(
            "wali-total-siswa"
        ).innerText = siswa.length;

        document.getElementById(
            "wali-sudah-hadir"
        ).innerText = hadirHariIni.length;

        document.getElementById(
            "wali-belum-hadir"
        ).innerText = belumHadir.length;

        // ===============================
        // COUNTER BADGE
        // ===============================
        document.getElementById(
            "wali-belum-count"
        ).innerText = `${belumHadir.length} siswa`;

        document.getElementById(
            "wali-hadir-count"
        ).innerText = `${hadirHariIni.length} siswa`;

        // ===============================
        // BELUM HADIR LIST
        // ===============================
        const belumList =
            document.getElementById(
                "wali-belum-list"
            );

        if (belumList) {

            if (!belumHadir.length) {

                belumList.innerHTML = `
                    <div class="text-sm text-green-600">
                        Semua siswa sudah hadir
                    </div>
                `;

            } else {

                belumList.innerHTML =
                    belumHadir.map(s => `

                        <div class="border rounded-xl p-3">

                            <div class="font-medium text-slate-800">
                                ${s.nama}
                            </div>

                            <div class="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                                <span>${s.kategori}</span>
                                <span>•</span>
                                <a href="${s.mapsUrl || '#'}"
                                    target="_blank"
                                    class="text-indigo-600 hover:underline">
                                    <i class="fa-solid fa-location-dot"></i>
                                    ${s.namaIndustri || "Belum diatur"}
                                </a>
                            </div>
                        </div>
                    `).join("");
            }
        }

        // ===============================
        // SUDAH HADIR LIST
        // ===============================
        const hadirList =
            document.getElementById(
                "wali-hadir-list"
            );

        if (hadirList) {

            if (!hadirHariIni.length) {

                hadirList.innerHTML = `
                    <div class="text-sm text-slate-500">
                        Belum ada siswa hadir
                    </div>
                `;

            } else {

                hadirList.innerHTML =
                    hadirHariIni.map(r => `

                        <div class="border rounded-xl p-3">

                            <div class="flex items-center justify-between">

                                <div>

                                    <div class="font-medium text-slate-800">
                                        ${r.nama}
                                    </div>

                                    <div class="text-xs text-slate-500 mt-1">
                                        ${r.kategori}
                                    </div>

                                </div>

                                <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                    Hadir
                                </span>

                            </div>

                            <div class="mt-2 text-xs text-slate-500">
                                ${r.timestamp}
                            </div>

                        </div>

                    `).join("");
            }
        }

    } catch (error) {

        console.error(
            "Wali dashboard error:",
            error
        );

        showToast(
            "Gagal memuat dashboard wali",
            true
        );
    } finally {
        hideLoader();
    }

}
// ===============================
// MODE SISWA
// ===============================
function pilihModeSiswaOrtu() {
        Swal.fire({
        title: "Pilih Akses",
        text: "Masuk sebagai siswa atau orang tua?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Siswa",
        cancelButtonText: "Orang Tua",
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#16a34a",
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            AppState.accessMode = "siswa";
        } else {
            AppState.accessMode = "ortu";
        }

        buildMenu(AppState.currentUser);
        buildMobileBottomMenu?.(AppState.currentUser);

        showLoader("Memuat dashboard...");

        navigateTo("page-user-dashboard");
    });
}
// ===============================
// USER DASHBOARD
// ===============================

async function loadUserDashboardStats() {
    try {
        const user = AppState.currentUser;
        if (!user) return;

        if (!AppState.currentUserLocation && user.lokasiId) {
            await loadUserLocation();
        }

        const riwayat = await ApiService.call({
            action: "get_riwayat",
            role: user.role,
            username: user.username
        });
        

        // ===============================
        // REQUIRED UI CHECK
        // ===============================
        const requiredUI = [
            "ui-status-hari",
            "ui-masuk",
            "ui-pulang",
            "ui-total-hadir",
            "ui-total-masuk",
            "ui-total-pulang",
            "ui-progress-kehadiran",
            "ui-persentase",
            "ui-last-absen"
        ];

        const missing = requiredUI.filter(id => !document.getElementById(id));

        if (missing.length > 0) {
            console.warn("Dashboard UI missing:", missing);
            return; // STOP supaya tidak error
        }

        // ===============================
        // SAFE DOM HELPERS
        // ===============================
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        };

        const setHTML = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = value;
        };

        const setWidth = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.style.width = value;
        };

        // ===============================
        // VALIDATE DATA
        // ===============================
        if (!Array.isArray(riwayat)) {
            console.warn("Riwayat bukan array:", riwayat);
            return;
        }
        

        // ===============================
        // FORMAT TODAY
        // ===============================
        const today = new Date();

        const todayStr =
            today.getDate().toString().padStart(2, "0") + "/" +
            (today.getMonth() + 1).toString().padStart(2, "0") + "/" +
            today.getFullYear();

        // ===============================
        // FILTER DATA
        // ===============================
        const todayData = riwayat.filter(r =>
            r?.timestamp?.startsWith(todayStr)
        );

        const thisMonth = riwayat.filter(r => {
            if (!r?.timestamp) return false;

            const d = parseDateID(r.timestamp);

            return (
                d &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear()
            );
        });

        // ===============================
        // STATUS HARI INI
        // ===============================
        const masukToday = todayData.find(r => r.tipe === "Masuk");
        const pulangToday = todayData.find(r => r.tipe === "Pulang");

        const statusHari =
            todayData.length > 0 ? "Hadir" : "Belum Absen";

        // ===============================
        // RINGKASAN BULAN
        // ===============================
        const totalHadir = new Set(
            thisMonth
                .filter(r => r.tipe === "Masuk")
                .map(r => r.timestamp.split(" ")[0])
        ).size;

        const totalMasuk =
            thisMonth.filter(r => r.tipe === "Masuk").length;

        const totalPulang =
            thisMonth.filter(r => r.tipe === "Pulang").length;

        // ===============================
        // PROGRESS
        // ===============================
        const targetHari = 22;

        const progress =
            targetHari > 0
                ? Math.min((totalHadir / targetHari) * 100, 100)
                : 0;

        // ===============================
        // LAST ABSEN
        // ===============================
        const last = riwayat[0];

        // ===============================
        // UPDATE UI (SAFE)
        // ===============================
        setText("ui-status-hari", statusHari);

        setText(
            "ui-masuk",
            masukToday?.timestamp?.split(" ")[1] || "-"
        );

        setText(
            "ui-pulang",
            pulangToday?.timestamp?.split(" ")[1] || "-"
        );
        setText("ui-user-name", user.nama);
        setText("ui-user-kategori", user.kategori || "-");
        setText("ui-total-hadir", totalHadir);
        setText("ui-total-masuk", totalMasuk);
        setText("ui-total-pulang", totalPulang);

        setWidth("ui-progress-kehadiran", `${progress}%`);
        setText("ui-persentase", `${Math.round(progress)}%`);
        // setText("ui-user-lokasi", AppState.currentUserLocation?.namaIndustri || "Belum diatur");
        const lokasiEl = document.getElementById("ui-user-lokasi");

            if (lokasiEl && AppState.currentUserLocation) {
                const lokasi = AppState.currentUserLocation;

                lokasiEl.innerHTML = `
                    <i class="fa-solid fa-location-dot"></i>
                    ${lokasi.namaIndustri || "Lokasi PKL"}
                `;

                lokasiEl.href = `https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}`;
                lokasiEl.target = "_blank";
            } else if (lokasiEl) {
                lokasiEl.innerText = "Belum diatur";
                lokasiEl.removeAttribute("href");
            }
                
        if (last) {
            setHTML("ui-last-absen", `
                <p><b>${last.tipe}</b> - ${last.timestamp}</p>
                <p>${Math.round(last.jarak)} meter</p>
            `);
        } else {
            setHTML("ui-last-absen", `
                <p>Belum ada riwayat absensi</p>
            `);
        }

        console.log("Dashboard loaded successfully");
        console.log("Total hadir:", totalHadir);

    } catch (error) {
        console.error("Dashboard error:", error);
        showToast("Gagal load dashboard", true);
    } finally {
        hideLoader();
    }
}

function getTodayStatus(riwayat) {

    const today = new Date().toLocaleDateString("id-ID");

    const todayData = riwayat.filter(r =>
        r.timestamp.includes(today)
    );

    const masuk = todayData.find(r => r.tipe === "Masuk");
    const pulang = todayData.find(r => r.tipe === "Pulang");

    return {
        status: todayData.length ? "Hadir" : "Belum Absen",
        jamMasuk: masuk ? masuk.timestamp : "-",
        jamPulang: pulang ? pulang.timestamp : "-"
    };
}

function getMonthlySummary(riwayat) {

    const month = new Date().getMonth();

    const thisMonth = riwayat.filter(r => {
        const d = parseDate(r.timestamp);
        return d.getMonth() === month;
    });

    const hariMasuk = new Set(
        thisMonth
            .filter(r => r.tipe === "Masuk")
            .map(r => r.timestamp.split(" ")[0])
    );

    return {
        totalHadir: hariMasuk.size,
        totalMasuk: thisMonth.filter(r => r.tipe === "Masuk").length,
        totalPulang: thisMonth.filter(r => r.tipe === "Pulang").length
    };
}

function getAttendanceProgress(totalHadir) {

    const targetHariKerja = 22; // bisa kamu ganti nanti dari GAS

    const percent = (totalHadir / targetHariKerja) * 100;

    return Math.min(percent, 100);
}