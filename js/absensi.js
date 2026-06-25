// ===============================
// ABSENSI
// ===============================

let currentLocation = null;
let currentStream = null;
let capturedPhoto = null;


// ===============================
// START CAMERA
// ===============================
async function startCamera() {
    try {
        const video = document.getElementById("kamera-video");

        if (!video) return;

        stopCamera();

        currentStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user"
            }
        });

        video.srcObject = currentStream;

    } catch (error) {
        console.error(error);
        showToast("Tidak bisa mengakses kamera", true);
    }
}


// ===============================
// STOP CAMERA
// ===============================
function stopCamera() {
    if (!currentStream) return;

    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
}

async function loadUserLocation() {
    try {
        const user = AppState.currentUser;

        if (!user?.lokasiId) {
            throw new Error("Lokasi PKL belum diatur");
        }

        const lokasi = await ApiService.call({
            action: "get_user_location",
            lokasiId: user.lokasiId
        });

        AppState.currentUserLocation = lokasi;

        const lokasiEl = document.getElementById("lokasi-industri");
        if (lokasiEl) {
            lokasiEl.innerText = lokasi.namaIndustri;
        }

    } catch (error) {
        console.error("Load lokasi gagal:", error);
        showToast(error.message || "Gagal memuat lokasi PKL", true);
    }
}

function startGPS() {
    if (!navigator.geolocation) {
        showToast("Browser tidak mendukung GPS", true);
        return;
    }

    if (!AppState.currentUserLocation) {
        showToast("Lokasi PKL belum tersedia", true);
        return;
    }

    document.getElementById("gps-status").innerText = "Mengambil lokasi...";

    navigator.geolocation.getCurrentPosition(
        (position) => {

            AppState.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            const distance = calculateDistance(
                AppState.currentLocation.lat,
                AppState.currentLocation.lng,
                AppState.currentUserLocation.lat,
                AppState.currentUserLocation.lng
            );

            document.getElementById("gps-status").innerText = "Aktif";

            document.getElementById("gps-distance").innerText =
                `${Math.round(distance)} meter`

        },
        () => {
            showToast("Gagal mendapatkan lokasi", true);
            document.getElementById("gps-status").innerText = "Gagal";
        },
        {
            enableHighAccuracy: true
        }
    );
}


// ===============================
// HITUNG JARAK (HAVERSINE)
// ===============================
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function toRad(value) {
    return value * Math.PI / 180;
}


// ===============================
// SNAPSHOT
// ===============================
function takeSnapshot() {
    const video = document.getElementById("kamera-video");
    const canvas = document.getElementById("kamera-canvas");
    const preview = document.getElementById("kamera-preview");

    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    capturedPhoto = canvas.toDataURL("image/jpeg", 0.8);

    preview.src = capturedPhoto;

    video.classList.add("hidden-page");
    preview.classList.remove("hidden-page");

    document.getElementById("btn-snap")
        .classList.add("hidden-page");

    document.getElementById("btn-retake")
        .classList.remove("hidden-page");
}


// ===============================
// RETAKE
// ===============================
function retakeSnapshot() {
    capturedPhoto = null;

    document.getElementById("kamera-video")
        .classList.remove("hidden-page");

    document.getElementById("kamera-preview")
        .classList.add("hidden-page");

    document.getElementById("btn-snap")
        .classList.remove("hidden-page");

    document.getElementById("btn-retake")
        .classList.add("hidden-page");
}


// ===============================
// RESET ABSENSI
// ===============================
function resetAbsensi() {

    capturedPhoto = null;

    const video = document.getElementById("kamera-video");
    const preview = document.getElementById("kamera-preview");

    // reset UI kamera
    video?.classList.remove("hidden-page");
    preview?.classList.add("hidden-page");

    document.getElementById("btn-snap")?.classList.remove("hidden-page");
    document.getElementById("btn-retake")?.classList.add("hidden-page");

    // reset status GPS (optional)
    document.getElementById("gps-status").innerText = "";
    document.getElementById("gps-distance").innerText = "";
}

