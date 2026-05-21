// ===============================
// CAMERA MANAGER (GLOBAL SAFE)
// ===============================

let cameraStream = null;

// START CAMERA
// async function startCamera() {
//     try {
//         const video = document.getElementById("kamera-video");
//         if (!video) return;

//         cameraStream = await navigator.mediaDevices.getUserMedia({
//             video: true
//         });

//         video.srcObject = cameraStream;

//     } catch (error) {
//         console.error("Camera error:", error);
//         showToast("Tidak bisa mengakses kamera", true);
//     }
// }
async function startCamera() {
    try {
        const video = document.getElementById("kamera-video");
        if (!video) return;

        // iPhone / Safari fix
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.muted = true;
        video.autoplay = true;

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user"
            },
            audio: false
        });

        video.srcObject = cameraStream;

        await video.play();

    } catch (error) {
        console.error("Camera error:", error);
        showToast("Tidak bisa mengakses kamera", true);
    }
}

// STOP CAMERA (TOTAL SAFE)
function stopCamera() {
    try {
        if (!cameraStream) return;

        cameraStream.getTracks().forEach(track => {
            track.stop();
        });

        cameraStream = null;

        const video = document.getElementById("kamera-video");
        if (video) {
            video.srcObject = null;
        }

    } catch (error) {
        console.warn("Stop camera error:", error);
    }
}