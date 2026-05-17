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


// ===============================
// GPS
// ===============================
function startGPS() {
    if (!navigator.geolocation) {
        showToast("Browser tidak mendukung GPS", true);
        return;
    }

    document.getElementById("gps-status").innerText = "Mengambil lokasi...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            const distance = calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                AppState.appSettings.lat,
                AppState.appSettings.lng
            );

            document.getElementById("gps-status").innerText = "Aktif";
            document.getElementById("gps-distance").innerText =
                `${distance.toFixed(2)} meter`;

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


// ===============================
// SUBMIT ABSENSI
// ===============================
// async function submitAbsensi() {
//     const user = AppState.currentUser;

//     if (!user) {
//         showToast("User tidak ditemukan", true);
//         return;
//     }

//     if (!capturedPhoto) {
//         showToast("Ambil foto dulu", true);
//         return;
//     }

//     if (!currentLocation) {
//         showToast("Lokasi belum aktif", true);
//         return;
//     }

//     const jarak = calculateDistance(
//         currentLocation.lat,
//         currentLocation.lng,
//         AppState.appSettings.lat,
//         AppState.appSettings.lng
//     );

//     if (jarak > AppState.appSettings.radius) {
//         showToast(
//             `Anda berada di luar radius absensi (${jarak.toFixed(2)} m)`,
//             true
//         );
//         return;
//     }

//     try {
//         showLoader("Mengirim absensi...");

//         await ApiService.call({
//             action: "submit_absen",
//             username: user.username,
//             nama: user.nama,
//             kategori: user.kategori,
//             tipe: document.getElementById("absen-tipe").value,
//             fotoBase64: capturedPhoto,
//             lat: currentLocation.lat,
//             lng: currentLocation.lng,
//             jarak: jarak.toFixed(2)
//         });

//         showToast("Absensi berhasil");

//         resetAbsensi();

//     } catch (error) {
//         showToast(error.message, true);

//     } finally {
//         hideLoader();
//     }
// }
async function submitAbsensi() {

    const user = AppState.currentUser;

    // ===============================
    // VALIDASI USER
    // ===============================
    if (!user) {
        showToast("User tidak ditemukan", true);
        return;
    }

    // ===============================
    // VALIDASI FOTO
    // ===============================
    if (!capturedPhoto) {
        showToast("Ambil foto dulu", true);
        return;
    }

    // ===============================
    // VALIDASI GPS
    // ===============================
    if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
        showToast("Lokasi belum aktif", true);
        return;
    }

    // ===============================
    // HITUNG JARAK
    // ===============================
    const jarak = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        AppState.appSettings.lat,
        AppState.appSettings.lng
    );

    // ===============================
    // VALIDASI RADIUS
    // ===============================
    if (jarak > AppState.appSettings.radius) {
        showToast(
            `Anda berada di luar radius absensi (${jarak.toFixed(2)} m)`,
            true
        );
        return;
    }

    // ===============================
    // ANTI DOUBLE SUBMIT (SIMPLE LOCK)
    // ===============================
    if (window.__isSubmittingAbsensi) return;
    window.__isSubmittingAbsensi = true;

    try {
        showLoader("Mengirim absensi...");

        const res = await ApiService.call({
            action: "submit_absen",
            username: user.username,
            nama: user.nama,
            kategori: user.kategori,
            tipe: document.getElementById("absen-tipe").value,
            fotoBase64: capturedPhoto,
            lat: currentLocation?.lat || 0,
            lng: currentLocation?.lng || 0,
            jarak: jarak
        });

        if (res.status === "error") {
            showToast(res.message, true);
            return;
        }

        showToast("Absensi berhasil");

        // ===============================
        // RESET STATE ABSENSI
        // ===============================
        resetAbsensi();

        // ===============================
        // STOP CAMERA (IMPORTANT)
        // ===============================
        stopCamera?.();
        // 🔥 redirect ke dashboard sesuai role
        setTimeout(goToDashboardByRole, 800);

    } catch (error) {
        console.error("Submit absensi error:", error);
        showToast(error.message || "Gagal mengirim absensi", true);

    } finally {
        hideLoader();
        window.__isSubmittingAbsensi = false;
    }
}

// ===============================
// INIT FORM ABSENSI
// ===============================
function initAbsenForm() {

    // start camera ONLY HERE
    startCamera?.();

    // start GPS ONLY HERE
    startGPS?.();

    // cleanup hook (optional but recommended)
    pageCleanup = () => {
        stopCamera?.();
    };
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
