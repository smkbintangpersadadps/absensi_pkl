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

//Riwayat Wali
async function loadWaliHistory(useLoader = false) {
    try {
        const user = AppState.currentUser;
        if (!user) return;

        if (!AppState.historyMode) {
            AppState.historyMode = "wali";
        }

        if (useLoader) {
            showLoader("Memuat riwayat absensi...");
        }

        const data = await ApiService.call({
            action: "get_monitoring_dashboard",
            mode: AppState.historyMode,
            username: user.username,
            kategori: user.kategori
        });

        const siswa = data.siswa || [];
        const riwayat = data.riwayat || [];

        const emptyBox = document.getElementById("wali-history-empty");
        const tableWrapper = document.getElementById("wali-history-table-wrapper");
        const tbody = document.getElementById("wali-riwayat-body");

        if (!tbody) return;

        if ($.fn.DataTable.isDataTable("#wali-table")) {
            $("#wali-table").DataTable().destroy();
        }

        if (emptyBox) {
            emptyBox.classList.add("hidden");
            emptyBox.innerHTML = "";
        }

        if (tableWrapper) {
            tableWrapper.classList.remove("hidden");
        }

        if (AppState.historyMode === "wali" && siswa.length === 0) {
            if (tableWrapper) {
                tableWrapper.classList.add("hidden");
            }

            if (emptyBox) {
                emptyBox.classList.remove("hidden");
                emptyBox.innerHTML = `
                    <p>
                        Tidak memiliki siswa yang sedang PKL sebagai <b>Wali Kelas</b>.
                    </p>
                    <button onclick="setHistoryMode('pembimbing')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Pembimbing PKL
                    </button>
                `;
            }

            return;
        }

        if (AppState.historyMode === "pembimbing" && siswa.length === 0) {

            if (tableWrapper) {
                tableWrapper.classList.add("hidden");
            }

            if (emptyBox) {
                emptyBox.classList.remove("hidden");

                emptyBox.innerHTML = `
                    <p>
                        Anda tidak sedang menjadi <b>Pembimbing PKL</b>.
                    </p>

                    <button onclick="setHistoryMode('wali')"
                        class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                        Buka Wali Kelas
                    </button>
                `;
            }

            return;
        }

        if (!riwayat.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="p-4 text-center text-gray-500">
                        Belum ada riwayat absensi
                    </td>
                </tr>
            `;

            return;
        } else {
            tbody.innerHTML = riwayat.map(r => `
                <tr>
                    <td>${r.timestamp || "-"}</td>
                    <td>${r.nama || "-"}</td>
                    <td>${r.kategori || "-"}</td>
                    <td>${r.namaIndustri || "-"}</td>
                    <td>
                        <span class="px-2 py-1 rounded-full text-xs ${
                            r.tipe === "Masuk"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                        }">
                            ${r.tipe || "-"}
                        </span>
                    </td>
                    <td>${Math.round(r.jarak || 0)} m</td>
                    <td>
                        ${
                            r.maps
                                ? `<a href="${r.maps}" target="_blank" class="text-indigo-600 font-medium">Lihat</a>`
                                : "-"
                        }
                    </td>
                </tr>
            `).join("");
        }

        $("#wali-table").DataTable({
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            ordering: true,
            searching: true,
            scrollX: true,
            autoWidth: false,
            destroy: true,
            language: {
                search: "Cari:",
                lengthMenu: "Tampilkan _MENU_ data",
                info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                paginate: {
                    next: "›",
                    previous: "‹"
                },
                zeroRecords: "Data tidak ditemukan",
                infoEmpty: "Tidak ada data",
                infoFiltered: "(difilter dari _MAX_ total data)"
            }
        });

    } catch (error) {
        console.error("Wali history error:", error);
        showToast("Gagal memuat riwayat wali", true);

    } finally {
        if (useLoader) {
            hideLoader();
        }
    }
}

function setHistoryMode(mode) {
    AppState.historyMode = mode;

    const btnWali = document.getElementById("btn-history-mode-wali");
    const btnPembimbing = document.getElementById("btn-history-mode-pembimbing");

    btnWali?.classList.remove("bg-indigo-600", "text-white");
    btnPembimbing?.classList.remove("bg-indigo-600", "text-white");

    btnWali?.classList.add("bg-slate-100", "text-slate-700");
    btnPembimbing?.classList.add("bg-slate-100", "text-slate-700");

    if (mode === "wali") {
        btnWali?.classList.remove("bg-slate-100", "text-slate-700");
        btnWali?.classList.add("bg-indigo-600", "text-white");
    } else {
        btnPembimbing?.classList.remove("bg-slate-100", "text-slate-700");
        btnPembimbing?.classList.add("bg-indigo-600", "text-white");
    }

    loadWaliHistory?.(true);
}
