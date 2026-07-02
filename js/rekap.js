// function initRekapBulananPage() {
//     const now = new Date();

//     const bulanEl = document.getElementById("rekap-bulan");
//     const tahunEl = document.getElementById("rekap-tahun");
//     const modeEl = document.getElementById("rekap-mode");

//     if (bulanEl && !bulanEl.value) {
//         bulanEl.value = now.getMonth() + 1;
//     } else if (bulanEl) {
//         bulanEl.value = now.getMonth() + 1;
//     }

//     if (tahunEl && !tahunEl.value) {
//         tahunEl.value = now.getFullYear();
//     }

//     if (modeEl && !modeEl.value) {
//         modeEl.value = AppState.monitoringMode || "wali";
//     }

//     loadRekapBulanan(true);
// }

function initRekapBulananPage() {
    const now = new Date();
    const user = AppState.currentUser;
    const role = String(user?.role || "").trim().toLowerCase();

    const bulanEl = document.getElementById("rekap-bulan");
    const tahunEl = document.getElementById("rekap-tahun");
    const modeEl = document.getElementById("rekap-mode");
    const kategoriWrapper = document.getElementById("rekap-kategori-wrapper");

    if (bulanEl) bulanEl.value = now.getMonth() + 1;
    if (tahunEl && !tahunEl.value) tahunEl.value = now.getFullYear();

    if (role === "kepsek") {
        if (modeEl) {
            modeEl.value = "kepsek";
            modeEl.closest("div")?.classList.add("hidden");
        }

        kategoriWrapper?.classList.remove("hidden");
    } else {
        if (modeEl) {
            modeEl.closest("div")?.classList.remove("hidden");
            modeEl.value = AppState.monitoringMode || "wali";
        }

        kategoriWrapper?.classList.add("hidden");
    }

    loadRekapBulanan(true);
}

async function loadRekapBulanan(useLoader = false) {
    try {
        const user = AppState.currentUser;
        if (!user) return;

        if (useLoader) {
            showLoader("Memuat rekap bulanan...");
        }

        const role =
            String(user?.role || "").trim().toLowerCase();

        const mode =
            role === "kepsek"
                ? "kepsek"
                : document.getElementById("rekap-mode")?.value || "wali";

        const bulan =
            Number(document.getElementById("rekap-bulan")?.value);

        const tahun =
            Number(document.getElementById("rekap-tahun")?.value);

        const filterKategori =
            document.getElementById("rekap-kategori")?.value || "ALL";

        const data = await ApiService.call({
            action: "get_rekap_bulanan",
            mode,
            username: user.username,
            kategori: user.kategori,
            filterKategori,
            bulan,
            tahun
        });

        // ==========================
        // TAMBAHKAN DI SINI
        // ==========================
        if (role === "kepsek") {
            renderRekapKategoriFilter(
                data.kategoriList || [],
                filterKategori
            );
        }

        renderRekapBulanan(data);

    } catch (error) {
        console.error(error);
        showToast("Gagal memuat rekap bulanan", true);

    } finally {
        hideLoader();
    }
}

function renderRekapBulanan(data) {
    const rekap = data.rekap || [];
    const jumlahHari = data.jumlahHari || 31;

    const head = document.getElementById("rekap-head");
    const body = document.getElementById("rekap-body");
    const empty = document.getElementById("rekap-empty");
    const wrapper = document.getElementById("rekap-table-wrapper");

    if (!head || !body) return;

    if ($.fn.DataTable.isDataTable("#rekap-table")) {
        $("#rekap-table").DataTable().clear().destroy();
    }

    if (empty) {
        empty.classList.add("hidden");
        empty.innerHTML = "";
    }

    if (wrapper) {
        wrapper.classList.remove("hidden");
    }

    if (!rekap.length) {
        if (wrapper) wrapper.classList.add("hidden");

        if (empty) {
            empty.classList.remove("hidden");
            empty.innerHTML = `
                Tidak ada data siswa untuk mode ini.
            `;
        }

        return;
    }

    let tanggalHeader = "";

    for (let i = 1; i <= jumlahHari; i++) {
        tanggalHeader += `
            <th class="rekap-day-col">
                <div class="rekap-day-title">
                    ${i}
                </div>
            </th>
        `;
    }

    head.innerHTML = `
        <tr>
            <th style="min-width:220px">Nama</th>
            <th style="min-width:140px">Kelas</th>
            ${tanggalHeader}
            <th>Hadir</th>
            <th>Day Off</th>
            <th>Izin</th>
            <th>Sakit</th>
            <th>Pending</th>
            <th>Belum</th>
        </tr>
    `;

    body.innerHTML = rekap.map(r => {
        const hariCells = r.harian.map(h => `
            <td class="text-center">
                <span class="rekap-badge ${getRekapBadgeClass(h.kode)}"
                    title="${h.label}">
                    ${h.kode}
                </span>
            </td>
        `).join("");

        return `
            <tr>
                <td style="min-width:220px" class="font-medium whitespace-nowrap">
                    ${r.nama || "-"}
                </td>

                <td style="min-width:140px" class="whitespace-nowrap">
                    ${r.kategori || "-"}
                </td>

                ${hariCells}

                <td class="text-center font-bold text-green-700">${r.totalHadir}</td>
                <td class="text-center font-bold text-amber-700">${r.totalDayOff}</td>
                <td class="text-center font-bold text-indigo-700">${r.totalIzin}</td>
                <td class="text-center font-bold text-red-700">${r.totalSakit}</td>
                <td class="text-center font-bold text-orange-700">${r.totalPending}</td>
                <td class="text-center font-bold text-slate-500">${r.totalBelum}</td>
            </tr>
        `;
    }).join("");

    $("#rekap-table").DataTable({
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        ordering: true,
        searching: true,
        scrollX: true,
        autoWidth: true,
        columnDefs: [
    {
        targets: [0,1],
        orderable: true
    },
    {
        targets: "_all",
        orderable: false
    }
],

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
            infoEmpty: "Tidak ada data"
        }
    });
}

function getRekapBadgeClass(kode) {
    switch (String(kode || "").trim().toUpperCase()) {
        case "MP":
            return "rekap-mp";

        case "M":
            return "rekap-m";

        case "P":
            return "rekap-p";

        case "D":
            return "rekap-dayoff";

        case "I":
            return "rekap-izin";

        case "S":
            return "rekap-sakit";

        case "L":
            return "rekap-libur";

        case "LA":
            return "rekap-lupa";
        
        case "W":
            return "rekap-wfh";
        
        case "ML":
            return "rekap-ml";

        case "PD":
            return "rekap-pending";

        default:
            return "rekap-kosong";
    }
}

function renderRekapKategoriFilter(kategoriList, selected = "ALL") {
    const select = document.getElementById("rekap-kategori");
    if (!select) return;

    select.innerHTML = `
        <option value="ALL">Semua Kelas</option>
        ${kategoriList.map(k => `
            <option value="${k}" ${selected === k ? "selected" : ""}>
                ${k}
            </option>
        `).join("")}
    `;
}