# SIM Monev RS

**SIM Monev RS** adalah aplikasi berbasis Google Apps Script dan Google Sheets untuk mendukung kegiatan **Self Assessment awal** dan **Monitoring Evaluasi Rumah Sakit** oleh Dinas Kesehatan tingkat Kabupaten/Kota.

Aplikasi ini dirancang untuk skenario:

- ±30 rumah sakit.
- ±16 user per rumah sakit.
- ±25–30 user Dinas Kesehatan.
- Maksimal ±100 user aktif bersamaan.
- Database menggunakan beberapa Google Spreadsheet.
- Backend dan frontend menggunakan Google Apps Script Web App.
- Penyimpanan dokumen bukti menggunakan Google Drive.
- Pengembangan lokal menggunakan VS Code dan `clasp`.

## Struktur Dokumentasi

```text
docs/
├── BLUEPRINT.md
├── DEVELOPMENT_GUIDE.md
├── DEPLOYMENT_CLASP.md
├── DATABASE_SCHEMA.md
├── APPS_SCRIPT_ARCHITECTURE.md
├── SECURITY_AND_ACCESS_CONTROL.md
├── TESTING_CHECKLIST.md
├── ROADMAP.md
├── TODO.md
└── CHANGELOG.md
```

## Prinsip Utama

1. User tidak mengakses database spreadsheet secara langsung.
2. Semua akses data melalui Apps Script Web App.
3. Semua pertanyaan, pilihan jawaban, dan bobot bersifat dinamis.
4. Instrumen yang sudah digunakan tidak diedit langsung, tetapi dibuat versi baru.
5. Nilai resmi disimpan sebagai snapshot saat submit/finalisasi.
6. Semua perubahan penting dicatat ke audit log.
7. Dashboard membaca data cache, bukan menghitung ulang semua jawaban mentah.
8. Upload bukti disimpan di Google Drive; spreadsheet hanya menyimpan metadata.

## Teknologi

- Google Apps Script
- Google Sheets
- Google Drive
- HTML Service
- JavaScript
- VS Code
- clasp
- Git

## Status Awal Project

Tahap saat ini: **Tahap 1 — Scaffold project dengan clasp**.

Target tahap 1:

- Project Apps Script standalone berhasil dibuat.
- Struktur folder `src/` dan `src/ui/` tersedia.
- File `Code.gs`, `Config.gs`, `Utils.gs`, `Index.html`, `Style.html`, dan `ClientJs.html` tersedia.
- Web App awal dapat dibuka.
- Tombol `Test Server` berhasil memanggil fungsi backend Apps Script.
