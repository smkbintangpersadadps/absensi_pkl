// ===============================
// CONFIG APP
// ===============================

const CONFIG = {
    IS_PREVIEW: false, // true = pakai dummy data
    GAS_URL: "https://script.google.com/macros/s/AKfycbxzqxuxfVhSx2W0gn5dBzC-jVs1xKBhs1PKejEOqCwUJhY0daCtzfI4STZYrId4zDcV/exec",

    DEFAULT_SETTINGS: {
        lat: -6.200000,
        lng: 106.816666,
        radius: 100
    }
};

// ===============================
// GLOBAL STATE
// ===============================

// ===============================
// DUMMY DATA (Preview Mode)
// ===============================

const DummyData = {
    users: [
        {
            username: 'admin',
            password: 'edudigital',
            role: 'admin',
            nama: 'Administrator',
            kategori: '-'
        },
        {
            username: 'peserta',
            password: 'edudigital',
            role: 'peserta',
            nama: 'Budi Santoso',
            kategori: 'Karyawan'
        }
    ],

    riwayat: []
};