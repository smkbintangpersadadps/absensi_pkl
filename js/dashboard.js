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
        setText("ui-user-lokasi", AppState.currentUserLocation?.namaIndustri || "Belum diatur");
                
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