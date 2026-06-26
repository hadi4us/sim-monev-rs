# ROADMAP PENGEMBANGAN

## Tahap 1 — Scaffold Project

Target:

```text
Project clasp berjalan
Struktur folder dibuat
Web app awal tampil
Fungsi pingServer berhasil
```

Output:

```text
src/Code.gs
src/Config.gs
src/Utils.gs
src/ui/Index.html
src/ui/Style.html
src/ui/ClientJs.html
```

## Tahap 2 — Setup Database Otomatis

Target:

```text
Fungsi setupInitialDatabase()
Membuat semua sheet
Membuat header
Mengisi data contoh awal
```

Output:

```text
DB_MASTER
DB_INSTRUMEN_2026
DB_ASSESSMENT_2026
DB_DOKUMEN_2026
DB_AUDIT_2026
DB_REPORT_CACHE_2026
```

## Tahap 3 — Auth dan Role

Target:

```text
getCurrentUser()
Validasi user aktif
Validasi role
Pembatasan menu
```

## Tahap 4 — Master Data

Target:

```text
CRUD/import RS
CRUD/import user
CRUD unit kerja
CRUD periode
```

## Tahap 5 — Instrument Builder

Target:

```text
Buat instrumen
Buat kategori
Buat pertanyaan
Buat pilihan jawaban
Atur bobot
Aktifkan dan kunci instrumen
Clone versi instrumen
```

## Tahap 6 — Self Assessment RS

Target:

```text
Form pengisian RS
Simpan draft batch
Upload bukti
Submit per unit
Submit final RS
```

## Tahap 7 — Skoring Self Assessment

Target:

```text
Hitung skor pertanyaan
Hitung nilai unit
Hitung nilai total self
Simpan snapshot
```

## Tahap 8 — Verifikasi Dinkes

Target:

```text
Form verifikasi
Lihat jawaban RS
Lihat bukti RS
Koreksi jawaban
Catatan dan rekomendasi
Submit verifikasi unit
```

## Tahap 9 — Skoring Final dan Gap Analysis

Target:

```text
Hitung nilai verifikasi
Hitung nilai akhir
Hitung gap
Kategori hasil
```

## Tahap 10 — Dashboard

Target:

```text
Dashboard RS
Dashboard Dinkes
Dashboard unit kerja
Dashboard koordinator
Report cache
```

## Tahap 11 — Laporan PDF

Target:

```text
Template Google Docs
Generate laporan individual RS
Export PDF
Simpan ke folder laporan
Catat link laporan
```

## Tahap 12 — Audit Log dan Backup

Target:

```text
Audit log semua aksi penting
Backup database harian
Backup sebelum finalisasi
Error log
```

## Tahap 13 — Pilot Testing

Target:

```text
Pilot 3–5 RS
Evaluasi alur
Evaluasi instrumen
Evaluasi performa
Perbaikan bug
```

## Tahap 14 — Rollout

Target:

```text
Rollout 30 RS
Gelombang 1: 10 RS
Gelombang 2: 10 RS
Gelombang 3: 10 RS
```

## Tahap 15 — Pengembangan Lanjutan

Fitur lanjutan:

```text
Tindak lanjut online
Notifikasi email
QR code laporan
Looker Studio dashboard
Integrasi sistem eksternal
Database PostgreSQL/Firebase jika skala membesar
```
