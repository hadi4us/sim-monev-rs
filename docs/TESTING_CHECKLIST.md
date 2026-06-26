# TESTING CHECKLIST

## 1. Testing Environment

```text
[ ] Project Apps Script sudah deploy sebagai web app
[ ] Database spreadsheet sudah dibuat
[ ] Folder Drive sudah dibuat
[ ] User dummy tersedia
[ ] RS dummy tersedia
[ ] Instrumen dummy tersedia
```

## 2. Test Auth

```text
[ ] User terdaftar bisa masuk
[ ] User tidak terdaftar ditolak
[ ] User nonaktif ditolak
[ ] Role terbaca benar
[ ] RS user terbaca benar
[ ] Unit user terbaca benar
```

## 3. Test Master Data

```text
[ ] Data RS dapat dibaca
[ ] Data user dapat dibaca
[ ] Data unit kerja dapat dibaca
[ ] Data periode dapat dibaca
[ ] Status aktif/nonaktif bekerja
```

## 4. Test Instrumen

```text
[ ] Admin dapat membuat instrumen
[ ] Admin dapat membuat pertanyaan
[ ] Admin dapat membuat pilihan jawaban
[ ] Bobot pertanyaan tersimpan
[ ] Nilai jawaban tersimpan
[ ] Instrumen draft tidak tampil ke RS
[ ] Instrumen aktif tampil ke RS
[ ] Instrumen terkunci tidak bisa diedit langsung
```

## 5. Test Self Assessment

```text
[ ] RS hanya melihat data RS sendiri
[ ] Operator hanya melihat unit yang ditugaskan
[ ] Form pertanyaan tampil benar
[ ] Pilihan jawaban tampil benar
[ ] Bobot tampil benar
[ ] Wajib bukti tampil benar
[ ] Simpan draft berhasil
[ ] Submit unit berhasil
[ ] Submit final RS berhasil
[ ] Setelah final, jawaban terkunci
```

## 6. Test Upload Bukti

```text
[ ] File PDF bisa diupload
[ ] File gambar bisa diupload
[ ] File di atas batas ukuran ditolak
[ ] Metadata masuk DOKUMEN_BUKTI
[ ] File tersimpan di folder Drive yang benar
[ ] Link file bisa dibuka oleh user yang berwenang
```

## 7. Test Skoring

```text
[ ] Skor pertanyaan benar
[ ] Nilai unit benar
[ ] Nilai total self benar
[ ] Nilai verifikasi benar
[ ] Gap benar
[ ] Bobot unit diterapkan benar
[ ] Nilai final tersimpan sebagai snapshot
```

## 8. Test Verifikasi

```text
[ ] Verifikator melihat jawaban self RS
[ ] Verifikator melihat bukti RS
[ ] Verifikator dapat mengubah jawaban
[ ] Catatan verifikator tersimpan
[ ] Rekomendasi tersimpan
[ ] Submit verifikasi unit berhasil
[ ] Verifikator tidak bisa mengakses unit lain jika tidak berwenang
```

## 9. Test Finalisasi

```text
[ ] Koordinator melihat semua unit
[ ] Koordinator dapat mengembalikan hasil verifikasi
[ ] Koordinator dapat finalisasi jika semua unit selesai
[ ] Setelah final, nilai terkunci
[ ] Laporan bisa dibuat
```

## 10. Test Dashboard

```text
[ ] Total RS benar
[ ] Progress self assessment benar
[ ] Progress verifikasi benar
[ ] Ranking RS benar
[ ] Rekap unit benar
[ ] Gap analysis benar
[ ] Dashboard membaca cache
```

## 11. Test Audit Log

```text
[ ] Login tercatat
[ ] Simpan jawaban tercatat
[ ] Submit tercatat
[ ] Verifikasi tercatat
[ ] Finalisasi tercatat
[ ] Perubahan instrumen tercatat
```

## 12. Test Load Sederhana

Skenario:

```text
[ ] 10 user aktif
[ ] 25 user aktif
[ ] 50 user aktif
[ ] 100 user aktif
```

Target:

```text
Buka form < 5 detik
Simpan draft < 10 detik
Submit unit < 20 detik
Dashboard < 5 detik
```

## 13. Test Backup

```text
[ ] Backup manual berhasil
[ ] Backup otomatis berhasil
[ ] File backup tersimpan di folder backup
[ ] Nama file backup memuat tanggal
```
