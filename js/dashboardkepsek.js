let kepsekMap = null;
let kepsekMarkers = [];
let kepsekLokasiSelect = null;
const KepsekDashboardService = {
    data: [],
    filteredData: [],
    selectedDate: null,
    selectedLokasi: "ALL",
    // =====================================================
    // INIT
    // =====================================================
    async init(useLoader = true) {
        try {
            const tanggalEl =
                document.getElementById(
                    "kepsek-filter-tanggal"
                );
            // =============================================
            // SET TANGGAL DEFAULT
            // =============================================
            if (tanggalEl && !tanggalEl.value) {
                const today = new Date();
                const year =
                    today.getFullYear();
                const month =
                    String(
                        today.getMonth() + 1
                    ).padStart(2, "0");
                const day =
                    String(
                        today.getDate()
                    ).padStart(2, "0");
                tanggalEl.value =
                    `${year}-${month}-${day}`;
            }
            // =============================================
            // LOAD LOKASI
            // =============================================
            await this.loadLokasi();
            // =============================================
            // LOAD DASHBOARD
            // =============================================
            await this.load(useLoader);
        }
        catch (error) {
            console.error(
                "KepsekDashboardService.init:",
                error
            );
            showToast(
                "Gagal menyiapkan dashboard Kepala Sekolah",
                true
            );
        }
    },
    // =====================================================
    // LOAD LOKASI
    // =====================================================
    async loadLokasi() {
        try {
            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("lokasi")
                    .select(`
                        lokasi_id,
                        nama_industri,
                        latitude,
                        longitude,
                        radius,
                        alamat,
                        status
                    `)
                    .order(
                        "nama_industri",
                        {
                            ascending: true
                        }
                    );
            if (error) {
                throw error;
            }
            const lokasi =
                data || [];
            console.log(
                "LOKASI:",
                lokasi
            );
            const select =
                document.getElementById(
                    "kepsek-filter-lokasi"
                );
            if (!select) {
                return;
            }
            // =============================================
            // HAPUS TOMSELECT LAMA
            // =============================================
            if (
                window.kepsekLokasiSelect
            ) {
                try {
                    window.kepsekLokasiSelect.destroy();
                }
                catch (e) {
                    console.warn(
                        "Gagal destroy TomSelect lokasi",
                        e
                    );
                }
                window.kepsekLokasiSelect =
                    null;
            }
            // =============================================
            // ISI SELECT
            // =============================================
            select.innerHTML = `
                <option value="ALL">
                    Semua Lokasi
                </option>
                ${
                    lokasi
                        .map(item => `
                            <option
                                value="${this.escapeAttribute(
                                    item.lokasi_id
                                )}"
                            >
                                ${this.escapeHtml(
                                    item.nama_industri ||
                                    item.lokasi_id
                                )}
                            </option>
                        `)
                        .join("")
                }
            `;
            // =============================================
            // TOM SELECT
            // =============================================
            if (
                typeof TomSelect !==
                "undefined"
            ) {
                window.kepsekLokasiSelect =
                    new TomSelect(
                        "#kepsek-filter-lokasi",
                        {
                            create: false,
                            allowEmptyOption: false,
                            placeholder:
                                "Ketik nama lokasi PKL...",
                            sortField: {
                                field: "text",
                                direction: "asc"
                            }
                        }
                    );
                window.kepsekLokasiSelect
                    .setValue("ALL");
                // =========================================
                // EVENT PERUBAHAN LOKASI
                // =========================================
                window.kepsekLokasiSelect
                    .on(
                        "change",
                        value => {
                            this.selectedLokasi =
                                value ||
                                "ALL";
                            this.applyFilters();
                        }
                    );
            }
            else {
                select.value =
                    "ALL";
                select.addEventListener(
                    "change",
                    () => {
                        this.selectedLokasi =
                            select.value ||
                            "ALL";
                        this.applyFilters();
                    }
                );
            }
        }
        catch (error) {
            console.error(
                "KepsekDashboardService.loadLokasi:",
                error
            );
            showToast(
                "Gagal memuat daftar lokasi",
                true
            );
        }
    },
    // =====================================================
    // LOAD DASHBOARD
    // =====================================================
    async load(useLoader = false) {
        try {
            const user =
                AppState.currentUser;
            if (!user) {
                console.warn(
                    "KepsekDashboardService: user belum tersedia"
                );
                return;
            }
            if (useLoader) {
                showLoader(
                    "Memuat dashboard Kepala Sekolah..."
                );
            }
            // =============================================
            // TANGGAL
            // =============================================
            const tanggal =
                document.getElementById(
                    "kepsek-filter-tanggal"
                )?.value;
            if (!tanggal) {
                showToast(
                    "Tanggal belum dipilih",
                    true
                );
                return;
            }
            this.selectedDate =
                tanggal;
            // =============================================
            // LOKASI
            // =============================================
            const lokasiSelect =
                document.getElementById(
                    "kepsek-filter-lokasi"
                );
            this.selectedLokasi =
                lokasiSelect?.value ||
                this.selectedLokasi ||
                "ALL";
            // =============================================
            // LOAD SISWA
            // =============================================
            const {
                data: siswaData,
                error: siswaError
            } =
                await window.supabaseClient
                    .from("users")
                    .select(`
                        username,
                        nama_lengkap,
                        kategori,
                        lokasi_id,
                        p_id,
                        parent_id,
                        role
                    `)
                    .eq(
                        "role",
                        "siswa"
                    );
            if (siswaError) {
                throw siswaError;
            }
            const siswa =
                siswaData || [];
            // =============================================
            // RANGE TANGGAL - WITA (UTC+8)
            // =============================================

            const startDate =
                new Date(
                    `${tanggal}T00:00:00+08:00`
                ).toISOString();

            const endDate =
                new Date(
                    `${tanggal}T23:59:59.999+08:00`
                ).toISOString();

            console.log("Tanggal dashboard:", tanggal);
            console.log("Start WITA:", startDate);
            console.log("End WITA:", endDate);
            // =============================================
            // LOAD ABSENSI
            // =============================================
            const {
                data: absensiData,
                error: absensiError
            } =
                await window.supabaseClient
                    .from("absensi")
                    .select(`
                        id,
                        waktu,
                        username,
                        nama_lengkap,
                        kategori,
                        lokasi_id,
                        nama_industri,
                        tipe,
                        latitude,
                        longitude,
                        jarak,
                        foto_url,
                        maps_url
                    `)
                    .gte(
                        "waktu",
                        startDate
                    )
                    .lte(
                        "waktu",
                        endDate
                    )
                    .order(
                        "waktu",
                        {
                            ascending: true
                        }
                    );
            if (absensiError) {
                throw absensiError;
            }
            const absensi =
                absensiData || [];
            // =============================================
            // LOAD STATUS HARIAN
            // =============================================
            const {
                data: statusData,
                error: statusError
            } =
                await window.supabaseClient
                    .from("status_harian")
                    .select(`
                        id,
                        tanggal,
                        username,
                        nama_lengkap,
                        kategori,
                        lokasi_id,
                        status,
                        keterangan,
                        approval,
                        approved_by,
                        foto_bukti,
                        created_at,
                        approved_at
                    `)
                    .eq(
                        "tanggal",
                        tanggal
                    );
            if (statusError) {
                throw statusError;
            }
            const statusHarian =
                statusData || [];
            // =============================================
            // LOAD LOKASI
            // =============================================
            const {
                data: lokasiData,
                error: lokasiError
            } =
                await window.supabaseClient
                    .from("lokasi")
                    .select(`
                        lokasi_id,
                        nama_industri,
                        latitude,
                        longitude,
                        radius,
                        alamat,
                        status
                    `);
            if (lokasiError) {
                throw lokasiError;
            }
            const lokasi =
                lokasiData || [];
            this.lokasiData = lokasi;
            // =============================================
            // BUILD DATA
            // =============================================
            // =================================================
            // PROSES DATA
            // =================================================
            const result =
                this.buildData(
                    siswa,
                    absensi,
                    statusHarian,
                    lokasi,
                    tanggal
                );
            // =================================================
            // AMBIL FILTER LOKASI YANG DIPILIH
            // =================================================
            const selectedLokasi =
                lokasiSelect?.value || "ALL";
            // =================================================
            // FILTER BERDASARKAN LOKASI
            // =================================================
            let dashboardData =
                [...result];
            // Jika bukan ALL,
            // tampilkan hanya siswa pada lokasi tersebut
            if (
                selectedLokasi &&
                selectedLokasi !== "ALL"
            ) {
                dashboardData =
                    result.filter(
                        siswa =>
                            String(
                                siswa.lokasiId || ""
                            ).trim()
                            ===
                            String(
                                selectedLokasi
                            ).trim()
                    );
            }
            // =================================================
            // SIMPAN DATA
            // =================================================
            this.data =
                dashboardData;
            this.filteredData =
                [...dashboardData];
            // =================================================
            // DEBUG
            // =================================================
            console.log(
                "Kepsek selected lokasi:",
                selectedLokasi
            );
            console.log(
                "Total data sebelum filter:",
                result.length
            );
            console.log(
                "Total data setelah filter lokasi:",
                dashboardData.length
            );
            // =================================================
            // RENDER SUMMARY
            // =================================================
            this.renderSummary(
                dashboardData,
                lokasi
            );
            // =================================================
            // RENDER REKAP INDUSTRI
            // =================================================
            this.renderIndustri(
                dashboardData
            );
            // =================================================
            // RENDER FILTER SISWA
            // =================================================
            this.renderFilter(
                dashboardData
            );
            // =================================================
            // RENDER TABLE
            // =================================================
            this.renderTable(
                dashboardData
            );
            // =================================================
            // RENDER MAP
            // =================================================
            this.renderMap(
                dashboardData
            );
        }
        catch (error) {
            console.error(
                "KepsekDashboardService.load:",
                error
            );
            showToast(
                "Gagal memuat dashboard Kepala Sekolah",
                true
            );
        }
        finally {
            if (useLoader) {
                hideLoader();
            }
        }
    },
    // =====================================================
    // BUILD DATA
    // =====================================================
    buildData(
        siswa,
        absensi,
        statusHarian,
        lokasi,
        tanggal
    ) {
        const result = [];
        // =============================================
        // MAP LOKASI
        // =============================================
        const lokasiMap = {};
        lokasi.forEach(
            item => {
                if (!item.lokasi_id) {
                    return;
                }
                lokasiMap[
                    item.lokasi_id
                ] = item;
            }
        );
        // =============================================
        // GROUP ABSENSI
        // =============================================
        const absensiMap = {};
        absensi.forEach(
            item => {
                if (!item.username) {
                    return;
                }
                if (
                    !absensiMap[item.username]
                ) {
                    absensiMap[
                        item.username
                    ] = [];
                }
                absensiMap[
                    item.username
                ].push(item);
            }
        );
        // =============================================
        // GROUP STATUS
        // =============================================
        const statusMap = {};
        statusHarian.forEach(
            item => {
                if (!item.username) {
                    return;
                }
                statusMap[
                    item.username
                ] = item;
            }
        );
        // =============================================
        // PROSES SISWA
        // =============================================
        siswa.forEach(
            siswaItem => {
                const username =
                    siswaItem.username;
                if (!username) {
                    return;
                }
                const dataAbsensi =
                    absensiMap[
                        username
                    ] || [];
                const status =
                    statusMap[
                        username
                    ] || null;
                const lokasiItem =
                    lokasiMap[
                        siswaItem.lokasi_id
                    ] || null;
                // =========================================
                // CARI ABSEN MASUK
                // =========================================
                const masuk =
                    dataAbsensi.find(
                        item => {
                            const tipe =
                                String(
                                    item.tipe || ""
                                )
                                .trim()
                                .toLowerCase();
                            return (
                                tipe === "masuk" ||
                                tipe.includes("masuk")
                            );
                        }
                    );
                // =========================================
                // CARI ABSEN PULANG
                // =========================================
                const pulang =
                    dataAbsensi.find(
                        item => {
                            const tipe =
                                String(
                                    item.tipe || ""
                                )
                                .trim()
                                .toLowerCase();
                            return (
                                tipe === "pulang" ||
                                tipe.includes("pulang") ||
                                tipe.includes("keluar") ||
                                tipe.includes("check out") ||
                                tipe.includes("checkout")
                            );
                        }
                    );
                // =========================================
                // STATUS
                // =========================================
                let statusText =
                    "Belum Hadir";
                let keterangan =
                    "";
                if (masuk) {
                    statusText =
                        "Hadir";
                    if (
                        pulang
                    ) {
                        keterangan =
                            "Masuk & Pulang";
                    }
                    else {
                        keterangan =
                            "Sudah Masuk, Belum Pulang";
                    }
                }
                else if (status) {
                    const approval =
                        String(
                            status.approval || ""
                        )
                        .trim()
                        .toLowerCase();
                    if (
                        approval ===
                        "pending"
                    ) {
                        statusText =
                            "Pending";
                    }
                    else if (
                        approval ===
                        "approved"
                    ) {
                        statusText =
                            status.status ||
                            "Disetujui";
                    }
                    else if (
                        approval ===
                        "rejected"
                    ) {
                        statusText =
                            "Ditolak";
                    }
                    else {
                        statusText =
                            status.status ||
                            "Pengajuan";
                    }
                    keterangan =
                        status.keterangan ||
                        "";
                }
                // =========================================
                // INDUSTRI
                // =========================================
                const industri =
                    masuk?.nama_industri ||
                    pulang?.nama_industri ||
                    lokasiItem?.nama_industri ||
                    "-";
                // =========================================
                // KOORDINAT
                // =========================================
                const latitude =
                    masuk?.latitude ??
                    pulang?.latitude ??
                    lokasiItem?.latitude ??
                    null;
                const longitude =
                    masuk?.longitude ??
                    pulang?.longitude ??
                    lokasiItem?.longitude ??
                    null;
                // =========================================
                // DATA FINAL
                // =========================================
                result.push({
                    username,
                    nama:
                        siswaItem.nama_lengkap ||
                        "-",
                    kategori:
                        siswaItem.kategori ||
                        "-",
                    lokasiId:
                        siswaItem.lokasi_id ||
                        "-",
                    pId:
                        siswaItem.p_id ||
                        null,
                    parentId:
                        siswaItem.parent_id ||
                        null,
                    industri,
                    alamat:
                        lokasiItem?.alamat ||
                        "-",
                    jamMasuk:
                        masuk
                            ? this.formatTime(
                                masuk.waktu
                            )
                            : "-",
                    jamPulang:
                        pulang
                            ? this.formatTime(
                                pulang.waktu
                            )
                            : "-",
                    status:
                        statusText,
                    keterangan,
                    jarak:
                        masuk?.jarak ??
                        pulang?.jarak ??
                        null,
                    fotoUrl:
                        masuk?.foto_url ||
                        pulang?.foto_url ||
                        null,
                    mapsUrl:
                        masuk?.maps_url ||
                        pulang?.maps_url ||
                        null,
                    latitude,
                    longitude,
                    tipeMasuk:
                        masuk?.tipe ||
                        null,
                    tipePulang:
                        pulang?.tipe ||
                        null,
                    absensi:
                        dataAbsensi,
                    statusHarian:
                        status
                });
            }
        );
        return result;
    },
    // =====================================================
    // FORMAT TIME
    // =====================================================
    formatTime(value) {
        if (!value) {
            return "-";
        }
        const date =
            new Date(value);
        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "-";
        }
        return date.toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    },
    // =====================================================
    // SUMMARY
    // =====================================================
    renderSummary(data, lokasi = []) {
        const totalSiswa = data.length;
        const totalHadir =
            data.filter(
                s => s.jamMasuk !== "-"
            ).length;
        const totalBelum =
            data.filter(
                s =>
                    s.jamMasuk === "-" &&
                    s.status === "Belum Hadir"
            ).length;
        const totalIndustri =
            lokasi.filter(
                l =>
                    l.status === true ||
                    l.status === "aktif" ||
                    l.status === "Active" ||
                    l.status === "active"
            ).length;
        const totalStatus =
            data.filter(
                s =>
                    s.status !== "Hadir" &&
                    s.status !== "Belum Hadir"
            ).length;
        const totalPending =
            data.filter(
                s =>
                    String(s.status || "")
                        .trim()
                        .toLowerCase() === "pending"
            ).length;
        this.setText(
            "kepsek-total-siswa",
            totalSiswa
        );
        this.setText(
            "kepsek-total-hadir",
            totalHadir
        );
        this.setText(
            "kepsek-total-belum",
            totalBelum
        );
        this.setText(
            "kepsek-total-industri",
            totalIndustri
        );
        this.setText(
            "kepsek-total-status",
            totalStatus
        );
        this.setText(
            "kepsek-total-pending",
            totalPending
        );
    },
    // =====================================================
    // REKAP INDUSTRI
    // =====================================================
    renderIndustri(data) {
        const container =
            document.getElementById(
                "kepsek-rekap-industri"
            );
        if (!container) {
            return;
        }
        const map = {};
        data.forEach(
            siswa => {
                const industri =
                    siswa.industri ||
                    "Belum Ditentukan";
                if (!map[industri]) {
                    map[industri] = {
                        total: 0,
                        hadir: 0,
                        belum: 0,
                        status: 0
                    };
                }
                map[industri].total++;
                if (
                    siswa.jamMasuk !== "-"
                ) {
                    map[industri].hadir++;
                }
                else if (
                    siswa.status ===
                    "Belum Hadir"
                ) {
                    map[industri].belum++;
                }
                else {
                    map[industri].status++;
                }
            }
        );
        const entries =
            Object.entries(map);
        if (!entries.length) {
            container.innerHTML = `
                <div class="text-sm text-slate-500">
                    Belum ada data industri.
                </div>
            `;
            return;
        }
        container.innerHTML =
            entries
                .sort(
                    (a, b) =>
                        b[1].total -
                        a[1].total
                )
                .map(
                    ([industri, item]) => `
                        <div class="border rounded-xl p-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-bold text-slate-800">
                                        ${this.escapeHtml(
                                            industri
                                        )}
                                    </div>
                                    <div class="text-xs text-slate-500 mt-1">
                                        ${item.total} siswa
                                    </div>
                                </div>
                                <div class="text-green-600 font-bold">
                                    ${item.hadir}
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 mt-3 text-xs">
                                <div class="bg-green-50 rounded-lg p-2 text-center">
                                    <div class="text-green-700 font-bold">
                                        ${item.hadir}
                                    </div>
                                    <div class="text-slate-500">
                                        Hadir
                                    </div>
                                </div>
                                <div class="bg-red-50 rounded-lg p-2 text-center">
                                    <div class="text-red-700 font-bold">
                                        ${item.belum}
                                    </div>
                                    <div class="text-slate-500">
                                        Belum
                                    </div>
                                </div>
                                <div class="bg-orange-50 rounded-lg p-2 text-center">
                                    <div class="text-orange-700 font-bold">
                                        ${item.status}
                                    </div>
                                    <div class="text-slate-500">
                                        Status
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                )
                .join("");
    },
    // =====================================================
    // FILTER OPTION
    // =====================================================
    renderFilter(data) {
        const kategoriEl =
            document.getElementById(
                "kepsek-filter-kategori"
            );
        const industriEl =
            document.getElementById(
                "kepsek-filter-industri"
            );
        // =============================================
        // KATEGORI
        // =============================================
        if (kategoriEl) {
            const current =
                kategoriEl.value;
            const kategori =
                [
                    ...new Set(
                        data
                            .map(
                                item =>
                                    item.kategori
                            )
                            .filter(Boolean)
                    )
                ]
                .sort();
            kategoriEl.innerHTML = `
                <option value="">
                    Semua Kelas
                </option>
                ${
                    kategori
                        .map(
                            item => `
                                <option value="${this.escapeAttribute(item)}">
                                    ${this.escapeHtml(item)}
                                </option>
                            `
                        )
                        .join("")
                }
            `;
            if (
                kategori.includes(current)
            ) {
                kategoriEl.value =
                    current;
            }
        }
        // =============================================
        // INDUSTRI
        // =============================================
        if (industriEl) {
            const current =
                industriEl.value;
            const industri =
                [
                    ...new Set(
                        data
                            .map(
                                item =>
                                    item.industri
                            )
                            .filter(
                                item =>
                                    item &&
                                    item !== "-"
                            )
                    )
                ]
                .sort();
            industriEl.innerHTML = `
                <option value="">
                    Semua Industri
                </option>
                ${
                    industri
                        .map(
                            item => `
                                <option value="${this.escapeAttribute(item)}">
                                    ${this.escapeHtml(item)}
                                </option>
                            `
                        )
                        .join("")
                }
            `;
            if (
                industri.includes(current)
            ) {
                industriEl.value =
                    current;
            }
        }
    },
    // =====================================================
    // APPLY FILTER
    // =====================================================
    applyFilters() {
        const search =
            String(
                document.getElementById(
                    "kepsek-search"
                )?.value || ""
            )
            .trim()
            .toLowerCase();
        const kategori =
            document.getElementById(
                "kepsek-filter-kategori"
            )?.value || "";
        const industri =
            document.getElementById(
                "kepsek-filter-industri"
            )?.value || "";
        const lokasi =
            document.getElementById(
                "kepsek-filter-lokasi"
            )?.value ||
            this.selectedLokasi ||
            "ALL";
        this.selectedLokasi =
            lokasi;
        this.filteredData =
            this.data.filter(
                siswa => {
                    const cocokSearch =
                        !search ||
                        String(
                            siswa.nama || ""
                        )
                        .toLowerCase()
                        .includes(search)
                        ||
                        String(
                            siswa.username || ""
                        )
                        .toLowerCase()
                        .includes(search);
                    const cocokKategori =
                        !kategori ||
                        siswa.kategori ===
                        kategori;
                    const cocokIndustri =
                        !industri ||
                        siswa.industri ===
                        industri;
                    const cocokLokasi =
                        lokasi === "ALL" ||
                        siswa.lokasiId ===
                        lokasi;
                    return (
                        cocokSearch &&
                        cocokKategori &&
                        cocokIndustri &&
                        cocokLokasi
                    );
                }
            );
        this.renderTable(
            this.filteredData
        );
    },
    // =====================================================
    // KOMPATIBILITAS FUNGSI LAMA
    // =====================================================
    filter() {
        this.applyFilters();
    },
    // =====================================================
    // TABLE
    // =====================================================
    renderTable(data) {

        const tbody =
            document.getElementById(
                "kepsek-table-body"
            );
        if (!tbody) {
            return;
        }
        if (
            typeof $ !== "undefined" &&
            $.fn.DataTable &&
            $.fn.DataTable.isDataTable(
                "#kepsek-table"
            )
        ) {
            $("#kepsek-table")
                .DataTable()
                .clear()
                .destroy();
        }
        if (!data.length) {
            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="p-4 text-center text-slate-500">
                        Tidak ada data siswa.
                    </td>
                </tr>
            `;
            return;
        }
        tbody.innerHTML =
            data
                .map(
                    siswa => {
                        let statusClass =
                            "bg-slate-100 text-slate-600";
                        const status =
                            String(
                                siswa.status ||
                                ""
                            )
                            .trim()
                            .toLowerCase();
                        if (
                            status ===
                            "hadir"
                        ) {
                            statusClass =
                                "bg-green-100 text-green-700";
                        }
                        else if (
                            status ===
                            "belum hadir"
                        ) {
                            statusClass =
                                "bg-red-100 text-red-700";
                        }
                        else if (
                            status ===
                            "pending"
                        ) {
                            statusClass =
                                "bg-orange-100 text-orange-700";
                        }
                        else if (
                            status ===
                            "ditolak"
                        ) {
                            statusClass =
                                "bg-red-100 text-red-700";
                        }
                        else {
                            statusClass =
                                "bg-indigo-100 text-indigo-700";
                        }
                        return `
                            <tr>
                                <td class="font-medium">
                                    ${this.escapeHtml(
                                        siswa.nama
                                    )}
                                </td>
                                <td>
                                    ${this.escapeHtml(
                                        siswa.kategori
                                    )}
                                </td>
                                <td>
                                    ${this.escapeHtml(
                                        siswa.industri
                                    )}
                                </td>
                                <td>
                                    ${
                                        siswa.jamMasuk !== "-"
                                        ? `
                                            <span class="font-medium text-green-700">
                                                ${this.escapeHtml(
                                                    siswa.jamMasuk
                                                )}
                                            </span>
                                        `
                                        : "-"
                                    }
                                </td>
                                <td>
                                    ${
                                        siswa.jamPulang !== "-"
                                        ? `
                                            <span class="font-medium text-red-700">
                                                ${this.escapeHtml(
                                                    siswa.jamPulang
                                                )}
                                            </span>
                                        `
                                        : "-"
                                    }
                                </td>
                                <td>
                                    <span
                                        class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">
                                        ${this.escapeHtml(
                                            siswa.status
                                        )}
                                    </span>
                                    ${
                                        siswa.keterangan
                                        ? `
                                            <div class="text-xs text-slate-500 mt-1">
                                                ${this.escapeHtml(
                                                    siswa.keterangan
                                                )}
                                            </div>
                                        `
                                        : ""
                                    }
                                </td>
                                
                            </tr>
                        `;
                    }
                )
                .join("");
        if (
            typeof $ !== "undefined" &&
            $.fn.DataTable
        ) {
            $("#kepsek-table")
                .DataTable({
                    pageLength: 10,
                    lengthMenu: [
                        10,
                        25,
                        50,
                        100
                    ],
                    ordering: true,
                    searching: false,
                    scrollX: true,
                    autoWidth: false,
                    destroy: true,
                    language: {
                        info:
                            "Menampilkan _START_ sampai _END_ dari _TOTAL_ siswa",
                        paginate: {
                            next: "›",
                            previous: "‹"
                        },
                        zeroRecords:
                            "Data tidak ditemukan",
                        infoEmpty:
                            "Tidak ada data"
                    }
                });
        }
    },
    // =====================================================
    // MAP
    // =====================================================
    renderMap(data) {
        const mapEl =
            document.getElementById(
                "kepsek-map"
            );
        if (!mapEl) {
            return;
        }
        // =============================================
        // HAPUS MAP LAMA
        // =============================================
        if (
            window.kepsekMap
        ) {
            try {
                window.kepsekMap.remove();
            }
            catch (error) {
                console.warn(
                    "Gagal menghapus map lama",
                    error
                );
            }
            window.kepsekMap =
                null;
        }
        // =============================================
        // LEAFLET
        // =============================================
        if (
            typeof L ===
            "undefined"
        ) {
            mapEl.innerHTML = `
                <div class="h-full flex items-center justify-center text-slate-500">
                    Library peta belum tersedia.
                </div>
            `;
            return;
        }
        // =============================================
        // KOORDINAT
        // =============================================
        const titik =
            data.filter(
                siswa =>
                    siswa.latitude !== null &&
                    siswa.longitude !== null &&
                    !Number.isNaN(
                        Number(
                            siswa.latitude
                        )
                    ) &&
                    !Number.isNaN(
                        Number(
                            siswa.longitude
                        )
                    )
            );
        let center =
            [
                -8.65,
                115.2167
            ];
        if (titik.length) {
            center = [
                Number(
                    titik[0].latitude
                ),
                Number(
                    titik[0].longitude
                )
            ];
        }
        // =============================================
        // CREATE MAP
        // =============================================
        window.kepsekMap =
            L.map(
                mapEl
            ).setView(
                center,
                12
            );
        // =============================================
        // TILE
        // =============================================
        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        )
        .addTo(
            window.kepsekMap
        );
        // =============================================
        // MARKER
        // =============================================
        titik.forEach(
            siswa => {
                const marker =
                    L.marker([
                        Number(
                            siswa.latitude
                        ),
                        Number(
                            siswa.longitude
                        )
                    ])
                    .addTo(
                        window.kepsekMap
                    );
                marker.bindPopup(`
                    <div class="text-sm">
                        <div class="font-bold mb-1">
                            ${this.escapeHtml(
                                siswa.nama
                            )}
                        </div>
                        <div>
                            ${this.escapeHtml(
                                siswa.kategori
                            )}
                        </div>
                        <div class="mt-1">
                            ${this.escapeHtml(
                                siswa.industri
                            )}
                        </div>
                        <div class="mt-1">
                            Status:
                            <b>
                                ${this.escapeHtml(
                                    siswa.status
                                )}
                            </b>
                        </div>
                        ${
                            siswa.jamMasuk !== "-"
                            ? `
                                <div class="mt-1">
                                    Masuk:
                                    ${this.escapeHtml(
                                        siswa.jamMasuk
                                    )}
                                </div>
                            `
                            : ""
                        }
                        ${
                            siswa.jamPulang !== "-"
                            ? `
                                <div class="mt-1">
                                    Pulang:
                                    ${this.escapeHtml(
                                        siswa.jamPulang
                                    )}
                                </div>
                            `
                            : ""
                        }
                    </div>
                `);
            }
        );
        // =============================================
        // FIT BOUNDS
        // =============================================
        if (
            titik.length > 1
        ) {
            const bounds =
                L.latLngBounds(
                    titik.map(
                        siswa => [
                            Number(
                                siswa.latitude
                            ),
                            Number(
                                siswa.longitude
                            )
                        ]
                    )
                );
            window.kepsekMap.fitBounds(
                bounds,
                {
                    padding: [
                        30,
                        30
                    ]
                }
            );
        }
        setTimeout(
            () => {

                window.kepsekMap
                    ?.invalidateSize();
            },
            300
        );
    },
    // =====================================================
    // SET TEXT
    // =====================================================
    setText(
        id,
        value
    ) {
        const el =
            document.getElementById(
                id
            );
        if (el) {
            el.textContent =
                value;
        }
    },
    // =====================================================
    // ESCAPE HTML
    // =====================================================
    escapeHtml(value) {
        return String(
            value ?? ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
    },
    // =====================================================
    // ESCAPE ATTRIBUTE
    // =====================================================
    escapeAttribute(value) {
        return this.escapeHtml(
            value
        );
    }
};

