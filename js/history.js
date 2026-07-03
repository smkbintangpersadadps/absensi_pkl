// ===============================
// HISTORY + DASHBOARD STATS
// ===============================

// async function loadHistory() {
//     try {
//         const user = AppState.currentUser;
//         if (!user) return;

//         const data = await ApiService.call({
//             action: "get_riwayat",
//             role: user.role,
//             username: user.username
//         });

//         AppState.riwayat = data;

//         const role = String(user.role || "").trim().toLowerCase();

//         if (role === "siswa" || role === "peserta") {
//             initStudentHistoryFilter();
//             renderStudentHistoryCards(data);
//             return;
//         }

//         renderHistoryTable(data);

//     } catch (error) {
//         console.error("Load history error:", error);
//         showToast("Gagal memuat riwayat", true);
//     }
// }

// async function loadHistory() {

//     showLoader("Memuat riwayat...");

//     try {
//         const user = AppState.currentUser;
//         if (!user) return;

//         const role = String(user.role || "").trim().toLowerCase();

//         const monthEl = document.getElementById("student-history-month");
//         const yearEl = document.getElementById("student-history-year");

//         const bulan = Number(monthEl.value);
//         const tahun = Number(yearEl.value);

//         const data = await ApiService.call({
//             action: "get_riwayat",
//             role: user.role,
//             username: user.username,
//             bulan,
//             tahun
//         });

//         AppState.riwayat = data;

//         if (role === "siswa" || role === "peserta") {
//             initStudentHistoryFilter();

//             const monthEl = document.getElementById("student-history-month");
//             const yearEl = document.getElementById("student-history-year");
//             console.log("Before:", monthEl.value);
//             const bulan = Number(monthEl?.value || (new Date().getMonth() + 1));
//             const tahun = Number(yearEl?.value || new Date().getFullYear());
//             console.log("After:", monthEl.value);

//             const statusData = await ApiService.call({
//                 action: "get_status_history_month",
//                 username: user.username,
//                 bulan,
//                 tahun
//             });

//             renderStudentHistoryCards(data, statusData);
//             return;
//         }

//         renderHistoryTable(data);

//     } catch (error) {
//         console.error("Load history error:", error);
//         showToast("Gagal memuat riwayat", true);
//     } finally {
//         hideLoader();
//     }    
// }

