// ===============================
// ADMIN FUNCTIONS
// ===============================

// ===============================
// DASHBOARD ADMIN
// ===============================
async function loadAdminDashboardStats() {
    try {
        const users = await ApiService.call({
            action: "get_users"
        });

        const riwayat = await ApiService.call({
            action: "get_riwayat",
            role: "admin",
            username: AppState.currentUser.username
        });

        document.getElementById("stat-total-peserta").innerText =
            users.length;

        document.getElementById("stat-total-riwayat").innerText =
            riwayat.length;

        const today = new Date().toLocaleDateString("id-ID");

        const todayCount = riwayat.filter(r =>
            r.timestamp.includes(today)
        ).length;

        document.getElementById("stat-absen-today").innerText =
            todayCount;

    } catch (error) {
        console.error(error);
        showToast("Gagal memuat dashboard admin", true);
    }
}

// ===============================
// LOAD USERS
// ===============================
async function loadUsers() {
    try {
        const users = await ApiService.call({
            action: "get_users"
        });

        const tbody =
            document.getElementById("table-users-body");

        if (!tbody) return;

        tbody.innerHTML = "";

        users.forEach(user => {
            tbody.innerHTML += `
                <tr>
                    <td>${user.nama}</td>
                    <td>${user.username}</td>
                    <td>${user.kategori || "-"}</td>
                    <td>${user.role}</td>
                    <td>
                        <button
                            onclick="deleteUser('${user.username}')"
                            class="btn-danger">
                            Hapus
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error(error);
        showToast("Gagal memuat data user", true);
    }
}

// ===============================
// ADD USER
// ===============================
async function handleAddUser(e) {
    e.preventDefault();

    const nama =
        document.getElementById("add-nama").value.trim();

    const username =
        document.getElementById("add-username").value.trim();

    const password =
        document.getElementById("add-password").value.trim();

    const kategori =
        document.getElementById("add-kategori").value.trim();

    if (!nama || !username || !password) {
        showToast("Lengkapi semua data", true);
        return;
    }

    try {
        showLoader("Menambah user...");

        await ApiService.call({
            action: "save_user",
            nama,
            username,
            password,
            kategori
        });

        showToast("User berhasil ditambahkan");

        document.getElementById("form-add-user").reset();

        loadUsers();
        loadAdminDashboardStats();

    } catch (error) {
        console.error(error);
        showToast(error.message, true);
    } finally {
        hideLoader();
    }
}

// ===============================
// DELETE USER
// ===============================
async function deleteUser(username) {
    if (!confirm("Hapus user ini?")) return;

    try {
        await ApiService.call({
            action: "delete_user",
            username
        });

        showToast("User dihapus");

        loadUsers();
        loadAdminDashboardStats();

    } catch (error) {
        showToast(error.message, true);
    }
}

// ===============================
// POPULATE SETTINGS FORM
// ===============================
function populateLocationSettingsForm() {
    if (!AppState.appSettings) return;

    document.getElementById("set-lat").value =
        AppState.appSettings.lat || "";

    document.getElementById("set-lng").value =
        AppState.appSettings.lng || "";

    document.getElementById("set-radius").value =
        AppState.appSettings.radius || "";
}

// ===============================
// SAVE SETTINGS
// ===============================
async function handleSaveLocationSettings(e) {
    e.preventDefault();

    const lat =
        document.getElementById("set-lat").value;

    const lng =
        document.getElementById("set-lng").value;

    const radius =
        document.getElementById("set-radius").value;

    try {
        await ApiService.call({
            action: "save_settings",
            lat,
            lng,
            radius
        });

        AppState.appSettings = {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius: parseInt(radius)
        };

        localStorage.setItem(
            "absen_settings",
            JSON.stringify(AppState.appSettings)
        );

        showToast("Pengaturan disimpan");

    } catch (error) {
        showToast(error.message, true);
    }
}