// =========================================================
// WRAPPER LAMA
// =========================================================
async function loadKepsekDashboard(
    useLoader = true
) {
    return KepsekDashboardService.load(
        useLoader
    );
}
// =========================================================
// FILTER WRAPPER
// =========================================================
function renderKepsekFilter(lokasiList = [], selected = "ALL") {
    const select =
        document.getElementById("kepsek-filter-lokasi");
    if (!select) {
        console.error(
            "Element #kepsek-filter-lokasi tidak ditemukan"
        );
        return;
    }
    console.log(
        "RENDER LOKASI:",
        lokasiList
    );
    // Hancurkan TomSelect lama
    if (kepsekLokasiSelect) {
        kepsekLokasiSelect.destroy();
        kepsekLokasiSelect = null;
    }
    // Kosongkan select
    select.innerHTML = "";
    // Semua lokasi
    const optionAll =
        document.createElement("option");
    optionAll.value = "ALL";
    optionAll.textContent = "Semua Lokasi";
    select.appendChild(optionAll);
    // Tambahkan lokasi
    lokasiList.forEach(lokasi => {
        const option =
            document.createElement("option");
        option.value =
            lokasi.lokasi_id;
        option.textContent =
            lokasi.nama_industri || "-";
        select.appendChild(option);
    });
    // Set value sebelum TomSelect
    select.value =
        selected || "ALL";
    console.log(
        "OPTION LOKASI:",
        select.options.length
    );
    // =========================
    // TOM SELECT
    // =========================
    if (typeof TomSelect !== "undefined") {
        kepsekLokasiSelect =
            new TomSelect(
                "#kepsek-filter-lokasi",
                {
                    create: false,
                    allowEmptyOption: true,
                    placeholder:
                        "Ketik nama lokasi PKL...",
                    searchField: [
                        "text"
                    ],
                    sortField: {
                        field: "text",
                        direction: "asc"
                    }
                }
            );
        kepsekLokasiSelect.setValue(
            selected || "ALL"
        );
    } else {
        console.warn(
            "TomSelect belum tersedia"
        );
    }
}