async function loadHistory(resetFilter = false) {

    showLoader("Memuat riwayat...");

    try {

        const user = AppState.currentUser;
        if (!user) return;

        const role = String(user.role || "").trim().toLowerCase();

        // ===============================
        // Reset filter hanya saat buka halaman
        // ===============================

        if (resetFilter) {
            initStudentHistoryFilter();
        }

        const monthEl = document.getElementById("student-history-month");
        const yearEl = document.getElementById("student-history-year");

        const bulan = Number(monthEl.value);
        const tahun = Number(yearEl.value);

        // ===============================
        // Ambil Riwayat
        // ===============================

        const data = await ApiService.call({
            action: "get_riwayat",
            role: user.role,
            username: user.username,
            bulan,
            tahun
        });

        AppState.riwayat = data || [];

        if (role === "siswa" || role === "peserta") {

            const statusData = await ApiService.call({
                action: "get_status_history_month",
                username: user.username,
                bulan,
                tahun
            });

            renderStudentHistoryCards(
                AppState.riwayat,
                statusData || []
            );

        } else {

            renderHistoryTable(AppState.riwayat);

        }

    } catch (error) {

        console.error("Load history error:", error);
        showToast("Gagal memuat riwayat", true);

    } finally {

        hideLoader();

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
                            r.fotoUrl
                                ? `<a href="${r.fotoUrl}" target="_blank" class="text-indigo-600 font-medium">Lihat</a>`
                                : "-"
                        }
                    </td>
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

async function loadStatusHistory(useLoader = false) {
    try {
        const user = AppState.currentUser;
        if (!user) return;

        if (useLoader) {
            showLoader("Memuat riwayat status...");
        }

        const data = await ApiService.call({
            action: "get_status_history",
            username: user.username
        });

        const list = document.getElementById("status-history-list");
        if (!list) return;

        if (!data.length) {
            list.innerHTML = `
                <div class="bg-white rounded-2xl p-4 shadow text-center text-slate-500">
                    Belum ada riwayat pengajuan status.
                </div>
            `;
            return;
        }

        list.innerHTML = data.map(item => `
            <div class="bg-white rounded-2xl p-4 shadow border border-slate-100">

                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="font-bold text-slate-800">
                            ${item.tanggal || "-"}
                        </div>

                        <div class="text-xs text-slate-500 mt-1">
                            Diajukan: ${item.timestamp || "-"}
                        </div>
                    </div>

                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}">
                        ${item.status || "-"}
                    </span>
                </div>

                ${
                    item.keterangan
                        ? `<div class="mt-3 text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
                            ${item.keterangan}
                           </div>`
                        : ""
                }

                <div class="mt-3 flex items-center justify-between">
                    <span class="text-xs text-slate-500">
                        Status
                    </span>

                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${getApprovalBadgeClass(item.approval)}">
                        ${item.approval || "Pending"}
                    </span>
                </div>

                ${
                    item.approval === "Pending"
                        ? `
                            <button
                                onclick="cancelStatusRequest('${item.id}')"
                                class="mt-3 w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition">

                                <i class="fa-solid fa-xmark mr-1"></i>
                                Batalkan Pengajuan

                            </button>
                        `
                        : ""
                }

                ${item.approvedByNama
                ? `<div class="mt-2 text-[11px] text-slate-400">
                    Diproses oleh :
                    <span class="font-medium text-slate-600">
                        ${item.approvedByNama}
                    </span>
                    </div>`
                : ""}

            </div>
        `).join("");

    } catch (error) {
        console.error("Status history error:", error);
        showToast("Gagal memuat riwayat status", true);

    } finally {
        hideLoader();
    }
}

//RIWAYAT SISWA
function renderStudentHistoryCards(riwayat, statusData = []) {
    const container = document.getElementById("student-history-list");
    if (!container) return;

    const monthEl = document.getElementById("student-history-month");
    const yearEl = document.getElementById("student-history-year");

    const selectedMonth = Number(monthEl?.value || (new Date().getMonth() + 1));
    const selectedYear = Number(yearEl?.value || new Date().getFullYear());

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let jumlahHari = new Date(selectedYear, selectedMonth, 0).getDate();

    if (selectedMonth === currentMonth && selectedYear === currentYear) {
        jumlahHari = now.getDate();
    }

    // ===============================
    // GROUP ABSENSI
    // ===============================
    const grouped = {};

    (riwayat || []).forEach(r => {
        const tanggalText = r.timestamp?.split(" ")[0];
        if (!tanggalText) return;

        const [day, month, year] = tanggalText.split("/").map(Number);

        if (month !== selectedMonth || year !== selectedYear) return;

        if (!grouped[day]) {
            grouped[day] = {
                masuk: null,
                pulang: null
            };
        }

        if (r.tipe === "Masuk") grouped[day].masuk = r;
        if (r.tipe === "Pulang") grouped[day].pulang = r;
    });

    // ===============================
    // GROUP STATUS HARIAN
    // ===============================
    const statusMap = {};

    (statusData || []).forEach(s => {
        if (!s.tanggal) return;

        const [day, month, year] = s.tanggal.split("/").map(Number);

        if (month !== selectedMonth || year !== selectedYear) return;

        statusMap[day] = s;
    });

    let html = "";

    for (let day = jumlahHari; day >= 1; day--) {
        const masuk = grouped[day]?.masuk;
        const pulang = grouped[day]?.pulang;
        const statusHari = statusMap[day];

        const hasStatus =
            statusHari &&
            String(statusHari.approval || "").trim().toLowerCase() !== "rejected";

        html += `
            <div class="history-card">

                <div class="history-date">

                    <div class="history-weekday">
                        ${getDayName(day, selectedMonth, selectedYear)}
                    </div>

                    <div class="day">${day}</div>

                    <div class="month">
                        ${getMonthShort(selectedMonth)} ${selectedYear}
                    </div>

                </div>

                ${
                    hasStatus && !masuk && !pulang
                        ? renderStatusHistoryBlock(statusHari)
                        : renderNormalHistoryBlock(masuk, pulang)
                }

            </div>
        `;
    }

    container.innerHTML = html;
}

function renderNormalHistoryBlock(masuk, pulang) {
    return `
        <div class="history-action">
            <div class="history-badge in">Scan In</div>

            <div class="history-time">
                ${masuk ? masuk.timestamp.split(" ")[1] : "00:00:00"}
            </div>

            <div class="history-note">
                ${masuk ? `${Math.round(masuk.jarak || 0)} meter` : "Belum absen"}
            </div>
        </div>

        <div class="history-action">
            <div class="history-badge out">Scan Out</div>

            <div class="history-time">
                ${pulang ? pulang.timestamp.split(" ")[1] : "00:00:00"}
            </div>

            <div class="history-note">
                ${pulang ? `${Math.round(pulang.jarak || 0)} meter` : "Belum absen"}
            </div>
        </div>
    `;
}

function renderStatusHistoryBlock(statusHari) {
    const approval = String(statusHari.approval || "Pending").trim();

    return `
        <div class="history-status-special">

           <div class="flex items-center justify-center gap-2 flex-wrap">

    <span class="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold ${getStatusBadgeClass(statusHari.status)}">
        <i class="fa-solid fa-calendar-check"></i>
        ${statusHari.status || "-"}
    </span>

    <span class="inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getApprovalBadgeClass(approval)}">
        ${approval}
    </span>

</div>

            ${
                statusHari.keterangan
                    ? `<div class="mt-2 text-xs text-slate-500 italic">
                        ${statusHari.keterangan}
                       </div>`
                    : ""
            }

        </div>

        <div class="history-action">
            <div class="history-badge out">Status</div>

            

            <div class="history-note">
                Tidak perlu absen
            </div>
        </div>
    `;
}

//CANCEL APPROVE
async function cancelStatusRequest(id) {

    const result = await Swal.fire({
        title: "Batalkan Pengajuan?",
        html: `
            <div class="text-sm text-slate-600">
                Pengajuan ini masih berstatus
                <b>Pending Approval</b>.
                <br><br>
                Apakah Anda yakin ingin membatalkannya?
            </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Batalkan",
        cancelButtonText: "Kembali",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b"
    });

    if (!result.isConfirmed) return;

    try {

        showLoader("Membatalkan pengajuan...");

        const user = AppState.currentUser;

        const response = await ApiService.call({
            action: "cancel_status_harian",
            id,
            username: user.username
        });

        if (response.success) {

            await Swal.fire({
                title: "Berhasil",
                text: response.message || "Pengajuan berhasil dibatalkan.",
                icon: "success",
                timer: 1800,
                showConfirmButton: false
            });

            loadStatusHistory();

        } else {

            Swal.fire({
                title: "Gagal",
                text: response.message || "Pengajuan tidak dapat dibatalkan.",
                icon: "error"
            });
        }

    } catch (error) {

        console.error("Cancel status error:", error);

        Swal.fire({
            title: "Terjadi Kesalahan",
            text: "Gagal membatalkan pengajuan.",
            icon: "error"
        });

    } finally {

        hideLoader();
    }
}


