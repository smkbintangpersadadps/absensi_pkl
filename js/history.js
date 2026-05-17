// ===============================
// HISTORY + DASHBOARD STATS
// ===============================

async function loadHistory() {
    try {
        const user = AppState.currentUser;

        if (!user) return;

        const data = await ApiService.call({
            action: "get_riwayat",
            role: user.role,
            username: user.username
        });

        AppState.riwayat = data;

        renderHistoryTable(data);

    } catch (error) {
        console.error("Load history error:", error);
        showToast("Gagal memuat riwayat", true);
    }
}

function renderHistoryTable(data) {
    const tbody = document.getElementById("table-history-body");

    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-4">
                    Belum ada data absensi
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.timestamp}</td>
            <td>${item.nama}</td>
            <td>${item.kategori || '-'}</td>
            <td>${item.tipe}</td>
            <td>${item.jarak ? Number(item.jarak).toFixed(2) : "-"} m </td>
            <td>
                ${
                    item.fotoUrl && item.fotoUrl !== "Tidak ada foto"
                        ? `<a href="${item.fotoUrl}" target="_blank">Lihat</a>`
                        : "-"
                }
            </td>
        </tr>
    `).join("");
}


// ===============================
// ADMIN DASHBOARD
// ===============================

async function loadAdminDashboardStats() {
    try {
        const users = await ApiService.call({
            action: "get_users"
        });

        const riwayat = await ApiService.call({
            action: "get_riwayat",
            role: "admin",
            username: ""
        });

        document.getElementById("stat-total-peserta").innerText =
            users.length;

        document.getElementById("stat-total-riwayat").innerText =
            riwayat.length;

        const today = new Date().toLocaleDateString("id-ID");

        const todayCount = riwayat.filter(item =>
            item.timestamp.includes(today)
        ).length;

        document.getElementById("stat-absen-today").innerText =
            todayCount;

    } catch (error) {
        console.error(error);
    }
}