// ===============================
// LOAD LOKASU AKUN KEPSEK
// ===============================
async function loadKepsekLokasi() {
    try {
        const {
            data,
            error
        } = await window.supabaseClient
            .from("lokasi")
            .select(`
                lokasi_id,
                nama_industri,
                latitude,
                longitude,
                radius,
                alamat,
                status
            `)
            .order(
                "nama_industri",
                {
                    ascending: true
                }
            );
        if (error) {
            throw error;
        }
        console.log(
            "DATA LOKASI KEPSEK:",
            data
        );
        renderKepsekFilter(
            data || [],
            "ALL"
        );
        return data || [];
    } catch (error) {
        console.error(
            "loadKepsekLokasi:",
            error
        );
        showToast(
            "Gagal memuat lokasi PKL",
            true
        );
        return [];
    }
}

// ===============================
// FILTER SISWA AKUN KEPSEK
// ===============================
function filterKepsekSiswa() {
    KepsekDashboardService.applyFilters();
}

// ===============================
// POPULATE
// ===============================
function populateKepsekFilters() {
    KepsekDashboardService.renderFilter(
        KepsekDashboardService.data
    );
}

// ===============================
// MASTER DATA SISWA
// ===============================
async function loadMasterSiswa() {
    try {
        showLoader("Memuat data siswa...");
        const { data: siswaData, error: siswaError } =
            await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id,
                    p_id
                `)
                .eq("role", "siswa");
        if (siswaError) {
            throw siswaError;
        }
        const { data: lokasiData, error: lokasiError } =
            await window.supabaseClient
                .from("lokasi")
                .select(`
                    lokasi_id,
                    nama_industri
                `);
        if (lokasiError) {
            throw lokasiError;
        }
        const { data: guruData, error: guruError } =
            await window.supabaseClient
                .from("guru")
                .select(`
                    p_id,
                    nama_lengkap
                `);
        if (guruError) {
            throw guruError;
        }
        const lokasiMap = {};
        lokasiData.forEach(item => {
            lokasiMap[item.lokasi_id] = item;
        });
        const guruMap = {};
        guruData.forEach(item => {
            guruMap[item.p_id] = item;
        });
        AppState.masterSiswa =
            (siswaData || []).map(s => ({
                username: s.username,
                nama: s.nama_lengkap,
                kategori: s.kategori,
                lokasiId: s.lokasi_id,
                pId: s.p_id,
                namaIndustri:
                    lokasiMap[s.lokasi_id]
                        ?.nama_industri || "-",
                namaPembimbing:
                    guruMap[s.p_id]
                        ?.nama_lengkap || "-"
            }));
        populateMasterFilters();
        renderMasterSiswaTable(
            AppState.masterSiswa
        );
    }
    catch (error) {
        console.error(error);
        showToast(
            "Gagal memuat data siswa",
            true
        );
    }
    finally {
        hideLoader();
    }
}

// ===============================
// EDIT FORM SISWA
// ===============================
async function openEditSiswa(username) {
    try {
        showLoader("Memuat data siswa...");
        const { data: siswa, error } =
            await window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id,
                    p_id
                `)
                .eq("username", username)
                .single();
        if (error) {
            throw error;
        }
        const { data: guruList } =
            await window.supabaseClient
                .from("guru")
                .select(`
                    p_id,
                    nama_lengkap
                `)
                .order("nama_lengkap");
        const { data: lokasiList } =
            await window.supabaseClient
                .from("lokasi")
                .select(`
                    lokasi_id,
                    nama_industri
                `)
                .order("nama_industri");
        document.getElementById(
            "edit-username"
        ).value =
            siswa.username;
        document.getElementById(
            "edit-username-view"
        ).value =
            siswa.username;
        document.getElementById(
            "edit-nama"
        ).value =
            siswa.nama_lengkap || "";
        document.getElementById(
            "edit-kategori"
        ).value =
            siswa.kategori || "";
        populateGuruDropdown(
            guruList,
            siswa.p_id
        );
        populateLokasiDropdown(
            lokasiList,
            siswa.lokasi_id
        );
        document
            .getElementById(
                "modal-edit-siswa"
            )
            .classList
            .remove("hidden");
    }
    catch (error) {
        console.error(error);
        showToast(
            "Gagal memuat data siswa",
            true
        );
    }
    finally {
        hideLoader();
    }
}

