async function getRekapBulanan({
    mode,
    user,
    bulan,
    tahun,
    filterKategori = "ALL"
}) {
    try {
        // =========================================================
        // TIMEZONE SISTEM
        // =========================================================
        const TIMEZONE = "Asia/Makassar";
        // =========================================================
        // HELPER
        // =========================================================
        function getTanggalWITA(dateValue) {
            if (!dateValue) {
                return null;
            }
            const date = new Date(dateValue);
            if (Number.isNaN(date.getTime())) {
                return null;
            }
            return date.toLocaleDateString(
                "en-CA",
                {
                    timeZone: TIMEZONE
                }
            );
        }
        // =========================================================
        // TANGGAL SEKARANG WITA
        // =========================================================
        function getTanggalSekarangWITA() {
            return getTanggalWITA(new Date());
        }
        // =========================================================
        // CEK HARI LIBUR INDUSTRI
        // =========================================================
        function isHariLiburIndustri(
            kalender,
            namaHari
        ) {
            if (!kalender) {
                return false;
            }
            const value = kalender[namaHari];
            return (
                value === false ||
                value === 0 ||
                String(value)
                    .trim()
                    .toLowerCase() === "false" ||
                String(value)
                    .trim()
                    .toLowerCase() === "0"
            );
        }
        // =========================================================
        // AMBIL DATA SISWA
        // =========================================================
        let querySiswa =
            window.supabaseClient
                .from("users")
                .select(`
                    username,
                    nama_lengkap,
                    kategori,
                    lokasi_id,
                    p_id
                `)
                .eq(
                    "role",
                    "siswa"
                );
        // =========================================================
        // MODE WALI
        // =========================================================
        if (mode === "wali") {
            querySiswa =
                querySiswa.eq(
                    "kategori",
                    user.kategori
                );
        }
        // =========================================================
        // MODE PEMBIMBING
        // =========================================================
        else if (mode === "pembimbing") {
            querySiswa =
                querySiswa.eq(
                    "p_id",
                    user.pId
                );
        }
        // =========================================================
        // MODE ADMIN / KEPALA SEKOLAH
        // =========================================================
        else {
            if (
                filterKategori &&
                filterKategori !== "ALL"
            ) {
                querySiswa =
                    querySiswa.eq(
                        "kategori",
                        filterKategori
                    );
            }
        }
        // =========================================================
        // EXECUTE QUERY SISWA
        // =========================================================
        const {
            data: siswaData,
            error: siswaError
        } =
            await querySiswa;
        if (siswaError) {
            throw siswaError;
        }
        const siswa =
            siswaData || [];
        // =========================================================
        // JUMLAH HARI DALAM BULAN
        // =========================================================
        const jumlahHari =
            new Date(
                Number(tahun),
                Number(bulan),
                0
            ).getDate();
        // =========================================================
        // FORMAT TANGGAL
        // =========================================================
        const startDate =
            `${tahun}-${String(bulan).padStart(2, "0")}-01`;
        const endDate =
            `${tahun}-${String(bulan).padStart(2, "0")}-${String(jumlahHari).padStart(2, "0")}`;
        // =========================================================
        // DAFTAR USERNAME
        // =========================================================
        const usernames =
            siswa.map(
                s => s.username
            );
        // =========================================================
        // JIKA TIDAK ADA SISWA
        // =========================================================
        if (!usernames.length) {
            return {
                rekap: [],
                jumlahHari,
                kategoriList: []
            };
        }
        // =========================================================
        // AWAL BULAN WITA
        // =========================================================
        const startWITA =
            new Date(
                `${startDate}T00:00:00+08:00`
            );
        // =========================================================
        // BULAN BERIKUTNYA
        // =========================================================
        let nextMonth =
            Number(bulan) + 1;
        let nextYear =
            Number(tahun);
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        const nextMonthDate =
            `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
        // =========================================================
        // BATAS EXCLUSIVE
        // =========================================================
        const endExclusiveWITA =
            new Date(
                `${nextMonthDate}T00:00:00+08:00`
            );
        const startUTC =
            startWITA.toISOString();
        const endExclusiveUTC =
            endExclusiveWITA.toISOString();
        console.log(
            "REKAP BULAN",
            {
                startDate,
                endDate,
                startWITA:
                    startWITA.toString(),
                endWITA:
                    endExclusiveWITA.toString(),
                startUTC,
                endExclusiveUTC
            }
        );
        // =========================================================
        // AMBIL DATA ABSENSI
        // =========================================================
        const {
            data: absensiData,
            error: absensiError
        } =
            await window.supabaseClient
                .from("absensi")
                .select(`
                    username,
                    waktu,
                    tipe
                `)
                .in(
                    "username",
                    usernames
                )
                .gte(
                    "waktu",
                    startUTC
                )
                .lt(
                    "waktu",
                    endExclusiveUTC
                );
        if (absensiError) {
            throw absensiError;
        }
        // =========================================================
        // AMBIL STATUS HARIAN
        // =========================================================
        const {
            data: statusData,
            error: statusError
        } =
            await window.supabaseClient
                .from("status_harian")
                .select("*")
                .in(
                    "username",
                    usernames
                )
                .gte(
                    "tanggal",
                    startDate
                )
                .lte(
                    "tanggal",
                    endDate
                );
        if (statusError) {
            throw statusError;
        }
        // =========================================================
        // AMBIL HARI LIBUR
        // =========================================================
        const {
            data: hariLiburData,
            error: hariLiburError
        } =
            await window.supabaseClient
                .from("hari_libur")
                .select("*")
                .gte(
                    "tanggal",
                    startDate
                )
                .lte(
                    "tanggal",
                    endDate
                );
        if (hariLiburError) {
            throw hariLiburError;
        }
        // =========================================================
        // AMBIL KALENDER INDUSTRI
        // =========================================================
        const lokasiIds = [
            ...new Set(
                siswa
                    .map(
                        s =>
                            s.lokasi_id
                    )
                    .filter(Boolean)
            )
        ];
        let kalenderData = [];
        if (lokasiIds.length) {
            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from(
                        "kalender_industri"
                    )
                    .select("*")
                    .in(
                        "lokasi_id",
                        lokasiIds
                    );
            if (error) {
                throw error;
            }
            kalenderData =
                data || [];
        }
        // =========================================================
        // MAP ABSENSI
        // =========================================================
        const absensiMap = {};
        (
            absensiData || []
        ).forEach(
            a => {
                const tanggal =
                    getTanggalWITA(
                        a.waktu
                    );
                if (!tanggal) {
                    return;
                }
                const username =
                    String(
                        a.username || ""
                    )
                    .trim();
                if (!username) {
                    return;
                }
                const key =
                    `${username}_${tanggal}`;
                if (!absensiMap[key]) {
                    absensiMap[key] = {
                        masuk: false,
                        pulang: false
                    };
                }
                const tipe =
                    String(
                        a.tipe || ""
                    )
                    .trim()
                    .toLowerCase();
                // =================================================
                // MASUK
                // =================================================
                if (
                    tipe === "masuk"
                ) {
                    absensiMap[key].masuk =
                        true;
                }
                // =================================================
                // PULANG
                // =================================================
                else if (
                    tipe === "pulang"
                ) {
                    absensiMap[key].pulang =
                        true;
                }
            }
        );
        // =========================================================
        // DEBUG ABSENSI
        // =========================================================
        console.log(
            "ABSENSI DATA:",
            absensiData
        );
        console.log(
            "ABSENSI MAP:",
            absensiMap
        );
        // =========================================================
        // MAP STATUS HARIAN
        // =========================================================
        const statusMap = {};
        (
            statusData || []
        ).forEach(
            s => {
                const tanggal =
                    String(
                        s.tanggal || ""
                    )
                    .substring(
                        0,
                        10
                    );
                if (!tanggal) {
                    return;
                }
                const username =
                    String(
                        s.username || ""
                    )
                    .trim();
                if (!username) {
                    return;
                }
                const key =
                    `${username}_${tanggal}`;
                statusMap[key] =
                    s;
            }
        );
        // =========================================================
        // MAP HARI LIBUR
        // =========================================================
        const hariLiburMap = {};
        (
            hariLiburData || []
        ).forEach(
            item => {
                const tanggal =
                    String(
                        item.tanggal || ""
                    )
                    .substring(
                        0,
                        10
                    );
                if (!tanggal) {
                    return;
                }
                if (
                    !hariLiburMap[tanggal]
                ) {
                    hariLiburMap[tanggal] =
                        [];
                }
                hariLiburMap[tanggal]
                    .push(
                        item
                    );
            }
        );
        // =========================================================
        // MAP KALENDER INDUSTRI
        // =========================================================
        const kalenderMap = {};
        (
            kalenderData || []
        ).forEach(
            item => {
                const lokasiId =
                    String(
                        item.lokasi_id || ""
                    )
                    .trim()
                    .toUpperCase();
                if (!lokasiId) {
                    return;
                }
                kalenderMap[lokasiId] =
                    item;
            }
        );
        // =========================================================
        // TANGGAL SEKARANG WITA
        // =========================================================
        const todayWITA =
            getTanggalSekarangWITA();
        console.log(
            "TODAY WITA:",
            todayWITA
        );
        // =========================================================
        // REKAP SISWA
        // =========================================================
        const rekap =
            siswa.map(
                siswaItem => {
                    const harian = [];
                    let totalHadir = 0;
                    let totalDayOff = 0;
                    let totalIzin = 0;
                    let totalSakit = 0;
                    let totalPending = 0;
                    let totalBelum = 0;
                    let totalLiburNasional = 0;
                    let totalLiburIndustri = 0;
                    let totalWFH = 0;
                    let totalLupaAbsen = 0;
                    // =================================================
                    // NORMALISASI LOKASI
                    // =================================================
                    const lokasiId =
                        String(
                            siswaItem.lokasi_id || ""
                        )
                        .trim()
                        .toUpperCase();
                    const kalender =
                        kalenderMap[
                            lokasiId
                        ];
                    // =================================================
                    // LOOP SETIAP HARI
                    // =================================================
                    for (
                        let hari = 1;
                        hari <= jumlahHari;
                        hari++
                    ) {
                        const tanggal =
                            `${tahun}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}`;
                        const key =
                            `${siswaItem.username}_${tanggal}`;
                        // =================================================
                        // TANGGAL
                        // =================================================
                        const currentDate =
                            new Date(
                                Date.UTC(
                                    Number(tahun),
                                    Number(bulan) - 1,
                                    hari,
                                    12,
                                    0,
                                    0
                                )
                            );
                        const namaHari =
                            [
                                "minggu",
                                "senin",
                                "selasa",
                                "rabu",
                                "kamis",
                                "jumat",
                                "sabtu"
                            ][
                                currentDate.getUTCDay()
                            ];
                        // =================================================
                        // TANGGAL MASA DEPAN
                        // =================================================
                        const isFutureDate =
                            tanggal >
                            todayWITA;
                        if (isFutureDate) {
                            harian.push({
                                kode: "",
                                label:
                                    "Belum Berjalan"
                            });
                            continue;
                        }
                        // =================================================
                        // DEFAULT
                        // =================================================
                        let kode =
                            "-";
                        let label =
                            "Belum";
                        // =================================================
                        // DATA ABSENSI
                        // =================================================
                        const absensi =
                            absensiMap[key] ||
                            null;
                        const adaMasuk =
                            Boolean(
                                absensi?.masuk
                            );
                        const adaPulang =
                            Boolean(
                                absensi?.pulang
                            );
                        // =================================================
                        // DATA STATUS
                        // =================================================
                        const status =
                            statusMap[key] ||
                            null;
                        let approval =
                            "";
                        let statusValue =
                            "";
                        if (status) {
                            approval =
                                String(
                                    status.approval || ""
                                )
                                .trim()
                                .toLowerCase();
                            statusValue =
                                String(
                                    status.status || ""
                                )
                                .trim()
                                .toLowerCase();
                        }
                        // =================================================
                        // LIBUR NASIONAL
                        // =================================================
                        const daftarLibur =
                            hariLiburMap[
                                tanggal
                            ] || [];
                        const liburAktif =
                            daftarLibur.find(
                                item =>
                                    isLiburBerlakuUntukLokasi(
                                        item,
                                        lokasiId
                                    )
                            );
                        if (liburAktif) {
                            kode =
                                "LN";
                            label =
                                liburAktif.nama_libur;
                            totalLiburNasional++;
                        }
                        // =================================================
                        // LIBUR INDUSTRI
                        // =================================================
                        else if (
                            isHariLiburIndustri(
                                kalender,
                                namaHari
                            )
                        ) {
                            kode =
                                "LI";
                            label =
                                "Libur Industri";
                            totalLiburIndustri++;
                        }
                        // =================================================
                        // STATUS PENDING
                        // =================================================
                        else if (
                            approval ===
                            "pending"
                        ) {
                            kode =
                                "PD";
                            label =
                                "Pending";
                            totalPending++;
                        }
                        // =================================================
                        // STATUS APPROVED
                        // =================================================
                        else if (
                            approval ===
                            "approved"
                        ) {
                            switch (
                                statusValue
                            ) {
                                // =====================================
                                // LUPA ABSEN
                                // =====================================
                                case "lupa absen":
                                    /*
                                     * Jika sudah ada Masuk:
                                     *
                                     * M + Lupa Absen
                                     * = ML
                                     */
                                    if (
                                        adaMasuk
                                    ) {
                                        kode =
                                            "ML";
                                        label =
                                            "Masuk + Lupa Absen";
                                    }
                                    else {
                                        kode =
                                            "LA";
                                        label =
                                            "Lupa Absen";
                                    }
                                    totalLupaAbsen++;
                                    totalHadir++;
                                    break;
                                // =====================================
                                // WFH
                                // =====================================
                                case "wfh":
                                    kode =
                                        "W";
                                    label =
                                        "WFH";
                                    totalWFH++;
                                    totalHadir++;
                                    break;
                                // =====================================
                                // IZIN
                                // =====================================
                                case "izin":
                                    kode =
                                        "I";
                                    label =
                                        "Izin";
                                    totalIzin++;
                                    break;
                                // =====================================
                                // SAKIT
                                // =====================================
                                case "sakit":
                                    kode =
                                        "S";
                                    label =
                                        "Sakit";
                                    totalSakit++;
                                    break;
                                // =====================================
                                // DAY OFF
                                // =====================================
                                case "day off":
                                    kode =
                                        "D";
                                    label =
                                        "Day Off";
                                    totalDayOff++;
                                    break;
                                // =====================================
                                // STATUS TIDAK DIKENAL
                                // =====================================
                                default:
                                    /*
                                     * Jika status approved
                                     * tidak dikenal, tetap
                                     * prioritaskan absensi.
                                     */
                                    if (
                                        adaMasuk &&
                                        adaPulang
                                    ) {
                                        kode =
                                            "MP";
                                        label =
                                            "Masuk & Pulang";
                                        totalHadir++;
                                    }
                                    else if (
                                        adaMasuk
                                    ) {
                                        kode =
                                            "M";
                                        label =
                                            "Masuk";
                                        totalHadir++;
                                    }
                                    else {
                                        kode =
                                            "-";
                                        label =
                                            "Belum";
                                        totalBelum++;
                                    }
                                    break;
                            }
                        }
                        // =================================================
                        // TIDAK ADA STATUS APPROVED
                        // =================================================
                        else if (
                            adaMasuk &&
                            adaPulang
                        ) {
                            // =============================================
                            // MASUK + PULANG
                            // =============================================
                            kode =
                                "MP";
                            label =
                                "Masuk & Pulang";
                            totalHadir++;
                        }
                        // =================================================
                        // MASUK SAJA
                        // =================================================
                        else if (
                            adaMasuk
                        ) {
                            kode =
                                "M";
                            label =
                                "Masuk";
                            totalHadir++;
                        }
                        // =================================================
                        // BELUM ABSEN
                        // =================================================
                        else {
                            kode =
                                "-";
                            label =
                                "Belum";
                            totalBelum++;
                        }
                        // =================================================
                        // SIMPAN DATA HARIAN
                        // =================================================
                        harian.push({
                            kode,
                            label
                        });
                    }
                    // =================================================
                    // RETURN SISWA
                    // =================================================
                    return {
                        username:
                            siswaItem.username,
                        nama:
                            siswaItem.nama_lengkap,
                        kategori:
                            siswaItem.kategori,
                        lokasi_id:
                            siswaItem.lokasi_id,
                        harian,
                        totalHadir,
                        totalDayOff,
                        totalIzin,
                        totalSakit,
                        totalPending,
                        totalBelum,
                        totalLiburNasional,
                        totalLiburIndustri,
                        totalWFH,
                        totalLupaAbsen
                    };
                }
            );
        // =========================================================
        // KATEGORI LIST
        // =========================================================
        const kategoriList = [
            ...new Set(
                siswa
                    .map(
                        s =>
                            s.kategori
                    )
                    .filter(Boolean)
            )
        ].sort();
        // =========================================================
        // DEBUG
        // =========================================================
        console.log(
            "REKAP BULANAN:",
            rekap
        );
        // =========================================================
        // RETURN
        // =========================================================
        return {
            rekap,
            jumlahHari,
            kategoriList
        };
    }
    catch (error) {
        console.error(
            "getRekapBulanan:",
            error
        );
        throw error;
    }

}

// ===============================
// BADGE REKAP BULANAN
// ===============================
function getRekapBadgeClass(kode) {
    switch (
        String(kode || "")
        .trim()
        .toUpperCase()
    ) {
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
        // ======================
        // BARU
        // ======================
        case "LN":
            return "rekap-libur-nasional";
        case "LI":
            return "rekap-libur-industri"; 
        case "":
            return "rekap-future";
        default:
            return "rekap-kosong";
    }
}

// ===============================
// REKAP FILTER
// ===============================
function renderRekapKategoriFilter(kategoriList, selected = "ALL") {

    const select =
        document.getElementById("rekap-kategori");

    if (!select) return;

    // ===============================
    // NORMALISASI DATA
    // ===============================

    const list =
        [...new Set(
            (kategoriList || [])
                .map(k =>
                    String(k || "").trim()
                )
                .filter(Boolean)
        )]
        .sort((a, b) =>
            a.localeCompare(b, "id", {
                numeric: true
            })
        );


    // ===============================
    // SIMPAN NILAI YANG SEDANG DIPILIH
    // ===============================

    const currentValue =
        String(
            select.value || selected || "ALL"
        ).trim();


    // ===============================
    // BUAT OPTIONS
    // ===============================

    select.innerHTML = `
        <option value="ALL">
            Semua Kelas
        </option>

        ${list.map(k => `
            <option value="${escapeHTML(k)}">
                ${escapeHTML(k)}
            </option>
        `).join("")}
    `;


    // ===============================
    // KEMBALIKAN SELECTION
    // ===============================

    const valueToUse =
        list.includes(currentValue)
            ? currentValue
            : (
                list.includes(selected)
                    ? selected
                    : "ALL"
            );


    select.value = valueToUse;

}

// ===============================
// REKAP BULANAN SERVICE
// ===============================
const RekapBulananService = {
    async init(useLoader = true) {
        const now = new Date();
        const user = AppState.currentUser;
        if (!user) return;
        const role =
            String(user.role || "")
            .trim()
            .toLowerCase();
        const bulanEl =
            document.getElementById("rekap-bulan");
        const tahunEl =
            document.getElementById("rekap-tahun");
        const modeEl =
            document.getElementById("rekap-mode");
        const kategoriWrapper =
            document.getElementById("rekap-kategori-wrapper");
        if (bulanEl) {
            bulanEl.value =
                now.getMonth() + 1;
        }
        if (tahunEl && !tahunEl.value) {
            tahunEl.value =
                now.getFullYear();
        }
        if (role === "kepsek") {
            if (modeEl) {
                modeEl.value = "kepsek";
                modeEl.closest("div")
                    ?.classList
                    .add("hidden");
            }
            kategoriWrapper
                ?.classList
                .remove("hidden");
        } else {
            if (modeEl) {
                modeEl.closest("div")
                    ?.classList
                    .remove("hidden");
                modeEl.value =
                    AppState.monitoringMode ||
                    "wali";
            }
            kategoriWrapper
                ?.classList
                .add("hidden");
        }
        await this.load(useLoader);
    },
    // ===============================
    // LOAD
    // ===============================
    async load(useLoader = false) {
    try {
        const user =
            AppState.currentUser;
        if (!user) return;
        if (useLoader) {
            showLoader(
                "Memuat rekap bulanan..."
            );
        }
        const data =
            await this.getData();
        // simpan hasil terakhir
        AppState.lastRekapBulanan =
            data;
        const role =
            String(user.role || "")
            .trim()
            .toLowerCase();
        const filterKategori =
            document.getElementById(
                "rekap-kategori"
            )?.value || "ALL";
        if (
                role === "kepsek" &&
                typeof renderRekapKategoriFilter === "function"
            ) {
                const kategoriSelect =
                    document.getElementById(
                        "rekap-kategori"
                    );
                // Hanya render pertama kali
                if (
                    kategoriSelect &&
                    kategoriSelect.options.length <= 1
                ) {
                    renderRekapKategoriFilter(
                        data.kategoriList || [],
                        "ALL"
                    );
                }
            }
        this.render(data);
    }
        catch (error) {
            console.error(
                "RekapBulananService:",
                error
            );
            showToast(
                "Gagal memuat rekap bulanan",
                true
            );
        }
        finally {
            hideLoader();
        }
    },
    // ===============================
    // GET DATA
    // ===============================
    async getData() {
        const user =
            AppState.currentUser;
        const role =
            String(user.role || "")
            .trim()
            .toLowerCase();
        const now = new Date();

        const bulan =
            Number(
                document.getElementById("rekap-bulan")?.value
            ) || (now.getMonth() + 1);
        const tahun =
            Number(
                document.getElementById("rekap-tahun")?.value
            ) || now.getFullYear();
        const mode =
            role === "kepsek"
                ? "kepsek"
                : document.getElementById(
                    "rekap-mode"
                )?.value || "wali";
        const filterKategori =
            document.getElementById(
                "rekap-kategori"
            )?.value || "ALL";
        return await getRekapBulanan({
            bulan,
            tahun,
            mode,
            filterKategori,
            user
        });
    },
    // ===============================
    // RENDER
    // ===============================
    render(data) {
        const rekap =
            data.rekap || [];
        const jumlahHari =
            data.jumlahHari || 31;
        const head =
            document.getElementById(
                "rekap-head"
            );
        const body =
            document.getElementById(
                "rekap-body"
            );
        const empty =
            document.getElementById(
                "rekap-empty"
            );
        const wrapper =
            document.getElementById(
                "rekap-table-wrapper"
            );
        if (!head || !body) return;
        if (
            $.fn.DataTable.isDataTable(
                "#rekap-table"
            )
        ) {
            $("#rekap-table")
                .DataTable()
                .clear()
                .destroy();
        }
        if (empty) {
            empty.classList.add(
                "hidden"
            );
            empty.innerHTML = "";
        }
        if (wrapper) {
            wrapper.classList.remove(
                "hidden"
            );
        }
        if (!rekap.length) {
            if (wrapper) {
                wrapper.classList.add(
                    "hidden"
                );
            }
            if (empty) {
                empty.classList.remove(
                    "hidden"
                );
                empty.innerHTML = `
                    Tidak ada data siswa untuk mode ini.
                `;
            }
            return;
        }
        let tanggalHeader = "";
        for (
            let i = 1;
            i <= jumlahHari;
            i++
        ) {
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
                <th style="min-width:220px">
                    Nama
                </th>
                <th style="min-width:140px">
                    Kelas
                </th>
                ${tanggalHeader}
                <th>Hadir</th>
                <th>Day Off</th>
                <th>Izin</th>
                <th>Sakit</th>
                <th>Pending</th>
                <th>Belum</th>
            </tr>
        `;
        // ===============================
        // BODY
        // ===============================
        body.innerHTML =
            rekap.map(r => {
                const hariCells =
                    (r.harian || [])
                    .map(h => `
                        <td class="text-center">
                            <span
                                class="rekap-badge ${getRekapBadgeClass(h.kode)}"
                                title="${h.label}">
                                ${h.kode}
                            </span>
                        </td>
                    `)
                    .join("");
                return `
                    <tr>
                        <td class="font-medium whitespace-nowrap">
                            ${r.nama || "-"}
                        </td>
                        <td class="whitespace-nowrap">
                            ${r.kategori || "-"}
                        </td>
                        ${hariCells}
                        <td class="text-center font-bold text-green-700">
                            ${r.totalHadir || 0}
                        </td>
                        <td class="text-center font-bold text-amber-700">
                            ${r.totalDayOff || 0}
                        </td>
                        <td class="text-center font-bold text-indigo-700">
                            ${r.totalIzin || 0}
                        </td>
                        <td class="text-center font-bold text-red-700">
                            ${r.totalSakit || 0}
                        </td>
                        <td class="text-center font-bold text-orange-700">
                            ${r.totalPending || 0}
                        </td>
                        <td class="text-center font-bold text-slate-500">
                            ${r.totalBelum || 0}
                        </td>
                    </tr>
                `;
            }).join("");
        $("#rekap-table").DataTable({
            pageLength: 10,
            lengthMenu: [
                10,
                25,
                50,
                100
            ],
            ordering: true,
            searching: true,
            scrollX: true,
            autoWidth: true,
            destroy: true,
            columnDefs: [
                {
                    targets: [0, 1],
                    orderable: true
                },
                {
                    targets: "_all",
                    orderable: false
                }
            ],
            language: {
                search: "Cari:",
                lengthMenu:
                    "Tampilkan _MENU_ data",
                info:
                    "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                zeroRecords:
                    "Data tidak ditemukan",
                infoEmpty:
                    "Tidak ada data",
                paginate: {
                    next: "›",
                    previous: "‹"
                }
            }
        });
    }
};

