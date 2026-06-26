# DEPLOYMENT DENGAN CLASP

## 1. Login clasp

```powershell
clasp login
```

## 2. Membuat Project Standalone

```powershell
clasp create --title "SIM Monev RS" --type standalone
```

## 3. Struktur `.clasp.json`

```json
{
  "scriptId": "SCRIPT_ID_PROJECT",
  "rootDir": "src"
}
```

## 4. Push Kode ke Apps Script

```powershell
clasp push
```

Jika muncul konfirmasi overwrite, jawab:

```text
Y
```

## 5. Buka Editor Apps Script

```powershell
clasp open-script
```

## 6. Membuat Versi

```powershell
clasp version "Initial MVP scaffold"
```

## 7. Deploy

Untuk deployment awal, disarankan melalui editor Apps Script:

```text
Deploy → New deployment → Web app
```

Pilihan:

```text
Execute as: Me
Who has access: Anyone with Google account
```

Jika semua user berada dalam satu domain Google Workspace yang sama:

```text
Who has access: Anyone within domain
```

## 8. Update Deployment

Setiap ada perubahan:

```powershell
clasp push
```

Kemudian di Apps Script Editor:

```text
Deploy → Manage deployments → Edit → New version → Deploy
```

## 9. Manifest Awal

`src/appsscript.json`:

```json
{
  "timeZone": "Asia/Jakarta",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

## 10. Troubleshooting

### Error: `No manifest file`

Pastikan `appsscript.json` berada di dalam folder `src`.

### Error: `rootDir does not exist`

Pastikan `.clasp.json` berisi:

```json
{
  "rootDir": "src"
}
```

### Error saat push

Cek apakah file sudah disimpan di VS Code.

### Email user tidak terbaca

Cek setting deployment:

```text
Execute as
Who has access
Akun Google user
MASTER_USER
```

### Spreadsheet tidak ditemukan

Cek ID spreadsheet di `Config.gs`.

## 11. Checklist Deployment

```text
[ ] Semua file tersimpan
[ ] clasp push berhasil
[ ] Function test berjalan
[ ] Web app bisa dibuka
[ ] User aktif terbaca
[ ] Test server berhasil
[ ] URL web app dicatat
```