// ===============================
// DROPDOWN GURU
// ===============================
function populateGuruDropdown(
    list,
    selectedId
) {
    const el =
        document.getElementById(
            "edit-parentid"
        );
    if (!el) return;
    el.innerHTML = "";
    list.forEach(item => {
        el.innerHTML += `
            <option
                value="${item.p_id}"
                ${item.p_id === selectedId ? "selected" : ""}>
                ${item.nama_lengkap}
            </option>
        `;
    });
}

// ===============================
// POPULATE DROPDOWN LOKASI
// ===============================
function populateLokasiDropdown(
    list,
    selectedId
) {
    const el =
        document.getElementById(
            "edit-lokasiid"
        );
    if (!el) return;
    el.innerHTML = "";
    list.forEach(item => {
        el.innerHTML += `
            <option
                value="${item.lokasi_id}"
                ${item.lokasi_id === selectedId ? "selected" : ""}>
                ${item.nama_industri}
            </option>
        `;
    });
}

// ===============================
// SIMPAN PERUBAHAN DATA SISWA
// ===============================
async function saveEditSiswa() {
    try {
        showLoader("Menyimpan data...");
        const username =
            document.getElementById(
                "edit-username"
            ).value;
        const nama =
            document.getElementById(
                "edit-nama"
            ).value;
        const { error } =
            await window.supabaseClient
                .from("users")
                .update({
                    nama_lengkap:
                        nama,
                    kategori:
                        document.getElementById(
                            "edit-kategori"
                        ).value,
                    p_id:
                        document.getElementById(
                            "edit-parentid"
                        ).value,
                    lokasi_id:
                        document.getElementById(
                            "edit-lokasiid"
                        ).value
                })
                .eq(
                    "username",
                    username
                );
        if (error) {
            throw error;
        }
        hideLoader();
        closeEditSiswa();
        await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: `Data siswa ${nama} berhasil diperbarui`,
            confirmButtonText: "OK",
            timer: 2000,
            timerProgressBar: true
        });
        await loadMasterSiswa();
    }
    catch (error) {
        console.error(error);
        hideLoader();
        await Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "Data siswa gagal diperbarui",
            confirmButtonText: "OK"
        });
    }
}

