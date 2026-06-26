# DEVELOPMENT GUIDE

## 1. Tujuan Dokumen

Dokumen ini menjadi panduan teknis pengembangan SIM Monev RS menggunakan:

- VS Code
- clasp
- Google Apps Script
- Google Sheets
- Google Drive

## 2. Prasyarat

Pastikan sudah tersedia:

```text
Node.js
npm
clasp
VS Code
Akun Google owner aplikasi
Google Apps Script API aktif
Git
```

Cek versi:

```powershell
node -v
npm -v
clasp --version
git --version
```

## 3. Struktur Project

```text
sim-monev-rs/
├── .clasp.json
├── .gitignore
├── package.json
├── jsconfig.json
├── docs/
│   ├── BLUEPRINT.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── ...
└── src/
    ├── appsscript.json
    ├── Code.gs
    ├── Config.gs
    ├── Utils.gs
    ├── DbService.gs
    ├── AuthService.gs
    ├── MasterService.gs
    ├── InstrumentService.gs
    ├── AssessmentService.gs
    ├── VerificationService.gs
    ├── ScoringService.gs
    ├── FileService.gs
    ├── DashboardService.gs
    ├── ReportService.gs
    ├── AuditLogService.gs
    ├── BackupService.gs
    └── ui/
        ├── Index.html
        ├── App.html
        ├── Sidebar.html
        ├── Dashboard.html
        ├── SelfAssessment.html
        ├── Verification.html
        ├── Instrument.html
        ├── MasterData.html
        ├── Report.html
        ├── Style.html
        └── ClientJs.html
```

## 4. Konvensi Penamaan

### File Backend

Gunakan format:

```text
NamaService.gs
```

Contoh:

```text
AuthService.gs
AssessmentService.gs
ScoringService.gs
```

### Function Internal

Function helper internal diberi akhiran underscore:

```javascript
function readTable_() {}
function appendRows_() {}
function normalizeEmail_() {}
```

### Function yang Dipanggil Frontend

Function yang akan dipanggil dari `google.script.run` tidak memakai akhiran underscore:

```javascript
function getCurrentUser() {}
function getDashboardSummary() {}
function saveSelfAssessmentDraft(payload) {}
```

## 5. Konvensi ID

Gunakan ID unik, jangan nomor baris.

```text
RS001
USR0001
UNIT-GIZI
PRD2026
INS2026-GIZI-V1
Q-GIZI-001
A-GIZI-001-A
ASM2026-RS001
SELF-RS001-Q001
VERIF-RS001-Q001
```

## 6. Prinsip Akses Database

### Benar

```text
Frontend → google.script.run → Apps Script Service → Google Sheets
```

### Salah

```text
User diberi akses langsung ke database Google Sheets
```

## 7. Pola Read/Write

Gunakan batch read/write.

### Benar

```javascript
const data = sheet.getDataRange().getValues();
sheet.getRange(row, col, numRows, numCols).setValues(values);
```

### Hindari

```javascript
for (...) {
  sheet.getRange(i, 1).setValue(value);
}
```

## 8. Error Handling

Semua function publik sebaiknya mengembalikan format:

```javascript
{
  success: true,
  message: 'OK',
  data: {}
}
```

atau:

```javascript
{
  success: false,
  message: 'Pesan error',
  details: {}
}
```

## 9. Workflow Development

```text
Edit kode di VS Code
        ↓
Save file
        ↓
clasp push
        ↓
Test di Apps Script Editor / Web App
        ↓
Commit Git
```

Command:

```powershell
clasp push
clasp open-script
git add .
git commit -m "pesan commit"
```

## 10. Branch Git

Untuk awal cukup gunakan:

```text
main
dev
```

Jika sudah banyak fitur:

```text
feature/master-data
feature/instrument-builder
feature/self-assessment
feature/verification
feature/reporting
```

## 11. Urutan Pengembangan MVP

1. Scaffold project.
2. Setup database otomatis.
3. Auth dan role.
4. Master data.
5. Instrumen.
6. Self assessment.
7. Upload bukti.
8. Skoring self.
9. Verifikasi.
10. Skoring final.
11. Dashboard.
12. Laporan.
13. Audit log.
14. Backup.
15. Testing dan pilot.
