// ===============================
// USER DASHBOARD
// ===============================

async function loadUserDashboardStats() {

    try {
        const user = AppState.currentUser;
        if (!user) return;

        const riwayat = await ApiService.call({
            action: "get_riwayat",
            role: user.role,
            username: user.username
        });

        // ===============================
        // GUARD MOBILE SAFE
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

        // hanya warning, TIDAK STOP FUNCTION
        const missing = requiredUI.filter(id => !document.getElementById(id));

        if (missing.length > 0) {
            console.warn("UI missing:", missing);
        }

        // ===============================
        // HELPERS (ANTI ERROR FORMAT)
        // ===============================
       const today = new Date();
        const todayStr =
            today.getDate().toString().padStart(2, "0") + "/" +
            (today.getMonth() + 1).toString().padStart(2, "0") + "/" +
            today.getFullYear();

        const todayData = riwayat.filter(r =>
            r.timestamp.startsWith(todayStr)
        );

        const thisMonth = riwayat.filter(r => {
            const d = parseDateID(r.timestamp);
            return d.getMonth() === new Date().getMonth();
        });


        // ===============================
        // STATUS HARI INI
        // ===============================
        const masukToday = todayData.find(r => r.tipe === "Masuk");
        const pulangToday = todayData.find(r => r.tipe === "Pulang");

        const statusHari = todayData.length > 0 ? "Hadir" : "Belum Absen";

        // ===============================
        // RINGKASAN BULAN
        // ===============================
        const totalHadir = new Set(
            thisMonth
                .filter(r => r.tipe === "Masuk")
                .map(r => r.timestamp.split(" ")[0])
        ).size;

        const totalMasuk = thisMonth.filter(r => r.tipe === "Masuk").length;
        const totalPulang = thisMonth.filter(r => r.tipe === "Pulang").length;

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
        // SAFE BIND UI (NO CRASH MOBILE)
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
        console.log("TOTAL HADIR:", totalHadir);
        console.log("THIS MONTH:", thisMonth);
        setText("ui-status-hari", statusHari);
        setText("ui-masuk", masukToday ? masukToday.timestamp.split(" ")[1] : "-");
        setText("ui-pulang", pulangToday ? pulangToday.timestamp.split(" ")[1] : "-");

        document.getElementById("ui-user-name").innerText =
            AppState.currentUser.nama;
            
        document.getElementById("ui-total-hadir").innerText = totalHadir;
        document.getElementById("ui-total-masuk").innerText = totalMasuk;
        document.getElementById("ui-total-pulang").innerText = totalPulang;

                document.getElementById("ui-progress-kehadiran").style.width =
            progress + "%";

        document.getElementById("ui-persentase").innerText =
            Math.round(progress) + "%";

        if (last) {
            setHTML("ui-last-absen", `
                <p><b>${last.tipe}</b> - ${last.timestamp}</p>
                <p>${last.jarak} meter</p>
            `);
        }

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