// ===============================
// GENERATE PDF
// ===============================
async function generateRekapPDF() {
    const data =
        AppState.lastRekapBulanan;
    if (!data) {
        showToast(
            "Data rekap belum tersedia",
            true
        );
        return;
    }
    const { jsPDF } =
        window.jspdf;
    const doc =
        new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a3"
        });
    const pageWidth =
        doc.internal.pageSize.getWidth();
    const rekap =
        data.rekap || [];
    const jumlahHari =
        data.jumlahHari || 31;
    const bulanAngka =
        document.getElementById("rekap-bulan")?.value;
    const tahun =
        document.getElementById("rekap-tahun")?.value || "";
    const mode =
        document.getElementById("rekap-mode")?.value || "wali";
    const namaBulan =
        getNamaBulan(bulanAngka);
    const namaPenanggungJawab =
        AppState.currentUser?.nama ||
        AppState.currentUser?.namaLengkap ||
        "-";
    const logo =
        document.getElementById(
            "logo-sekolah"
        );
    // =====================================
    // HEADER
    // =====================================
    try {
        if (
            logo &&
            logo.complete
        ) {
            const canvas =
                document.createElement(
                    "canvas"
                );
            canvas.width =
                logo.naturalWidth;
            canvas.height =
                logo.naturalHeight;
            const ctx =
                canvas.getContext(
                    "2d"
                );
            ctx.drawImage(
                logo,
                0,
                0
            );
            const logoBase64 =
                canvas.toDataURL(
                    "image/png"
                );
            doc.addImage(
                logoBase64,
                "PNG",
                pageWidth / 2 - 12,
                8,
                24,
                24
            );
        }
    }
    catch (err) {
        console.log(
            "Logo gagal dimuat"
        );
    }
    doc.setFontSize(16);
    doc.setFont("DejaVuSans", "normal");
    // doc.setFont(
    //     "helvetica",
    //     "bold"
    // );
    doc.text(
        "SMK BINTANG PERSADA DENPASAR",
        pageWidth / 2,
        40,
        {
            align: "center"
        }
    );
    doc.setFontSize(13);
    doc.text(
        `Rekap Absensi Bulanan Periode ${namaBulan} ${tahun}`,
        pageWidth / 2,
        47,
        {
            align: "center"
        }
    );
    // =====================================
    // HEADER TABLE
    // =====================================
    const head = [[
        "No",
        "Nama",
        "Kelas",
        ...Array.from(
            {
                length:
                    jumlahHari
            },
            (_, i) =>
                String(i + 1)
        ),
        "H",
        "D",
        "I",
        "S",
        "PD",
        "B"
    ]];
    // =====================================
    // BODY TABLE
    // =====================================
    const body =
        rekap.map(
            (
                r,
                index
            ) => [
                index + 1,
                r.nama || "",
                r.kategori || "",
                ...(r.harian || [])
                .map(
                    h => h.kode || ""
                ),
                r.totalHadir || 0,
                r.totalDayOff || 0,
                r.totalIzin || 0,
                r.totalSakit || 0,
                r.totalPending || 0,
                r.totalBelum || 0
            ]
        );
    // =====================================
    // COLUMN STYLE
    // =====================================
    const columnStyles = {
        0: {
            cellWidth: 8,
            halign: "center"
        },
        1: {
            cellWidth: 45,
            halign: "left"
        },
        2: {
            cellWidth: 25
        }
    };
    for (
        let i = 3;
        i < (3 + jumlahHari);
        i++
    ) {
        columnStyles[i] = {
            cellWidth: 8,
            halign: "center"
        };
    }
    const startRekap =
        3 + jumlahHari;
    columnStyles[startRekap] = {
        cellWidth: 10
    };
    columnStyles[startRekap + 1] = {
        cellWidth: 10
    };
    columnStyles[startRekap + 2] = {
        cellWidth: 10
    };
    columnStyles[startRekap + 3] = {
        cellWidth: 10
    };
    columnStyles[startRekap + 4] = {
        cellWidth: 10
    };
    columnStyles[startRekap + 5] = {
        cellWidth: 10
    };
    // =====================================
    // TABLE
    // =====================================
    doc.autoTable({
        startY: 55,
        theme: "grid",
        head,
        body,
        columnStyles,
        styles: {
            font: "DejaVuSans",
            fontStyle: "normal",
            fontSize: 6,
            halign: "center",
            valign: "middle",
            lineColor: [0,0,0],
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [230, 230, 230],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            lineColor: [0, 0, 0],
            lineWidth: 0.2
        },
        alternateRowStyles: {
            fillColor: [240, 247, 255]
        },
        didParseCell: function(dataCell) {
            if (
                dataCell.section !== "body"
            ) return;
            const row =
                rekap[
                    dataCell.row.index
                ];
            const dayColumnStart = 3;
            const dayColumnEnd =
                3 + jumlahHari - 1;
            if (
                dataCell.column.index < dayColumnStart ||
                dataCell.column.index > dayColumnEnd
            ) {
                return;
            }
            const hariIndex =
                dataCell.column.index - 3;
            const hariData =
                row.harian?.[
                    hariIndex
                ];
            const kode =
                String(
                    hariData?.kode || ""
                )
                .trim()
                .toUpperCase();
            // =====================
            // HADIR
            // =====================
            if (
                kode === "MP" ||
                kode === "M" ||
                kode === "P" ||
                kode === "ML"
            ) {
                dataCell.cell.text =
                    [""];
                dataCell.cell.styles.fillColor =
                    [255,255,255];
            }
            // =====================
            // LIBUR INDUSTRI
            // =====================
            else if (
                kode === "LI"
            ) {
                dataCell.cell.text =
                    ["-"];

                dataCell.cell.styles.fillColor =
                    [255,235,235];

                dataCell.cell.styles.textColor =
                    [120,120,120];
            }
            // =====================
            // LIBUR NASIONAL
            // =====================
            else if (
                kode === "LN"
            ) {
                dataCell.cell.styles.fillColor =
                    [254,243,199];
                dataCell.cell.styles.textColor =
                    [180,83,9];
                dataCell.cell.styles.fontStyle =
                    "bold";
            }
            // =====================
            // IZIN
            // =====================
            else if (
                kode === "I"
            ) {
                dataCell.cell.styles.textColor =
                    [96,165,250];
            }
            // =====================
            // SAKIT
            // =====================
            else if (
                kode === "S"
            ) {

                dataCell.cell.styles.textColor =
                    [245,158,11];
            }
            // =====================
            // DAY OFF
            // =====================
            else if (
                kode === "D"
            ) {
                dataCell.cell.styles.textColor =
                    [245,158,11];
            }
            // =====================
            // PENDING
            // =====================
            else if (
                kode === "PD"
            ) {
                dataCell.cell.styles.textColor =
                    [217,119,6];

                dataCell.cell.styles.fontStyle =
                    "bold";
            }
        },
        didDrawCell: function(dataCell) {
            if (
                dataCell.section !== "body"
            ) return;
            const row =
                rekap[
                    dataCell.row.index
                ];
            const dayColumnStart = 3;
            const dayColumnEnd =
                3 + jumlahHari - 1;
            if (
                dataCell.column.index < dayColumnStart ||
                dataCell.column.index > dayColumnEnd
            ) {
                return;
            }
            const hariIndex =
                dataCell.column.index - 3;
            const hariData =
                row.harian?.[
                    hariIndex
                ];
            const kode =
                String(
                    hariData?.kode || ""
                )
                .trim()
                .toUpperCase();
            if (
                kode === "MP" ||
                kode === "M" ||
                kode === "P" ||
                kode === "ML"
            ) {
                doc.setFont(
                    "DejaVuSans",
                    "normal"
                );
                doc.setFontSize(
                    10
                );
                doc.setTextColor(
                    22,
                    163,
                    74
                );
                doc.text(
                    "✔",
                    dataCell.cell.x +
                    (
                        dataCell.cell.width / 2
                    ),
                    dataCell.cell.y +
                    (
                        dataCell.cell.height / 2
                    ) + 1.5,
                    {
                        align: "center"
                    }
                );
            }
        }
    });
    // =====================================
    // FOOTER
    // =====================================
    const finalY =
        doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text(
        "Keterangan: ✔=Hadir | D=Day Off | I=Izin | S=Sakit | LA=Lupa Absen | W=WFH | PD=Pending",
        14,
        doc.lastAutoTable.finalY + 10
    );
    doc.text(
        "Denpasar, " +
        new Date()
        .toLocaleDateString(
            "id-ID"
        ),
        300,
        finalY
    );
    doc.text(
        mode ===
        "pembimbing"
            ? "Pembimbing PKL"
            : "Wali Kelas",
        40,
        finalY + 10
    );
    doc.text(
        "Kepala Sekolah",
        300,
        finalY + 10
    );
    doc.text(
        `(${namaPenanggungJawab})`,
        40,
        finalY + 35
    );
    doc.text(
        "( Ida Ayu Ary Pradnyawati, S.Pd., M.Pd. )",
        300,
        finalY + 35
    );
    // =====================================
    // SAVE
    // =====================================
    const modeLabel =
        mode ===
        "pembimbing"
            ? "Pembimbing"
            : "Wali";
    doc.save(
        `Rekap_${modeLabel}_${namaBulan}_${tahun}.pdf`
    );
}

// =====================================
// GET NAMA BULAN
// =====================================
function getNamaBulan(bulan) {
    const bulanIndonesia = [
        "",
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];
    return bulanIndonesia[
        Number(bulan)
    ] || bulan;
}