# DATABASE SCHEMA

## 1. Prinsip Database

Database menggunakan beberapa Google Spreadsheet, bukan satu file besar.

```text
DB_MASTER
DB_INSTRUMEN_2026
DB_ASSESSMENT_2026
DB_DOKUMEN_2026
DB_AUDIT_2026
DB_REPORT_CACHE_2026
```

Setiap record harus memiliki ID unik. Jangan menggunakan nomor baris sebagai ID.

## 2. DB_MASTER

### MASTER_RS

| Field | Tipe | Keterangan |
|---|---|---|
| rs_id | text | ID rumah sakit |
| kode_rs | text | Kode resmi RS |
| nama_rs | text | Nama RS |
| kelas_rs | text | A/B/C/D |
| jenis_rs | text | Umum/Khusus |
| kepemilikan | text | Pemerintah/Swasta/TNI/Polri |
| alamat | text | Alamat |
| kecamatan | text | Kecamatan |
| pic_nama | text | Nama PIC |
| pic_email | text | Email PIC |
| status | text | aktif/nonaktif |

### MASTER_USER

| Field | Tipe | Keterangan |
|---|---|---|
| user_id | text | ID user |
| nama | text | Nama user |
| email | text | Email login |
| role | text | Role user |
| rs_id | text | Diisi jika user RS |
| unit_id | text | Diisi jika user unit kerja |
| status | text | aktif/nonaktif |

### MASTER_UNIT_KERJA

| Field | Tipe | Keterangan |
|---|---|---|
| unit_id | text | ID unit |
| nama_unit | text | Nama unit |
| bobot_unit | number | Bobot nilai akhir |
| urutan | number | Urutan tampil |
| status | text | aktif/nonaktif |

### MASTER_PERIODE

| Field | Tipe | Keterangan |
|---|---|---|
| periode_id | text | ID periode |
| nama_periode | text | Nama periode |
| tanggal_mulai_self | date | Mulai pengisian RS |
| tanggal_akhir_self | date | Akhir pengisian RS |
| tanggal_mulai_verif | date | Mulai verifikasi |
| tanggal_akhir_verif | date | Akhir verifikasi |
| status | text | draft/aktif/selesai |

## 3. DB_INSTRUMEN_2026

### INSTRUMEN_HEADER

| Field | Tipe | Keterangan |
|---|---|---|
| instrumen_id | text | ID instrumen |
| periode_id | text | ID periode |
| unit_id | text | ID unit kerja |
| nama_instrumen | text | Nama instrumen |
| versi | number | Versi instrumen |
| status | text | draft/aktif/terkunci/arsip |

### PERTANYAAN

| Field | Tipe | Keterangan |
|---|---|---|
| question_id | text | ID pertanyaan |
| instrumen_id | text | ID instrumen |
| unit_id | text | ID unit kerja |
| kategori | text | Kategori/subtopik |
| pertanyaan | text | Isi pertanyaan |
| tipe_jawaban | text | pilihan_ganda/ya_tidak/angka/teks |
| bobot_pertanyaan | number | Bobot pertanyaan |
| wajib_bukti | text | ya/tidak |
| keterangan_bukti | text | Dokumen yang diminta |
| urutan | number | Urutan tampil |
| status | text | aktif/nonaktif |

### PILIHAN_JAWABAN

| Field | Tipe | Keterangan |
|---|---|---|
| answer_id | text | ID pilihan jawaban |
| question_id | text | ID pertanyaan |
| label_jawaban | text | Label pilihan |
| nilai_jawaban | number | Nilai pilihan |
| urutan | number | Urutan tampil |
| status | text | aktif/nonaktif |

## 4. DB_ASSESSMENT_2026

### ASSESSMENT_HEADER

| Field | Tipe | Keterangan |
|---|---|---|
| assessment_id | text | ID assessment |
| periode_id | text | ID periode |
| rs_id | text | ID RS |
| status_self | text | Status self assessment |
| nilai_self | number | Nilai awal |
| status_verifikasi | text | Status verifikasi |
| nilai_akhir | number | Nilai final |
| updated_at | datetime | Terakhir diperbarui |

