# TODO LIST

## Tahap 1 — Scaffold

```text
[ ] Pastikan Node.js dan npm aktif
[ ] Install clasp
[ ] Login clasp
[ ] Aktifkan Apps Script API
[ ] Buat project standalone
[ ] Set rootDir ke src
[ ] Buat Code.gs
[ ] Buat Config.gs
[ ] Buat Utils.gs
[ ] Buat ui/Index.html
[ ] Buat ui/Style.html
[ ] Buat ui/ClientJs.html
[ ] clasp push
[ ] Deploy web app test
[ ] Test tombol pingServer
```

## Tahap 2 — Database Setup

```text
[ ] Buat folder Drive utama
[ ] Buat spreadsheet DB_MASTER
[ ] Buat spreadsheet DB_INSTRUMEN_2026
[ ] Buat spreadsheet DB_ASSESSMENT_2026
[ ] Buat spreadsheet DB_DOKUMEN_2026
[ ] Buat spreadsheet DB_AUDIT_2026
[ ] Buat spreadsheet DB_REPORT_CACHE_2026
[ ] Masukkan ID spreadsheet ke Config.gs
[ ] Buat fungsi setupInitialDatabase()
[ ] Buat semua header sheet
[ ] Isi user SUPER_ADMIN awal
```

## Tahap 3 — Auth

```text
[ ] Buat DbService
[ ] Buat AuthService
[ ] Buat getCurrentUser()
[ ] Buat validateRole()
[ ] Buat canAccessRs()
[ ] Buat canAccessUnit()
[ ] Tampilkan user aktif di frontend
```

## Tahap 4 — Master Data

```text
[ ] Import RS
[ ] Import user
[ ] Import unit kerja
[ ] Import periode
[ ] CRUD sederhana
```

## Tahap 5 — Instrumen

```text
[ ] Buat daftar instrumen
[ ] Buat form pertanyaan
[ ] Buat pilihan jawaban
[ ] Atur bobot
[ ] Aktifkan instrumen
[ ] Kunci instrumen
```

## Tahap 6 — Self Assessment

```text
[ ] Tampilkan form per unit
[ ] Tampilkan kategori
[ ] Tampilkan pertanyaan
[ ] Tampilkan pilihan jawaban
[ ] Simpan draft batch
[ ] Submit unit
[ ] Submit final RS
```

## Tahap 7 — Verifikasi

```text
[ ] Tampilkan jawaban RS
[ ] Tampilkan bukti RS
[ ] Simpan jawaban verifikasi
[ ] Simpan catatan
[ ] Simpan rekomendasi
[ ] Submit verifikasi unit
```

## Tahap 8 — Finalisasi dan Laporan

```text
[ ] Hitung nilai akhir
[ ] Hitung gap
[ ] Kunci hasil
[ ] Generate PDF
[ ] Dashboard final
```
