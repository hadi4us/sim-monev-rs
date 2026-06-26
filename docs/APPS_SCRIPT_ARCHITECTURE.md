# APPS SCRIPT ARCHITECTURE

## 1. Arsitektur Umum

```text
Browser User
    ↓
HTML Service Frontend
    ↓
google.script.run
    ↓
Apps Script Backend Services
    ↓
Google Sheets / Google Drive
```

## 2. File Backend

| File | Fungsi |
|---|---|
| Code.gs | Entry point web app |
| Config.gs | Konfigurasi ID database dan folder |
| Utils.gs | Helper umum |
| DbService.gs | Abstraksi baca/tulis Google Sheets |
| AuthService.gs | Login, current user, validasi role |
| MasterService.gs | Master RS, user, unit, periode |
| InstrumentService.gs | Builder instrumen |
| AssessmentService.gs | Self assessment RS |
| VerificationService.gs | Verifikasi Dinkes |
| ScoringService.gs | Perhitungan nilai |
| FileService.gs | Upload dan metadata bukti |
| DashboardService.gs | Dashboard dan cache |
| ReportService.gs | Generate laporan |
| AuditLogService.gs | Audit log |
| BackupService.gs | Backup database |

## 3. File Frontend

| File | Fungsi |
|---|---|
| ui/Index.html | HTML utama |
| ui/App.html | Layout utama |
| ui/Sidebar.html | Menu samping |
| ui/Dashboard.html | Dashboard |
| ui/SelfAssessment.html | Form self assessment |
| ui/Verification.html | Form verifikasi |
| ui/Instrument.html | Manajemen instrumen |
| ui/MasterData.html | Master data |
| ui/Report.html | Laporan |
| ui/Style.html | CSS |
| ui/ClientJs.html | JavaScript client |

## 4. Pola Response Backend

Semua function publik menggunakan format:

```javascript
return {
  success: true,
  message: 'OK',
  data: {}
};
```

Jika gagal:

```javascript
return {
  success: false,
  message: 'Pesan kesalahan',
  details: {}
};
```

## 5. Pola Komunikasi Frontend

```javascript
google.script.run
  .withSuccessHandler(function(res) {
    if (!res.success) {
      alert(res.message);
      return;
    }
    // proses data
  })
  .withFailureHandler(function(err) {
    alert(err.message);
  })
  .namaFunctionBackend(payload);
```

## 6. Service Layer

### AuthService

Tanggung jawab:

```text
getCurrentUser
validateRole
canAccessRs
canAccessUnit
```

### DbService

Tanggung jawab:

```text
openSpreadsheet_
getSheet_
readTable_
appendRows_
updateRowsById_
findById_
```

### InstrumentService

Tanggung jawab:

```text
getInstrumentList
getInstrumentDetail
saveQuestion
saveAnswerOption
activateInstrument
lockInstrument
cloneInstrumentVersion
```

### AssessmentService

Tanggung jawab:

```text
getAssessmentForm
saveSelfDraft
submitSelfUnit
submitSelfFinal
getSelfProgress
```

### VerificationService

Tanggung jawab:

```text
getVerificationForm
saveVerificationDraft
submitVerificationUnit
returnVerificationToVerifier
finalizeMonev
```

### ScoringService

Tanggung jawab:

```text
calculateQuestionScore
calculateUnitScore
calculateFinalScore
calculateGap
saveScoreSnapshot
```

### FileService

Tanggung jawab:

```text
createFolderStructure
uploadEvidence
getEvidenceList
deleteEvidenceMetadata
```

### DashboardService

Tanggung jawab:

```text
refreshDashboardCache
getDashboardSummary
getRsRanking
getUnitSummary
getGapSummary
```

## 7. Locking

Gunakan `LockService` saat operasi tulis:

```javascript
const lock = LockService.getScriptLock();
try {
  lock.waitLock(30000);
  // write process
} finally {
  lock.releaseLock();
}
```

## 8. Cache

Gunakan cache untuk:

```text
MASTER_RS
MASTER_USER
MASTER_UNIT_KERJA
MASTER_PERIODE
INSTRUMEN aktif
Dashboard summary
```

Cache tidak digunakan untuk data jawaban final yang harus selalu akurat.

## 9. Prinsip Frontend

1. Jangan terlalu banyak request paralel.
2. Simpan jawaban secara batch.
3. Validasi required field sebelum kirim ke backend.
4. Tampilkan status loading.
5. Tampilkan pesan error yang mudah dipahami.
6. Jangan memuat seluruh data besar sekaligus.

## 10. Prinsip Backend

1. Validasi role dan akses setiap function publik.
2. Jangan percaya payload dari frontend.
3. Gunakan ID unik.
4. Simpan audit log untuk aksi penting.
5. Gunakan batch read/write.
6. Jangan mengandalkan formula spreadsheet untuk nilai resmi.
