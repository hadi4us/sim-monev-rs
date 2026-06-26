# SECURITY AND ACCESS CONTROL

## 1. Prinsip Keamanan

1. Database spreadsheet tidak dibagikan ke user umum.
2. Semua akses dilakukan melalui Web App.
3. User dikenali melalui email Google.
4. Hak akses ditentukan dari `MASTER_USER`.
5. Setiap function backend wajib melakukan validasi role.
6. Semua perubahan penting masuk `AUDIT_LOG`.

## 2. Role

### ADMIN_RS

Hak akses:

```text
Melihat data RS sendiri
Mengisi semua unit pada RS sendiri
Review jawaban operator
Submit final self assessment RS
Melihat hasil akhir RS sendiri
```

### OPERATOR_RS

Hak akses:

```text
Mengisi unit/kategori yang ditugaskan
Upload bukti
Simpan draft
Submit unit jika diberikan izin
```

### REVIEWER_RS

Hak akses:

```text
Melihat semua unit RS sendiri
Memberi catatan internal
Mengembalikan ke operator
```

### VERIFIKATOR

Hak akses:

```text
Melihat jawaban self assessment RS
Melakukan verifikasi sesuai unit kerja
Upload bukti verifikasi
Memberi catatan dan rekomendasi
Submit hasil verifikasi unit
```

### KOORDINATOR_MONEV

Hak akses:

```text
Melihat semua RS
Melihat semua unit
Monitoring progress
Mengembalikan verifikasi
Finalisasi nilai
Generate laporan
```

### SUPER_ADMIN

Hak akses:

```text
Seluruh akses sistem
Kelola user
Kelola master data
Kelola instrumen
Buka kunci assessment jika diperlukan
Backup
```

## 3. Matriks Akses

| Modul | RS Operator | Admin RS | Verifikator | Koordinator | Super Admin |
|---|---:|---:|---:|---:|---:|
| Dashboard RS sendiri | Ya | Ya | Tidak | Ya | Ya |
| Dashboard semua RS | Tidak | Tidak | Terbatas | Ya | Ya |
| Isi self assessment | Ya | Ya | Tidak | Tidak | Ya |
| Submit final RS | Tidak | Ya | Tidak | Tidak | Ya |
| Verifikasi | Tidak | Tidak | Ya | Ya | Ya |
| Finalisasi nilai | Tidak | Tidak | Tidak | Ya | Ya |
| Kelola instrumen | Tidak | Tidak | Terbatas | Ya | Ya |
| Kelola user | Tidak | Terbatas | Tidak | Tidak | Ya |
| Generate laporan | Terbatas | Ya | Terbatas | Ya | Ya |

## 4. Validasi Akses Backend

Setiap function publik harus melakukan validasi:

```text
Apakah user login?
Apakah user aktif?
Apakah role sesuai?
Apakah user boleh akses RS ini?
Apakah user boleh akses unit ini?
Apakah periode sedang dibuka?
Apakah assessment masih bisa diedit?
```

## 5. Audit Log

Aksi yang wajib dicatat:

```text
Login
Tambah/edit user
Tambah/edit instrumen
Aktifkan instrumen
Kunci instrumen
Simpan jawaban self
Submit self unit
Submit final RS
Upload bukti
Simpan verifikasi
Submit verifikasi
Finalisasi monev
Buka kunci assessment
Generate laporan
Backup
```

## 6. Proteksi Data

### Google Sheets

```text
Hanya owner/admin aplikasi yang memiliki akses langsung.
User RS dan Dinkes tidak diberi akses edit langsung.
```

### Google Drive

```text
Folder bukti tidak public.
File bukti diakses melalui aplikasi.
Sharing file dibatasi sesuai kebutuhan.
```

## 7. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| User melihat data RS lain | Validasi `rs_id` di backend |
| User mengubah payload frontend | Validasi ulang di backend |
| Data terhapus di Sheets | Jangan share database, backup rutin |
| Nilai final berubah | Snapshot nilai saat finalisasi |
| Instrumen berubah setelah dipakai | Versioning dan locking instrumen |
| Banyak user tulis bersamaan | LockService dan batch write |
| Upload file terlalu besar | Batasi ukuran dan tipe file |