### JAWABAN_SELF

| Field | Tipe | Keterangan |
|---|---|---|
| self_answer_id | text | ID jawaban self |
| assessment_id | text | ID assessment |
| rs_id | text | ID RS |
| unit_id | text | ID unit |
| question_id | text | ID pertanyaan |
| answer_id | text | ID jawaban |
| nilai_jawaban | number | Nilai jawaban |
| bobot_pertanyaan | number | Bobot |
| skor | number | Bobot × nilai |
| catatan_rs | text | Catatan RS |
| updated_by | text | Email pengubah |
| updated_at | datetime | Waktu update |

### JAWABAN_VERIFIKASI

| Field | Tipe | Keterangan |
|---|---|---|
| verif_answer_id | text | ID jawaban verifikasi |
| assessment_id | text | ID assessment |
| rs_id | text | ID RS |
| unit_id | text | ID unit |
| question_id | text | ID pertanyaan |
| answer_self_id | text | Jawaban self |
| answer_verif_id | text | Jawaban verifikator |
| nilai_verif | number | Nilai verifikasi |
| bobot_pertanyaan | number | Bobot |
| skor_verif | number | Bobot × nilai |
| catatan_verifikator | text | Catatan |
| rekomendasi | text | Rekomendasi |
| status_kesesuaian | text | sesuai/tidak_sesuai |
| updated_by | text | Email pengubah |
| updated_at | datetime | Waktu update |

### SKOR_UNIT

| Field | Tipe | Keterangan |
|---|---|---|
| assessment_id | text | ID assessment |
| rs_id | text | ID RS |
| periode_id | text | ID periode |
| unit_id | text | ID unit |
| nilai_self | number | Nilai self per unit |
| nilai_verif | number | Nilai verifikasi per unit |
| gap | number | Selisih |
| status_unit | text | draft/final |

### SKOR_FINAL

| Field | Tipe | Keterangan |
|---|---|---|
| assessment_id | text | ID assessment |
| rs_id | text | ID RS |
| periode_id | text | ID periode |
| nilai_self_total | number | Nilai self total |
| nilai_verif_total | number | Nilai akhir |
| gap_total | number | Gap total |
| kategori | text | Kategori hasil |
| status_final | text | final/terkunci |

## 5. DB_DOKUMEN_2026

### DOKUMEN_BUKTI

| Field | Tipe | Keterangan |
|---|---|---|
| file_id | text | ID file Drive |
| assessment_id | text | ID assessment |
| question_id | text | ID pertanyaan |
| unit_id | text | ID unit |
| jenis_bukti | text | SELF/VERIFIKASI |
| file_name | text | Nama file |
| file_url | text | URL Drive |
| uploaded_by | text | Email uploader |
| uploaded_at | datetime | Waktu upload |

## 6. DB_AUDIT_2026

### AUDIT_LOG

| Field | Tipe | Keterangan |
|---|---|---|
| log_id | text | ID log |
| timestamp | datetime | Waktu |
| user_email | text | Email user |
| role | text | Role |
| action | text | Aksi |
| object_type | text | Jenis objek |
| object_id | text | ID objek |
| before_value | text/json | Nilai sebelum |
| after_value | text/json | Nilai sesudah |
| note | text | Catatan |

## 7. DB_REPORT_CACHE_2026

### DASHBOARD_CACHE

| Field | Tipe | Keterangan |
|---|---|---|
| cache_id | text | ID cache |
| periode_id | text | ID periode |
| key | text | Nama indikator |
| value | text/number | Nilai |
| updated_at | datetime | Waktu update |

### REKAP_RS

| Field | Tipe | Keterangan |
|---|---|---|
| periode_id | text | ID periode |
| rs_id | text | ID RS |
| nama_rs | text | Nama RS |
| nilai_self | number | Nilai awal |
| nilai_final | number | Nilai akhir |
| gap | number | Selisih |
| kategori | text | Kategori |
| status | text | Status |