const buttons = document.querySelectorAll(".absen-btn");

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        buttons.forEach(b => {
            b.classList.remove(
                "active-masuk",
                "active-pulang"
            );
        });

        const value = btn.dataset.value;

        if (value === "Masuk") {
            btn.classList.add("active-masuk");
        } else {
            btn.classList.add("active-pulang");
        }

        document.getElementById("absen-tipe").value =
            value;
    });

});

async function submitAbsensi() {
    const user = AppState.currentUser;

    if (!user) {
        showToast("User tidak ditemukan", true);
        return;
    }

    if (!capturedPhoto) {
        showToast("Ambil foto dulu", true);
        return;
    }

    if (!AppState.currentLocation) {
        showToast("Lokasi belum aktif", true);
        return;
    }

    if (!AppState.currentUserLocation) {
        showToast("Lokasi PKL belum tersedia", true);
        return;
    }

    const jarak = calculateDistance(
        AppState.currentLocation.lat,
        AppState.currentLocation.lng,
        AppState.currentUserLocation.lat,
        AppState.currentUserLocation.lng
    );

    if (jarak > AppState.currentUserLocation.radius) {
        showToast(
            `Anda berada di luar radius absensi (${jarak.toFixed(2)} m)`,
            true
        );
        return;
    }

    if (window.__isSubmittingAbsensi) return;
    window.__isSubmittingAbsensi = true;

    try {
        showLoader("Mengirim absensi...");

        const res = await ApiService.call({
            action: "submit_absen",
            username: user.username,
            nama: user.nama,
            kategori: user.kategori,
            lokasiId: user.lokasiId,
            tipe: document.getElementById("absen-tipe").value,
            fotoBase64: capturedPhoto,
            lat: AppState.currentLocation.lat,
            lng: AppState.currentLocation.lng,
            jarak: jarak
        });

        if (res.status === "error") {
            showToast(res.message, true);
            return;
        }

        showToast("Absensi berhasil");

        resetAbsensi();

        stopCamera?.();

        setTimeout(goToDashboardByRole, 800);

    } catch (error) {
        console.error("Submit absensi error:", error);
        showToast(
            error.message || "Gagal mengirim absensi",
            true
        );

    } finally {
        hideLoader();
        window.__isSubmittingAbsensi = false;
    }
}

// async function initAbsenForm() {
//     await loadUserLocation();

//     startCamera?.();
//     startGPS?.();

//     pageCleanup = () => {
//         stopCamera?.();
//     };
// }
async function initAbsenForm() {
    const user = AppState.currentUser;
    if (!user) return;

    try {
        showLoader("Memeriksa status hari ini...");

        const status = await ApiService.call({
            action: "cek_status_harian",
            username: user.username
        });

        if (status.ada && !status.bolehAbsen) {
            hideLoader();

            Swal.fire({
                icon: "info",
                title: "Absensi Dinonaktifkan",
                html: `
                    <div style="text-align:left">
                        <p>Hari ini Anda sudah mengirim status:</p>
                        <p><b>${status.status}</b></p>
                        <p>Status Approval: <b>${status.approval}</b></p>
                        ${
                            status.keterangan
                                ? `<p>Keterangan: ${status.keterangan}</p>`
                                : ""
                        }
                    </div>
                `,
                confirmButtonColor: "#4f46e5"
            }).then(() => {
                navigateTo("page-user-dashboard");
            });

            return;
        }

        await loadUserLocation();

        startCamera?.();
        startGPS?.();

        pageCleanup = () => {
            stopCamera?.();
        };

    } catch (error) {
        console.error("Init absen error:", error);
        showToast("Gagal membuka halaman absensi", true);

    } finally {
        hideLoader();
    }
}

// ===============================
// CLEANUP ABSENSI PAGE
// ===============================
PageLifecycle.onLeave["page-user-absen"] = () => {
    stopCamera?.();

    // optional reset state biar bersih
    currentLocation = null;
    capturedPhoto = null;
};

function goToDashboardByRole() {
    const role = AppState.currentUser?.role;

    const map = {
        admin: "page-admin-dashboard",
        wali: "page-wali-dashboard",
        siswa: "page-user-dashboard"
    };

    navigateTo(map[role] || "page-user-dashboard");
}
