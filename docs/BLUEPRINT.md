# BLUEPRINT APLIKASI SIM MONEV RS

## 1. Ringkasan Aplikasi

SIM Monev RS adalah aplikasi untuk memfasilitasi proses:

```text
Pembuatan instrumen oleh Dinas Kesehatan
        ↓
Self assessment awal oleh rumah sakit
        ↓
Perhitungan nilai awal
        ↓
Verifikasi ulang saat kunjungan monev oleh Dinas Kesehatan
        ↓
Perhitungan nilai akhir
        ↓
Gap analysis, dashboard, laporan, dan tindak lanjut
```

Aplikasi ini digunakan oleh rumah sakit dan unit kerja di Dinas Kesehatan Kabupaten/Kota.

## 2. Tujuan

1. Menyediakan instrumen self assessment digital untuk rumah sakit.
2. Memudahkan Dinas Kesehatan melakukan verifikasi lapangan.
3. Menghasilkan nilai awal, nilai verifikasi, nilai akhir, gap, temuan, dan rekomendasi.
4. Menjadi dasar pembinaan dan pengawasan rumah sakit.
5. Menyediakan riwayat penilaian dan tindak lanjut dari waktu ke waktu.

## 3. Ruang Lingkup

### Termasuk dalam MVP

- Login berbasis email.
- Role dan hak akses.
- Master rumah sakit.
- Master user.
- Master unit kerja.
- Master periode.
- Builder instrumen.
- Pertanyaan dengan bobot.
- Pilihan jawaban dengan nilai.
- Self assessment RS.
- Upload bukti.
- Verifikasi Dinkes.
- Skoring otomatis.
- Gap analysis.
- Dashboard dasar.
- Laporan PDF.
- Audit log.
- Backup database.

### Tidak termasuk dalam MVP awal

- Tanda tangan elektronik tersertifikasi.
- Integrasi SIRS/ASPAK/RS Online.
- WhatsApp gateway.
- Mobile app native.
- Database relasional eksternal.
- Single Sign-On enterprise tingkat lanjut.

## 4. Aktor Sistem

### Rumah Sakit

| Role | Fungsi |
|---|---|
| ADMIN_RS | Mengelola dan submit final self assessment RS |
| OPERATOR_RS | Mengisi instrumen sesuai unit/topik |
| REVIEWER_RS | Mereview jawaban sebelum submit final |
| VIEWER_RS | Melihat hasil dan laporan RS sendiri |

### Dinas Kesehatan

| Role | Fungsi |
|---|---|
| SUPER_ADMIN | Mengelola sistem, database, user, instrumen |
| KOORDINATOR_MONEV | Mengatur periode, monitoring progress, finalisasi nilai |
| VERIFIKATOR | Melakukan verifikasi sesuai unit kerja |
| KEPALA_BIDANG | Melihat dashboard dan laporan strategis |
| VIEWER_DINKES | Melihat rekap sesuai kewenangan |

## 5. Alur Utama

### 5.1 Persiapan Instrumen

```text
Admin membuat periode
        ↓
Unit kerja membuat instrumen
        ↓
Admin melakukan review
        ↓
Instrumen diaktifkan
        ↓
Instrumen dikunci ketika periode berjalan
```

### 5.2 Self Assessment RS

```text
RS login
        ↓
Pilih periode aktif
        ↓
Pilih unit/kategori
        ↓
Isi jawaban
        ↓
Upload bukti
        ↓
Simpan draft
        ↓
Submit per unit
        ↓
Admin RS submit final
```

### 5.3 Verifikasi Dinkes

```text
Verifikator login
        ↓
Pilih RS dan unit kerja
        ↓
Lihat jawaban self assessment
        ↓
Cek bukti
        ↓
Isi jawaban verifikasi
        ↓
Isi catatan dan rekomendasi
        ↓
Submit hasil verifikasi unit
```

### 5.4 Finalisasi

```text
Semua unit selesai diverifikasi
        ↓
Koordinator review
        ↓
Jika lengkap, finalisasi
        ↓
Nilai akhir dikunci
        ↓
Laporan diterbitkan
```

## 6. Skoring

### Skor Pertanyaan

```text
Skor Pertanyaan = Bobot Pertanyaan × Nilai Jawaban
```

### Nilai Unit

```text
Nilai Unit = Total Skor Aktual / Total Skor Maksimal × 100
```

### Nilai Akhir RS

```text
Nilai Akhir RS = Σ(Nilai Unit × Bobot Unit) / Σ(Bobot Unit)
```

### Gap

```text
Gap = Nilai Verifikasi - Nilai Self Assessment
```

## 7. Status Workflow

### Status Self Assessment

```text
BELUM_DIBUKA
BELUM_DIISI
DRAFT
SUBMIT_UNIT
REVIEW_ADMIN_RS
SUBMIT_FINAL_RS
DIKEMBALIKAN
FINAL_SELF
```

### Status Verifikasi

```text
BELUM_DIVERIFIKASI
DRAFT_VERIFIKASI
SUBMIT_VERIFIKATOR
REVIEW_KOORDINATOR
PERLU_PERBAIKAN
FINAL_MONEV
TERKUNCI
```

### Status Tindak Lanjut

```text
BELUM_ADA
BELUM_DITINDAKLANJUTI
DALAM_PROSES
SUDAH_UPLOAD_BUKTI
DIVERIFIKASI_DINKES
SELESAI
```

## 8. Modul Aplikasi

```text
Dashboard
Master Data
Instrumen
Self Assessment RS
Verifikasi Dinkes
Skoring
Tindak Lanjut
Laporan
Audit Log
Backup
Pengaturan
```

## 9. Output Sistem

1. Nilai self assessment per unit.
2. Nilai self assessment total RS.
3. Nilai verifikasi per unit.
4. Nilai akhir RS.
5. Gap self assessment vs verifikasi.
6. Temuan dan rekomendasi.
7. Ranking RS.
8. Rekap per unit kerja.
9. Laporan individual RS.
10. Laporan rekap kabupaten/kota.