// ===============================
// CLOSE MODAL DATA SISWA
// ===============================
function closeEditSiswa() {
    document
        .getElementById("modal-edit-siswa")
        .classList
        .add("hidden");
}

// ===============================
// LOAD MASTER LOKASI
// ===============================
async function loadMasterLokasi() {
    try {
        showLoader(
            "Memuat lokasi..."
        );
        const {
            data,
            error
        } = await window.supabaseClient
            .from("lokasi")
            .select("*")
            .order(
                "nama_industri"
            );
        if (error) {
            throw error;
        }
        AppState.masterLokasi =
            data || [];
        populateLokasiFilter();
        renderMasterLokasiTable(
            AppState.masterLokasi
        );
    }
    catch(error){
        console.error(error);
        showToast(
            "Gagal memuat lokasi",
            true
        );
    }
    finally {
        hideLoader();
    }
}

// ===============================
// POPULATE LOKASI
// ===============================
function populateLokasiFilter() {   
    const statusEl =
        document.getElementById(
            "lokasi-filter-status"
        );
    if (!statusEl) return;
    const list =
        [...new Set(
            AppState.masterLokasi
                .map(i => i.status)
        )];
    statusEl.innerHTML =
        `<option value="">Semua Status</option>`;
    list.forEach(item => {
        statusEl.innerHTML += `
            <option value="${item}">
                ${item}
            </option>
        `;
    });
}

// ===============================
// FILTER MASTER LOKASI
// ===============================
function filterMasterLokasi() {
    const search =
        document.getElementById(
            "lokasi-search"
        )
        ?.value
        .toLowerCase()
        .trim();
    const status =
        document.getElementById(
            "lokasi-filter-status"
        )
        ?.value;
    const result =
        AppState.masterLokasi.filter(item => {
            const cocokNama =
                !search ||
                item.nama_industri
                    ?.toLowerCase()
                    .includes(search);
            const cocokStatus =
                !status ||
                item.status === status;
            return (
                cocokNama &&
                cocokStatus
            );
        });
    renderMasterLokasiTable(
        result
    );
}

// ===============================
// RENDER TABEL LOKASI
// ===============================
function renderMasterLokasiTable(data = []) {
    const tbody =
        document.querySelector(
            "#table-master-lokasi tbody"
        );
    if (!tbody) return;
    if (
        $.fn.DataTable.isDataTable(
            "#table-master-lokasi"
        )
    ) {
        $("#table-master-lokasi")
            .DataTable()
            .destroy();
    }
    tbody.innerHTML = "";
    data.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>
                    ${item.lokasi_id}
                </td>
                <td>
                    ${item.nama_industri}
                </td>
                <td>
                    ${item.radius}
                </td>
                <td>
                    ${item.status}
                </td>
                <td>
                    <button
                        onclick="openEditLokasi('${item.lokasi_id}')"
                        class="btn btn-warning btn-sm">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    $("#table-master-lokasi")
        .DataTable({
            pageLength: 10,
            responsive: true,
            destroy: true
        });
}

// ===============================
// EDIT LOKASI FORM
// ===============================
async function openEditLokasi(id) {
    const lokasi =
        AppState.masterLokasi.find(
            x => x.lokasi_id === id
        );
    if (!lokasi) return;
    document.getElementById(
        "edit-lokasi-id"
    ).value =
        lokasi.lokasi_id;
    document.getElementById(
        "edit-nama-industri"
    ).value =
        lokasi.nama_industri || "";
    document.getElementById(
        "edit-alamat"
    ).value =
        lokasi.alamat || "";
    document.getElementById(
        "edit-latitude"
    ).value =
        lokasi.latitude || "";
    document.getElementById(
        "edit-longitude"
    ).value =
        lokasi.longitude || "";
    document.getElementById(
        "edit-radius"
    ).value =
        lokasi.radius || "";
    document.getElementById(
        "edit-status"
    ).value =
        lokasi.status || "Aktif";
    document
        .getElementById(
            "modal-edit-lokasi"
        )
        .classList
        .remove("hidden");
}

// ===============================
// SIMPAN LOKASI
// ===============================
async function saveEditLokasi() {
    try {
        showLoader("Menyimpan data...");
        await window.supabaseClient
            .from("lokasi")
            .update({
                nama_industri:
                    document.getElementById("edit-nama-industri").value,
                latitude:
                    parseFloat(
                        document.getElementById("edit-latitude").value
                    ),
                longitude:
                    parseFloat(
                        document.getElementById("edit-longitude").value
                    ),
                radius:
                    parseInt(
                        document.getElementById("edit-radius").value
                    ),
                alamat:
                    document.getElementById("edit-alamat").value,
                status:
                    document.getElementById("edit-status").value === "true"
            })
            .eq(
                "lokasi_id",
                document.getElementById("edit-lokasi-id").value
            );
        // tutup loader dulu
        hideLoader();
        await Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Data lokasi berhasil diperbarui",
            confirmButtonText: "OK",
            timer: 2000,
            timerProgressBar: true
        });
        closeEditLokasi();
        await loadMasterLokasi();
    }
    catch (error) {
        hideLoader();
        console.error(error);
        Swal.fire({
            icon: "error",
            title: "Gagal",
            text: error.message || "Terjadi kesalahan",
            confirmButtonText: "Tutup"
        });
    }
}

// ===============================
// CLOSE FORM EDIT LOKASI
// ===============================
function closeEditLokasi() {
    document
        .getElementById(
            "modal-edit-lokasi"
        )
        .classList
        .add("hidden");
}

