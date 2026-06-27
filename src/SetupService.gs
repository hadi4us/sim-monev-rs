function setupProjectResources() {
  try {
    const rootFolder = getOrCreateRootFolder_();

    const databaseFolder = getOrCreateSubFolder_(
      rootFolder,
      CONFIG.SETUP.DB_FOLDER_NAME,
      CONFIG.PROP.FOLDER_DATABASE
    );

    const templateFolder = getOrCreateSubFolder_(
      rootFolder,
      CONFIG.SETUP.TEMPLATE_FOLDER_NAME,
      CONFIG.PROP.FOLDER_TEMPLATE
    );

    const uploadFolder = getOrCreateSubFolder_(
      rootFolder,
      CONFIG.SETUP.UPLOAD_FOLDER_NAME,
      CONFIG.PROP.FOLDER_UPLOAD
    );

    const reportFolder = getOrCreateSubFolder_(
      rootFolder,
      CONFIG.SETUP.REPORT_FOLDER_NAME,
      CONFIG.PROP.FOLDER_REPORT
    );

    const backupFolder = getOrCreateSubFolder_(
      rootFolder,
      CONFIG.SETUP.BACKUP_FOLDER_NAME,
      CONFIG.PROP.FOLDER_BACKUP
    );

    const logFolder = getOrCreateSubFolder_(
      rootFolder,
      CONFIG.SETUP.LOG_FOLDER_NAME,
      CONFIG.PROP.FOLDER_LOG
    );

    const definitions = getDatabaseDefinitions_();

    const dbMaster = getOrCreateDbSpreadsheet_(
      'MASTER',
      'DB_MASTER',
      databaseFolder,
      definitions.MASTER
    );

    const dbInstrumen = getOrCreateDbSpreadsheet_(
      'INSTRUMEN',
      'DB_INSTRUMEN_2026',
      databaseFolder,
      definitions.INSTRUMEN
    );

    const dbAssessment = getOrCreateDbSpreadsheet_(
      'ASSESSMENT',
      'DB_ASSESSMENT_2026',
      databaseFolder,
      definitions.ASSESSMENT
    );

    const dbDokumen = getOrCreateDbSpreadsheet_(
      'DOKUMEN',
      'DB_DOKUMEN_2026',
      databaseFolder,
      definitions.DOKUMEN
    );

    const dbAudit = getOrCreateDbSpreadsheet_(
      'AUDIT',
      'DB_AUDIT_2026',
      databaseFolder,
      definitions.AUDIT
    );

    const dbReportCache = getOrCreateDbSpreadsheet_(
      'REPORT_CACHE',
      'DB_REPORT_CACHE_2026',
      databaseFolder,
      definitions.REPORT_CACHE
    );

    seedInitialData_();

    return jsonSuccess_({
      folders: {
        root: rootFolder.getId(),
        database: databaseFolder.getId(),
        template: templateFolder.getId(),
        upload: uploadFolder.getId(),
        report: reportFolder.getId(),
        backup: backupFolder.getId(),
        log: logFolder.getId()
      },
      databases: {
        master: dbMaster.getId(),
        instrumen: dbInstrumen.getId(),
        assessment: dbAssessment.getId(),
        dokumen: dbDokumen.getId(),
        audit: dbAudit.getId(),
        report_cache: dbReportCache.getId()
      }
    }, 'Setup resource project berhasil.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getSetupStatus() {
  try {
    const props = PropertiesService.getScriptProperties().getProperties();

    return jsonSuccess_({
      folder_root: props[CONFIG.PROP.FOLDER_ROOT] || '',
      folder_database: props[CONFIG.PROP.FOLDER_DATABASE] || '',
      folder_upload: props[CONFIG.PROP.FOLDER_UPLOAD] || '',
      folder_report: props[CONFIG.PROP.FOLDER_REPORT] || '',
      folder_backup: props[CONFIG.PROP.FOLDER_BACKUP] || '',
      db_master: props[CONFIG.PROP.DB_MASTER] || '',
      db_instrumen: props[CONFIG.PROP.DB_INSTRUMEN] || '',
      db_assessment: props[CONFIG.PROP.DB_ASSESSMENT] || '',
      db_dokumen: props[CONFIG.PROP.DB_DOKUMEN] || '',
      db_audit: props[CONFIG.PROP.DB_AUDIT] || '',
      db_report_cache: props[CONFIG.PROP.DB_REPORT_CACHE] || ''
    }, 'Status setup berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getOrCreateRootFolder_() {
  const existingId = getScriptProperty_(CONFIG.PROP.FOLDER_ROOT);

  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (err) {
      // lanjut buat baru
    }
  }

  const folder = DriveApp.createFolder(CONFIG.SETUP.ROOT_FOLDER_NAME);
  setScriptProperty_(CONFIG.PROP.FOLDER_ROOT, folder.getId());

  return folder;
}

function getOrCreateSubFolder_(parentFolder, folderName, propKey) {
  const existingId = getScriptProperty_(propKey);

  if (existingId) {
    try {
      return DriveApp.getFolderById(existingId);
    } catch (err) {
      // lanjut cari atau buat baru
    }
  }

  const existingFolders = parentFolder.getFoldersByName(folderName);

  if (existingFolders.hasNext()) {
    const folder = existingFolders.next();
    setScriptProperty_(propKey, folder.getId());
    return folder;
  }

  const folder = parentFolder.createFolder(folderName);
  setScriptProperty_(propKey, folder.getId());

  return folder;
}

function getOrCreateDbSpreadsheet_(dbKey, spreadsheetName, databaseFolder, sheetDefinitions) {
  const propKey = CONFIG.PROP[`DB_${dbKey}`];
  const existingId = getScriptProperty_(propKey);

  if (existingId) {
    try {
      const ss = SpreadsheetApp.openById(existingId);
      ensureSpreadsheetSheets_(ss, sheetDefinitions);
      return ss;
    } catch (err) {
      // lanjut buat baru
    }
  }

  const ss = SpreadsheetApp.create(spreadsheetName);
  const file = DriveApp.getFileById(ss.getId());

  file.moveTo(databaseFolder);

  setScriptProperty_(propKey, ss.getId());

  ensureSpreadsheetSheets_(ss, sheetDefinitions);

  return ss;
}

function ensureSpreadsheetSheets_(ss, sheetDefinitions) {
  const sheetNames = Object.keys(sheetDefinitions);
  const existingSheets = ss.getSheets();

  if (
    existingSheets.length === 1 &&
    existingSheets[0].getName() === 'Sheet1' &&
    sheetNames.length > 0
  ) {
    existingSheets[0].setName(sheetNames[0]);
  }

  sheetNames.forEach(function (sheetName) {
    ensureSheetWithHeaders_(ss, sheetName, sheetDefinitions[sheetName]);
  });
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const hasHeader = sheet.getLastRow() >= 1 && sheet.getLastColumn() >= 1;

  if (!hasHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    return;
  }

  const existingFirstCell = String(sheet.getRange(1, 1).getValue()).trim();

  if (!existingFirstCell) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
}

function getDatabaseDefinitions_() {
  return {
    MASTER: {
      MASTER_RS: [
        'rs_id',
        'kode_rs',
        'nama_rs',
        'kelas_rs',
        'jenis_rs',
        'kepemilikan',
        'alamat',
        'kecamatan',
        'pic_nama',
        'pic_email',
        'status'
      ],
      MASTER_USER: [
        'user_id',
        'nama',
        'email',
        'role',
        'rs_id',
        'unit_id',
        'status'
      ],
      MASTER_ROLE: [
        'role_id',
        'role_name',
        'description',
        'status'
      ],
      MASTER_UNIT_KERJA: [
        'unit_id',
        'nama_unit',
        'bobot_unit',
        'urutan',
        'status'
      ],
      MASTER_PERIODE: [
        'periode_id',
        'nama_periode',
        'tanggal_mulai_self',
        'tanggal_akhir_self',
        'tanggal_mulai_verif',
        'tanggal_akhir_verif',
        'status'
      ],
      CONFIG_APP: [
        'config_key',
        'config_value',
        'description',
        'updated_at'
      ]
    },

    INSTRUMEN: {
      INSTRUMEN_HEADER: [
        'instrumen_id',
        'periode_id',
        'unit_id',
        'nama_instrumen',
        'versi',
        'status'
      ],
      INSTRUMEN_KATEGORI: [
        'kategori_id',
        'instrumen_id',
        'unit_id',
        'nama_kategori',
        'urutan',
        'status'
      ],
      PERTANYAAN: [
        'question_id',
        'instrumen_id',
        'unit_id',
        'kategori',
        'pertanyaan',
        'tipe_jawaban',
        'bobot_pertanyaan',
        'wajib_bukti',
        'keterangan_bukti',
        'urutan',
        'status'
      ],
      PILIHAN_JAWABAN: [
        'answer_id',
        'question_id',
        'label_jawaban',
        'nilai_jawaban',
        'urutan',
        'status'
      ],
      BOBOT_UNIT: [
        'periode_id',
        'unit_id',
        'bobot_unit',
        'status'
      ],
      VERSI_INSTRUMEN: [
        'versi_id',
        'instrumen_id',
        'versi',
        'catatan_perubahan',
        'created_by',
        'created_at'
      ]
    },

    ASSESSMENT: {
      ASSESSMENT_HEADER: [
        'assessment_id',
        'periode_id',
        'rs_id',
        'status_self',
        'nilai_self',
        'status_verifikasi',
        'nilai_akhir',
        'updated_at'
      ],
      JAWABAN_SELF: [
        'self_answer_id',
        'assessment_id',
        'rs_id',
        'unit_id',
        'question_id',
        'answer_id',
        'nilai_jawaban',
        'bobot_pertanyaan',
        'skor',
        'catatan_rs',
        'updated_by',
        'updated_at'
      ],
      JAWABAN_VERIFIKASI: [
        'verif_answer_id',
        'assessment_id',
        'rs_id',
        'unit_id',
        'question_id',
        'answer_self_id',
        'answer_verif_id',
        'nilai_verif',
        'bobot_pertanyaan',
        'skor_verif',
        'catatan_verifikator',
        'rekomendasi',
        'status_kesesuaian',
        'updated_by',
        'updated_at'
      ],
      SKOR_UNIT: [
        'assessment_id',
        'rs_id',
        'periode_id',
        'unit_id',
        'nilai_self',
        'nilai_verif',
        'gap',
        'status_unit'
      ],
      SKOR_FINAL: [
        'assessment_id',
        'rs_id',
        'periode_id',
        'nilai_self_total',
        'nilai_verif_total',
        'gap_total',
        'kategori',
        'status_final'
      ],
      STATUS_PROGRESS: [
        'assessment_id',
        'rs_id',
        'periode_id',
        'unit_id',
        'status',
        'updated_by',
        'updated_at'
      ]
    },

    DOKUMEN: {
      DOKUMEN_BUKTI: [
        'file_id',
        'assessment_id',
        'question_id',
        'unit_id',
        'jenis_bukti',
        'file_name',
        'file_url',
        'uploaded_by',
        'uploaded_at'
      ],
      UPLOAD_LOG: [
        'upload_id',
        'file_id',
        'file_name',
        'uploaded_by',
        'uploaded_at',
        'status',
        'message'
      ],
      FOLDER_MAPPING: [
        'mapping_id',
        'periode_id',
        'rs_id',
        'unit_id',
        'folder_type',
        'folder_id',
        'folder_url'
      ]
    },

    AUDIT: {
      AUDIT_LOG: [
        'log_id',
        'timestamp',
        'user_email',
        'role',
        'action',
        'object_type',
        'object_id',
        'before_value',
        'after_value',
        'note'
      ],
      LOGIN_LOG: [
        'login_id',
        'timestamp',
        'user_email',
        'status',
        'message'
      ],
      ERROR_LOG: [
        'error_id',
        'timestamp',
        'function_name',
        'user_email',
        'message',
        'stack'
      ],
      FINALIZATION_LOG: [
        'finalization_id',
        'timestamp',
        'assessment_id',
        'rs_id',
        'periode_id',
        'finalized_by',
        'note'
      ]
    },

    REPORT_CACHE: {
      DASHBOARD_CACHE: [
        'cache_id',
        'periode_id',
        'cache_key',
        'cache_value',
        'updated_at'
      ],
      REKAP_RS: [
        'periode_id',
        'rs_id',
        'nama_rs',
        'nilai_self',
        'nilai_final',
        'gap',
        'kategori',
        'status'
      ],
      REKAP_UNIT: [
        'periode_id',
        'unit_id',
        'nama_unit',
        'rata_nilai_self',
        'rata_nilai_final',
        'rata_gap',
        'jumlah_rs'
      ],
      REKAP_GAP: [
        'periode_id',
        'rs_id',
        'unit_id',
        'nilai_self',
        'nilai_final',
        'gap',
        'interpretasi'
      ],
      REKAP_TINDAK_LANJUT: [
        'periode_id',
        'rs_id',
        'unit_id',
        'temuan',
        'rekomendasi',
        'deadline',
        'status'
      ]
    }
  };
}

function seedInitialData_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');
  const activeUserEmail = getActiveSetupEmail_();

  appendIfEmpty_(dbMasterId, CONFIG.SHEETS.MASTER_ROLE, [
    {
      role_id: 'SUPER_ADMIN',
      role_name: 'Super Admin',
      description: 'Akses penuh sistem',
      status: 'aktif'
    },
    {
      role_id: 'KOORDINATOR_MONEV',
      role_name: 'Koordinator Monev',
      description: 'Koordinator monitoring dan evaluasi',
      status: 'aktif'
    },
    {
      role_id: 'VERIFIKATOR',
      role_name: 'Verifikator',
      description: 'Verifikator unit kerja Dinkes',
      status: 'aktif'
    },
    {
      role_id: 'ADMIN_RS',
      role_name: 'Admin RS',
      description: 'Admin rumah sakit',
      status: 'aktif'
    },
    {
      role_id: 'OPERATOR_RS',
      role_name: 'Operator RS',
      description: 'Operator pengisi self assessment RS',
      status: 'aktif'
    }
  ]);

  appendIfEmpty_(dbMasterId, CONFIG.SHEETS.MASTER_UNIT_KERJA, [
    {
      unit_id: 'GIZI_KIA',
      nama_unit: 'Gizi/KIA',
      bobot_unit: 10,
      urutan: 1,
      status: 'aktif'
    },
    {
      unit_id: 'SDMK',
      nama_unit: 'SDMK',
      bobot_unit: 10,
      urutan: 2,
      status: 'aktif'
    },
    {
      unit_id: 'PERIZINAN_RS',
      nama_unit: 'Perizinan RS',
      bobot_unit: 10,
      urutan: 3,
      status: 'aktif'
    },
    {
      unit_id: 'KESLING',
      nama_unit: 'Kesling',
      bobot_unit: 10,
      urutan: 4,
      status: 'aktif'
    },
    {
      unit_id: 'SURVEILANS',
      nama_unit: 'Surveilans',
      bobot_unit: 10,
      urutan: 5,
      status: 'aktif'
    },
    {
      unit_id: 'IMUNISASI',
      nama_unit: 'Imunisasi',
      bobot_unit: 10,
      urutan: 6,
      status: 'aktif'
    }
  ]);

  appendIfEmpty_(dbMasterId, CONFIG.SHEETS.MASTER_PERIODE, [
    {
      periode_id: 'PRD2026',
      nama_periode: 'Monev RS Tahun 2026',
      tanggal_mulai_self: '2026-07-01',
      tanggal_akhir_self: '2026-07-31',
      tanggal_mulai_verif: '2026-08-01',
      tanggal_akhir_verif: '2026-09-30',
      status: 'aktif'
    }
  ]);

  appendIfEmpty_(dbMasterId, CONFIG.SHEETS.MASTER_USER, [
    {
      user_id: 'USR0001',
      nama: 'Super Admin',
      email: activeUserEmail,
      role: 'SUPER_ADMIN',
      rs_id: '',
      unit_id: '',
      status: 'aktif'
    }
  ]);
}

function getActiveSetupEmail_() {
  const activeEmail = Session.getActiveUser().getEmail();
  const effectiveEmail = Session.getEffectiveUser().getEmail();

  return normalizeEmail_(activeEmail || effectiveEmail || '');
}