// ===============================
// MENU TAMBAH HARI LIBUR
// ===============================
let hariLiburList = [];
let lokasiLiburList = [];
// =========================================================
// LOAD HALAMAN
// =========================================================
async function initHariLiburPage() {
    try {
        showLoader("Memuat data hari libur...");
        await loadLokasiUntukHariLibur();
        initFilterTahunHariLibur();
        await loadHariLibur();
    }
    catch (error) {
        console.error(
            "Init hari libur error:",
            error
        );
        showToast(
            "Gagal memuat data hari libur",
            true
        );
    }
    finally {
        hideLoader();
    }
}
// =========================================================
// FILTER TAHUN
// =========================================================
function initFilterTahunHariLibur() {
    const el =
        document.getElementById(
            "filter-libur-tahun"
        );
    if (!el) {
        return;
    }
    const tahunSekarang =
        new Date().getFullYear();
    let html = "";
    for (
        let tahun = tahunSekarang - 2;
        tahun <= tahunSekarang + 3;
        tahun++
    ) {
        html += `
            <option
                value="${tahun}"
                ${tahun === tahunSekarang ? "selected" : ""}>
                ${tahun}
            </option>
        `;
    }
    el.innerHTML = html;
}
// =========================================================
// LOAD LOKASI
// =========================================================
async function loadLokasiUntukHariLibur() {
    const select =
        document.getElementById(
            "hari-libur-lokasi"
        );
    if (!select) {
        return;
    }
    try {
        select.innerHTML = `
            <option value="">
                Memuat lokasi...
            </option>
        `;
        const {
            data,
            error
        } = await window.supabaseClient
            .from("lokasi")
            .select("*")
            .order("lokasi_id", {
                ascending: true
            });
        if (error) {
            throw error;
        }
        select.innerHTML = "";
        if (!data || data.length === 0) {
            select.innerHTML = `
                <option value="">
                    Tidak ada lokasi
                </option>
            `;
            return;
        }
        data.forEach(lokasi => {
            const option =
                document.createElement("option");
            option.value =
                String(
                    lokasi.lokasi_id || ""
                )
                .trim()
                .toUpperCase();
            option.textContent =
                `${lokasi.lokasi_id} - ${lokasi.nama_industri}`;
            select.appendChild(option);
        });
    }
    catch (error) {
        console.error(
            "Gagal memuat lokasi hari libur:",
            error
        );
        select.innerHTML = `
            <option value="">
                Gagal memuat lokasi
            </option>
        `;
        showToast(
            "Gagal memuat data lokasi",
            true
        );
    }
}
// =========================================================
// LOAD DATA HARI LIBUR
// =========================================================
async function loadHariLibur() {
    const tbody =
        document.getElementById(
            "table-hari-libur"
        );
    if (!tbody) {
        return;
    }
    tbody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="px-4 py-8 text-center text-slate-400">
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                Memuat data...
            </td>
        </tr>
    `;
    try {
        const tahun =
            document.getElementById(
                "filter-libur-tahun"
            )?.value;
        const jenis =
            document.getElementById(
                "filter-libur-jenis"
            )?.value || "ALL";
        let query =
            window.supabaseClient
                .from("hari_libur")
                .select("*")
                .order(
                    "tanggal",
                    {
                        ascending: true
                    }
                );
        if (tahun) {
            query =
                query
                    .gte(
                        "tanggal",
                        `${tahun}-01-01`
                    )
                    .lte(
                        "tanggal",
                        `${tahun}-12-31`
                    );
        }
        if (
            jenis !== "ALL"
        ) {
            query =
                query.eq(
                    "jenis",
                    jenis
                );
        }
        const {
            data,
            error
        } = await query;
        if (error) {
            throw error;
        }
        hariLiburList =
            data || [];
        renderHariLiburTable();
    }
    catch (error) {
        console.error(
            "Load hari libur error:",
            error
        );
        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="px-4 py-8 text-center text-red-500">
                    Gagal memuat data.
                </td>
            </tr>
        `;
        throw error;
    }
}
// =========================================================
// RENDER TABLE
// =========================================================
function renderHariLiburTable(
    data = hariLiburList
) {
    const tbody =
        document.getElementById(
            "table-hari-libur"
        );
    if (!tbody) {
        return;
    }
    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="px-4 py-8 text-center text-slate-400">
                    <i class="fa-solid fa-calendar-xmark text-2xl mb-2"></i>
                    <div>
                        Belum ada data hari libur.
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    let html = "";
    data.forEach(
        (item, index) => {
            const tanggal =
                formatTanggalLibur(
                    item.tanggal
                );
            const jenis =
                String(
                    item.jenis || "-"
                );
            const berlaku =
                String(
                    item.berlaku || ""
                )
                .trim()
                .toUpperCase();
            let berlakuHTML = "";
            if (
                berlaku === "ALL"
            ) {
                berlakuHTML = `
                    <span
                        class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        <i class="fa-solid fa-globe"></i>
                        Semua Lokasi
                    </span>
                `;
            }
            else {
                const lokasiArray =
                    berlaku
                        .split(",")
                        .map(
                            x =>
                                x.trim()
                        )
                        .filter(Boolean);
                berlakuHTML = `
                    <div class="flex flex-wrap gap-1">
                        ${
                            lokasiArray
                                .map(
                                    lokasi => `
                                        <span
                                            class="inline-flex px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
                                            ${escapeHTML(lokasi)}
                                        </span>
                                    `
                                )
                                .join("")
                        }
                    </div>
                `;
            }
            html += `
                <tr
                    class="hover:bg-slate-50 transition"
                    data-libur-row
                    data-search="${escapeHTML(
                        `${item.nama_libur || ""} ${item.jenis || ""} ${item.berlaku || ""}`
                    ).toLowerCase()}">
                    <td class="px-4 py-3 text-slate-500">
                        ${index + 1}
                    </td>
                    <td class="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        ${tanggal}
                    </td>
                    <td class="px-4 py-3 font-semibold text-slate-800">
                        ${escapeHTML(
                            item.nama_libur || "-"
                        )}
                    </td>
                    <td class="px-4 py-3">
                        ${badgeJenisLibur(
                            jenis
                        )}
                    </td>
                    <td class="px-4 py-3">
                        ${berlakuHTML}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onclick="editHariLibur(${item.id})"
                                class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
                                title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button
                                type="button"
                                onclick="deleteHariLibur(${item.id})"
                                class="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                                title="Hapus">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    );
    tbody.innerHTML =
        html;
}
// =========================================================
// BADGE JENIS
// =========================================================
function badgeJenisLibur(
    jenis
) {
    const value =
        String(
            jenis || ""
        )
        .trim()
        .toLowerCase();
    if (
        value === "nasional"
    ) {
        return `
            <span
                class="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                Nasional
            </span>
        `;
    }
    if (
        value === "industri"
    ) {
        return `
            <span
                class="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold">
                Industri
            </span>
        `;
    }
    return `
        <span
            class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            ${escapeHTML(jenis || "-")}
        </span>
    `;
}
// =========================================================
// FILTER SEARCH
// =========================================================
function filterHariLiburTable() {
    const keyword =
        String(
            document.getElementById(
                "search-libur"
            )?.value || ""
        )
        .trim()
        .toLowerCase();
    const rows =
        document.querySelectorAll(
            "[data-libur-row]"
        );
    rows.forEach(
        row => {
            const text =
                String(
                    row.dataset.search || ""
                )
                .toLowerCase();
            row.style.display =
                !keyword ||
                text.includes(keyword)
                    ? ""
                    : "none";
        }
    );
}
// =========================================================
// OPEN MODAL
// =========================================================
async function openModalHariLibur() {
    const modal =
        document.getElementById(
            "modal-hari-libur"
        );
    const form =
        document.getElementById(
            "form-hari-libur"
        );
    if (!modal || !form) {
        return;
    }
    form.reset();
    document.getElementById(
        "hari-libur-id"
    ).value = "";
    document.getElementById(
        "modal-hari-libur-title"
    ).innerText =
        "Tambah Hari Libur";
    document.getElementById(
        "btn-save-hari-libur"
    ).innerHTML =
        '<i class="fa-solid fa-save mr-1"></i> Simpan';
    // =====================================
    // DEFAULT TANGGAL = HARI INI WITA
    // =====================================
    document.getElementById(
        "hari-libur-tanggal"
    ).value =
        getTodayWITA();
    // =====================================
    // RESET SEMUA LOKASI
    // =====================================
    const allCheckbox =
        document.getElementById(
            "hari-libur-all"
        );
    if (allCheckbox) {
        allCheckbox.checked = false;
    }
    const lokasiSelect =
        document.getElementById(
            "hari-libur-lokasi"
        );
    if (lokasiSelect) {
        lokasiSelect.disabled = false;
        lokasiSelect.innerHTML = `
            <option value="">
                Memuat lokasi...
            </option>
        `;
    }
    // =====================================
    // TAMPILKAN MODAL
    // =====================================
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    // =====================================
    // LOAD DATA LOKASI
    // =====================================
    await loadLokasiUntukHariLibur();
}
// =========================================================
// CLOSE MODAL
// =========================================================
function closeModalHariLibur() {
    const modal =
        document.getElementById(
            "modal-hari-libur"
        );
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}
// =========================================================
// TOGGLE LOKASI
// =========================================================
function toggleLokasiLibur() {
    const mode =
        document.querySelector(
            'input[name="libur-berlaku-mode"]:checked'
        )?.value;
    const wrapper =
        document.getElementById(
            "wrapper-lokasi-libur"
        );
    if (!wrapper) {
        return;
    }
    if (
        mode === "LOKASI"
    ) {
        wrapper.classList.remove(
            "hidden"
        );
    }
    else {
        wrapper.classList.add(
            "hidden"
        );
    }
}
// =========================================================
// TOGGLE SEMUA LOKASI
// =========================================================
function toggleSemuaLokasiHariLibur() {
    const allCheckbox =
        document.getElementById(
            "hari-libur-all"
        );
    const lokasiSelect =
        document.getElementById(
            "hari-libur-lokasi"
        );
    if (!allCheckbox || !lokasiSelect) {
        return;
    }
    if (allCheckbox.checked) {
        lokasiSelect.disabled = true;
        Array.from(
            lokasiSelect.options
        ).forEach(
            option => {
                option.selected = false;
            }
        );
    } else {
        lokasiSelect.disabled = false;
    }
}
// =========================================================
// EDIT
// =========================================================
async function editHariLibur(id) {
    // =====================================
    // CARI DATA
    // =====================================
    const item =
        hariLiburList.find(
            x =>
                Number(x.id) ===
                Number(id)
        );
    // =====================================
    // DATA TIDAK DITEMUKAN
    // =====================================
    if (!item) {
        await Swal.fire({
            icon: "error",
            title:
                "Data Tidak Ditemukan",
            text:
                "Data hari libur yang akan diedit tidak ditemukan.",
            confirmButtonText:
                "OK",
            confirmButtonColor:
                "#4F46E5"
        });
        return;
    }
    // =====================================
    // BUKA MODAL
    // =====================================
    openModalHariLibur();
    // =====================================
    // JUDUL MODAL
    // =====================================
    const titleEl =
        document.getElementById(
            "modal-hari-libur-title"
        );
    if (titleEl) {
        titleEl.innerText =
            "Edit Hari Libur";
    }
    // =====================================
    // ID DATA
    // =====================================
    const idEl =
        document.getElementById(
            "hari-libur-id"
        );
    if (idEl) {
        idEl.value =
            item.id;

    }
    // =====================================
    // TANGGAL
    // =====================================
    const tanggalEl =
        document.getElementById(
            "hari-libur-tanggal"
        );
    if (tanggalEl) {
        tanggalEl.value =
            String(
                item.tanggal || ""
            )
            .substring(
                0,
                10
            );
    }
    // =====================================
    // NAMA LIBUR
    // =====================================
    const namaEl =
        document.getElementById(
            "hari-libur-nama"
        );
    if (namaEl) {
        namaEl.value =
            item.nama_libur || "";
    }
    // =====================================
    // JENIS LIBUR
    // =====================================
    const jenisEl =
        document.getElementById(
            "hari-libur-jenis"
        );
    if (jenisEl) {
        jenisEl.value =
            item.jenis || "";
    }
    // =====================================
    // NORMALISASI BERLAKU
    // =====================================
    const berlaku =
        String(
            item.berlaku || ""
        )
        .trim()
        .toUpperCase();
    // =====================================
    // CHECKBOX SEMUA LOKASI
    // =====================================
    const allCheckbox =
        document.getElementById(
            "hari-libur-all"
        );
    // =====================================
    // SELECT LOKASI
    // =====================================
    const lokasiSelect =
        document.getElementById(
            "hari-libur-lokasi"
        );
    // =====================================
    // RESET PILIHAN LOKASI
    // =====================================
    if (lokasiSelect) {
        Array.from(
            lokasiSelect.options
        )
        .forEach(
            option => {
                option.selected =
                    false;
            }
        );
    }
    // =====================================
    // BERLAKU = ALL
    // =====================================
    if (
        berlaku === "ALL"
    ) {
        if (allCheckbox) {
            allCheckbox.checked =
                true;
        }
        // Tidak perlu memilih lokasi
        if (lokasiSelect) {
            lokasiSelect.disabled =
                true;
        }
    }
    // =====================================
    // BERLAKU = LOKASI TERTENTU
    // =====================================
    else {
        if (allCheckbox) {
            allCheckbox.checked =
                false;
        }
        if (lokasiSelect) {
            lokasiSelect.disabled =
                false;
        }
        const lokasiArray =
            berlaku
                .split(",")
                .map(
                    x =>
                        x
                        .trim()
                        .toUpperCase()
                )
                .filter(Boolean);
        // =================================
        // PILIH OPTION
        // =================================
        if (lokasiSelect) {
            Array.from(
                lokasiSelect.options
            )
            .forEach(
                option => {
                    const value =
                        String(
                            option.value || ""
                        )
                        .trim()
                        .toUpperCase();
                    option.selected =
                        lokasiArray.includes(
                            value
                        );
                }
            );
            // =================================
            // JIKA MENGGUNAKAN TOMSELECT
            // =================================
            if (
                lokasiSelect.tomselect
            ) {
                lokasiSelect.tomselect
                    .setValue(
                        lokasiArray
                    );
            }
        }
    }
    // =====================================
    // PASTIKAN TOGGLE SESUAI
    // =====================================
    if (
        typeof toggleSemuaLokasiHariLibur ===
        "function"
    ) {
        toggleSemuaLokasiHariLibur();
    }
}

function initHariLiburForm() {
    const form =
        document.getElementById(
            "form-hari-libur"
        );
    if (!form) {
        console.error(
            "Form hari libur tidak ditemukan"
        );
        return;
    }
    form.onsubmit = async function(event) {
        event.preventDefault();
        console.log(
            "FORM HARI LIBUR SUBMIT"
        );
        await saveHariLibur();
    };
}

//CEK DUPLIKAT
async function cekDuplikatHariLibur({
    id = "",
    tanggal,
    berlaku
}) {
    try {
        const {
            data,
            error
        } = await window.supabaseClient
            .from("hari_libur")
            .select(`
                id,
                tanggal,
                nama_libur,
                jenis,
                berlaku
            `)
            .eq(
                "tanggal",
                tanggal
            );
        if (error) {
            throw error;
        }
        const dataLain =
            (data || []).filter(
                item =>
                    String(item.id) !==
                    String(id)
            );
        if (!dataLain.length) {
            return null;
        }
        const lokasiBaru =
            String(
                berlaku || ""
            )
            .trim()
            .toUpperCase();
        // =====================================
        // DATA BARU = ALL
        // =====================================
        if (
            lokasiBaru === "ALL"
        ) {
            const duplikat =
                dataLain.find(
                    item =>
                        String(
                            item.berlaku || ""
                        )
                        .trim()
                        .toUpperCase() === "ALL"
                );
            if (duplikat) {
                return {
                    type: "ALL",
                    data: duplikat
                };
            }
            // ALL juga konflik dengan
            // semua lokasi pada tanggal tersebut
            if (dataLain.length > 0) {
                return {
                    type: "ALL_LOCATION",
                    data:
                        dataLain[0]
                };
            }
            return null;
        }
        // =====================================
        // DATA BARU = LOKASI TERTENTU
        // =====================================
        const lokasiBaruList =
            lokasiBaru
                .split(",")
                .map(
                    x =>
                        x.trim()
                            .toUpperCase()
                )
                .filter(Boolean);
        for (
            const item of dataLain
        ) {
            const lokasiLama =
                String(
                    item.berlaku || ""
                )
                .trim()
                .toUpperCase();
            // =================================
            // DATA LAMA = ALL
            // =================================
            if (
                lokasiLama === "ALL"
            ) {
                return {
                    type: "LOCATION_BY_ALL",
                    data: item
                };
            }
            // =================================
            // DATA LAMA = LOKASI
            // =================================
            const lokasiLamaList =
                lokasiLama
                    .split(",")
                    .map(
                        x =>
                            x.trim()
                                .toUpperCase()
                    )
                    .filter(Boolean);
            const bentrok =
                lokasiBaruList.some(
                    lokasi =>
                        lokasiLamaList.includes(
                            lokasi
                        )
                );
            if (bentrok) {
                return {
                    type: "LOCATION",
                    data: item
                };
            }
        }
        return null;
    }
    catch (error) {
        console.error(
            "cekDuplikatHariLibur:",
            error
        );
        throw error;
    }
}
// =========================================================
// SAVE
// =========================================================
async function saveHariLibur() {
    console.log(
        "saveHariLibur() dijalankan"
    );
    // =====================================
    // ELEMENT
    // =====================================
    const idEl =
        document.getElementById(
            "hari-libur-id"
        );
    const tanggalEl =
        document.getElementById(
            "hari-libur-tanggal"
        );
    const namaEl =
        document.getElementById(
            "hari-libur-nama"
        );
    const jenisEl =
        document.getElementById(
            "hari-libur-jenis"
        );
    const lokasiEl =
        document.getElementById(
            "hari-libur-lokasi"
        );
    const allEl =
        document.getElementById(
            "hari-libur-all"
        );
    const btn =
        document.getElementById(
            "btn-save-hari-libur"
        );
    // =====================================
    // AMBIL NILAI
    // =====================================
    const id =
        idEl?.value || "";
    const tanggal =
        tanggalEl?.value.trim() || "";
    const namaLibur =
        namaEl?.value.trim() || "";
    const jenis =
        jenisEl?.value || "";
    // =====================================
    // VALIDASI TANGGAL
    // =====================================
    if (!tanggal) {
        await Swal.fire({
            icon: "warning",
            title: "Tanggal Belum Diisi",
            text:
                "Silakan pilih tanggal hari libur.",
            confirmButtonText: "OK",
            confirmButtonColor: "#4F46E5"
        });
        tanggalEl?.focus();
        return;
    }
    // =====================================
    // VALIDASI NAMA LIBUR
    // =====================================
    if (!namaLibur) {
        await Swal.fire({
            icon: "warning",
            title: "Nama Libur Belum Diisi",
            text:
                "Silakan masukkan nama hari libur.",
            confirmButtonText: "OK",
            confirmButtonColor: "#4F46E5"
        });
        namaEl?.focus();
        return;
    }
    // =====================================
    // VALIDASI JENIS
    // =====================================
    if (!jenis) {
        await Swal.fire({
            icon: "warning",
            title: "Jenis Belum Dipilih",
            text:
                "Silakan pilih jenis hari libur.",
            confirmButtonText: "OK",
            confirmButtonColor: "#4F46E5"
        });
        jenisEl?.focus();
        return;
    }
    // =====================================
    // TENTUKAN LOKASI
    // =====================================
    let berlaku = "";
    if (
        allEl &&
        allEl.checked
    ) {
        berlaku = "ALL";
    }
    else {
        if (!lokasiEl) {
            await Swal.fire({
                icon: "error",
                title: "Lokasi Tidak Ditemukan",
                text:
                    "Dropdown lokasi tidak tersedia.",
                confirmButtonText: "OK",
                confirmButtonColor: "#4F46E5"
            });
            return;
        }
        const selected =
            Array.from(
                lokasiEl.selectedOptions
            )
            .map(
                option =>
                    String(
                        option.value
                    )
                    .trim()
                    .toUpperCase()
            )
            .filter(Boolean);
        if (
            selected.length === 0
        ) {
            await Swal.fire({
                icon: "warning",
                title: "Lokasi Belum Dipilih",
                text:
                    "Pilih minimal satu lokasi atau pilih Semua Lokasi.",
                confirmButtonText: "OK",
                confirmButtonColor: "#4F46E5"
            });
            return;
        }
        berlaku =
            selected.join(",");
    }
    // =====================================
    // PAYLOAD
    // =====================================
    const payload = {
        tanggal:
            tanggal,
        nama_libur:
            namaLibur,
        jenis:
            jenis,
        berlaku:
            berlaku
    };
    // =====================================
    // CEK DUPLIKAT
    // =====================================
    const duplikat =
        await cekDuplikatHariLibur({
            id,
            tanggal,
            berlaku
        });
    if (duplikat) {
        let pesan =
            "Sudah terdapat data hari libur pada tanggal tersebut.";
        if (
            duplikat.type === "ALL"
        ) {
            pesan =
                `Tanggal ${tanggal} sudah memiliki hari libur yang berlaku untuk semua lokasi.`;
        }
        else if (
            duplikat.type ===
            "ALL_LOCATION"
        ) {
            pesan =
                `Tanggal ${tanggal} sudah memiliki hari libur untuk lokasi tertentu. Data ALL tidak dapat ditambahkan.`;
        }
        else if (
            duplikat.type ===
            "LOCATION_BY_ALL"
        ) {
            pesan =
                `Tanggal ${tanggal} sudah memiliki hari libur yang berlaku untuk semua lokasi.`;
        }
        else if (
            duplikat.type ===
            "LOCATION"
        ) {
            pesan =
                `Tanggal ${tanggal} sudah memiliki hari libur untuk salah satu lokasi yang dipilih.`;
        }
        await Swal.fire({
            icon:
                "warning",
            title:
                "Data Duplikat",
            text:
                pesan,
            confirmButtonText:
                "OK",
            confirmButtonColor:
                "#4F46E5"
        });
        return;
    }
    console.log(
        "Payload Hari Libur:",
        payload
    );
    // =====================================
    // PROSES SIMPAN
    // =====================================
    try {
        // =================================
        // DISABLE BUTTON
        // =================================
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin mr-1"></i>
                Menyimpan...
            `;
        }
        // =================================
        // LOADING
        // =================================
        showLoader(
            id
                ? "Memperbarui data hari libur..."
                : "Menyimpan data hari libur..."
        );
        let saveError = null;
        // =================================
        // UPDATE
        // =================================
        if (id) {
            console.log(
                "MODE UPDATE:",
                id
            );
            const {
                error
            } =
                await window.supabaseClient
                    .from("hari_libur")
                    .update(payload)
                    .eq(
                        "id",
                        id
                    );
            saveError =
                error;
        }
        // =================================
        // INSERT
        // =================================
        else {
            console.log(
                "MODE INSERT"
            );
            const {
                error
            } =
                await window.supabaseClient
                    .from("hari_libur")
                    .insert([
                        payload
                    ]);
            saveError =
                error;
        }
        // =================================
        // CEK ERROR
        // =================================
        if (saveError) {
            throw saveError;
        }
        // =================================
        // REFRESH DATA
        //
        // LOADING MASIH AKTIF
        // =================================
        await loadHariLibur();
        // =================================
        // TUTUP MODAL
        // =================================
        closeModalHariLibur();
        // =================================
        // LOADING SELESAI
        // =================================
        hideLoader();
        // =================================
        // NOTIFIKASI BERHASIL
        //
        // BARU MUNCUL SETELAH SEMUANYA SELESAI
        // =================================
        await Swal.fire({
            icon: "success",
            title:
                id
                    ? "Berhasil Diperbarui"
                    : "Berhasil Disimpan",
            text:
                id
                    ? "Data hari libur berhasil diperbarui."
                    : "Data hari libur berhasil ditambahkan.",
            timer: 1800,
            showConfirmButton: false
        });
    }
    catch (error) {
        console.error(
            "saveHariLibur error:",
            error
        );
        // =================================
        // LOADING DIHENTIKAN
        // =================================
        hideLoader();
        // =================================
        // NOTIFIKASI ERROR
        // =================================
        await Swal.fire({
            icon: "error",
            title:
                "Gagal Menyimpan",
            text:
                error?.message ||
                "Terjadi kesalahan saat menyimpan data hari libur.",
            confirmButtonText:
                "OK",
            confirmButtonColor:
                "#4F46E5"
        });
    }
    finally {
        // =================================
        // KEMBALIKAN BUTTON
        // =================================
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <i class="fa-solid fa-save mr-1"></i>
                Simpan
            `;
        }
    }
}
// =========================================================
// DELETE
// =========================================================
async function deleteHariLibur(id) {
    // =====================================
    // CARI DATA
    // =====================================
    const item =
        hariLiburList.find(
            x =>
                Number(x.id) ===
                Number(id)
        );
    if (!item) {
        await Swal.fire({
            icon: "error",
            title: "Data Tidak Ditemukan",
            text:
                "Data hari libur yang ingin dihapus tidak ditemukan.",
            confirmButtonText: "OK",
            confirmButtonColor: "#4F46E5"
        });
        return;
    }
    // =====================================
    // KONFIRMASI HAPUS
    // =====================================
    const result =
        await Swal.fire({
            icon: "warning",
            title:
                "Hapus Data Libur?",
            html: `
                <div class="text-slate-600">
                    <p class="font-semibold text-slate-800 mb-1">
                        ${escapeHTML(
                            item.nama_libur || "-"
                        )}
                    </p>
                    <p>
                        ${formatTanggalLibur(
                            item.tanggal
                        )}
                    </p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText:
                "Ya, Hapus",
            cancelButtonText:
                "Batal",
            confirmButtonColor:
                "#dc2626",
            cancelButtonColor:
                "#64748b"
        });
    // =====================================
    // BATAL
    // =====================================
    if (
        !result.isConfirmed
    ) {
        return;
    }
    // =====================================
    // PROSES DELETE
    // =====================================
    try {
        // =================================
        // TAMPILKAN LOADING
        // =================================
        showLoader(
            "Menghapus data hari libur..."
        );
        // =================================
        // DELETE SUPABASE
        // =================================
        const {
            error
        } =
            await window.supabaseClient
                .from("hari_libur")
                .delete()
                .eq(
                    "id",
                    id
                );
        if (error) {
            throw error;
        }
        // =================================
        // REFRESH TABEL
        //
        // LOADING MASIH AKTIF
        // =================================
        await loadHariLibur();
        // =================================
        // LOADING SELESAI
        // =================================
        hideLoader();
        // =================================
        // NOTIFIKASI BERHASIL
        //
        // MUNCUL SETELAH TABEL SELESAI
        // =================================
        await Swal.fire({
            icon: "success",
            title:
                "Berhasil Dihapus",
            text:
                "Data hari libur berhasil dihapus.",
            timer: 1500,
            showConfirmButton: false
        });
    }
    catch (error) {
        console.error(
            "Delete hari libur error:",
            error
        );
        // =================================
        // PASTIKAN LOADING MATI
        // =================================
        hideLoader();
        // =================================
        // ERROR SWEETALERT
        // =================================
        await Swal.fire({
            icon: "error",
            title:
                "Gagal Menghapus",
            text:
                error?.message ||
                "Terjadi kesalahan saat menghapus data hari libur.",
            confirmButtonText:
                "OK",
            confirmButtonColor:
                "#4F46E5"
        });
    }
}
// =========================================================
// FORMAT TANGGAL
// =========================================================
function formatTanggalLibur(
    tanggal
) {
    if (!tanggal) {
        return "-";
    }
    const parts =
        String(
            tanggal
        )
        .substring(
            0,
            10
        )
        .split("-");
    if (
        parts.length !== 3
    ) {
        return tanggal;
    }
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
// =========================================================
// ERROR HELPER
// =========================================================
function showFieldError(
    id,
    message
) {
    const el =
        document.getElementById(
            id
        );
    if (!el) {
        return;
    }
    el.innerText =
        message;
    el.classList.remove(
        "hidden"
    );
}
// =========================================================
// CLEAR ERROR
// =========================================================
function clearErrorHariLibur() {
    [
        "error-libur-tanggal",
        "error-libur-nama"
    ]
    .forEach(
        id => {
            const el =
                document.getElementById(
                    id
                );
            if (el) {
                el.innerText =
                    "";
                el.classList.add(
                    "hidden"
                );
            }
        }
    );
}
// =========================================================
// ESCAPE HTML
// =========================================================
function escapeHTML(
    value
) {
    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );
}