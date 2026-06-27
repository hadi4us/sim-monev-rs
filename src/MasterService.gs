function getMasterBootstrap(authToken) {
  try {
    const currentUserResult = getCurrentUser(authToken);

    if (!currentUserResult.success) {
      return currentUserResult;
    }

    const activePeriod = getActivePeriod_();
    const activeUnits = getActiveUnits_();
    const roles = getActiveRoles_();

    return jsonSuccess_({
      currentUser: currentUserResult.data,
      activePeriod: activePeriod,
      activeUnits: activeUnits,
      roles: roles
    }, 'Bootstrap master berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getActivePeriod_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const periods = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_PERIODE
  );

  const activePeriod = periods.find(function (row) {
    return isActiveStatus_(row.status);
  });

  if (!activePeriod) {
    return null;
  }

  return {
    periode_id: normalizeText_(activePeriod.periode_id),
    nama_periode: normalizeText_(activePeriod.nama_periode),
    tanggal_mulai_self: formatDateForClient_(activePeriod.tanggal_mulai_self),
    tanggal_akhir_self: formatDateForClient_(activePeriod.tanggal_akhir_self),
    tanggal_mulai_verif: formatDateForClient_(activePeriod.tanggal_mulai_verif),
    tanggal_akhir_verif: formatDateForClient_(activePeriod.tanggal_akhir_verif),
    status: normalizeText_(activePeriod.status)
  };
}

function getActiveUnits_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const units = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_UNIT_KERJA
  );

  return units
    .filter(function (row) {
      return isActiveStatus_(row.status);
    })
    .map(function (row) {
      return {
        unit_id: normalizeText_(row.unit_id),
        nama_unit: normalizeText_(row.nama_unit),
        bobot_unit: Number(row.bobot_unit || 0),
        urutan: Number(row.urutan || 0),
        status: normalizeStatus_(row.status)
      };
    })
    .sort(function (a, b) {
      return a.urutan - b.urutan;
    });
}

function getActiveRoles_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const roles = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_ROLE
  );

  return roles
    .filter(function (row) {
      return isActiveStatus_(row.status);
    })
    .map(function (row) {
      return {
        role_id: normalizeText_(row.role_id),
        role_name: normalizeText_(row.role_name),
        description: normalizeText_(row.description),
        status: normalizeStatus_(row.status)
      };
    });
}

function getActiveHospitals_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const hospitals = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_RS
  );

  return hospitals
    .filter(function (row) {
      return isActiveStatus_(row.status);
    })
    .map(function (row) {
      return sanitizeHospital_(row);
    })
    .sort(function (a, b) {
      return a.nama_rs.localeCompare(b.nama_rs);
    });
}

function getActiveAndInactiveHospitals_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const hospitals = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_RS
  );

  return hospitals
    .map(function (row) {
      return sanitizeHospital_(row);
    })
    .sort(function (a, b) {
      return a.nama_rs.localeCompare(b.nama_rs);
    });
}

function sanitizeHospital_(row) {
  return {
    rs_id: normalizeText_(row.rs_id),
    kode_rs: normalizeText_(row.kode_rs),
    nama_rs: normalizeText_(row.nama_rs),
    kelas_rs: normalizeText_(row.kelas_rs),
    jenis_rs: normalizeText_(row.jenis_rs),
    kepemilikan: normalizeText_(row.kepemilikan),
    alamat: normalizeText_(row.alamat),
    kecamatan: normalizeText_(row.kecamatan),
    pic_nama: normalizeText_(row.pic_nama),
    pic_email: normalizeEmail_(row.pic_email),
    status: normalizeStatus_(row.status)
  };
}

function getHospitalList(authToken) {
  try {
    const user = requireCurrentUser_(authToken);

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'KOORDINATOR_MONEV' &&
      user.role !== 'VERIFIKATOR'
    ) {
      return jsonError_('Anda tidak memiliki akses untuk melihat master RS.');
    }

    const hospitals = getActiveAndInactiveHospitals_();

    return jsonSuccess_({
      hospitals: hospitals
    }, 'Daftar rumah sakit berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function saveHospital(payload) {
  try {
    payload = payload || {};

    const user = requireCurrentUser_(payload.authToken);

    if (user.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat menyimpan master RS.');
    }

    const dbMasterId = getDbSpreadsheetId_('MASTER');
    const sheetName = CONFIG.SHEETS.MASTER_RS;

    const rsId = normalizeText_(payload.rs_id);

    const hospitalData = {
      rs_id: rsId || generateId_('RS'),
      kode_rs: normalizeText_(payload.kode_rs),
      nama_rs: normalizeText_(payload.nama_rs),
      kelas_rs: normalizeText_(payload.kelas_rs),
      jenis_rs: normalizeText_(payload.jenis_rs),
      kepemilikan: normalizeText_(payload.kepemilikan),
      alamat: normalizeText_(payload.alamat),
      kecamatan: normalizeText_(payload.kecamatan),
      pic_nama: normalizeText_(payload.pic_nama),
      pic_email: normalizeEmail_(payload.pic_email),
      status: normalizeStatus_(payload.status || 'aktif')
    };

    if (!hospitalData.nama_rs) {
      return jsonError_('Nama rumah sakit wajib diisi.');
    }

    if (!hospitalData.status) {
      hospitalData.status = 'aktif';
    }

    if (rsId) {
      const before = findRowById_(
        dbMasterId,
        sheetName,
        'rs_id',
        rsId
      );

      if (!before) {
        return jsonError_(`RS dengan ID ${rsId} tidak ditemukan.`);
      }

      const updated = updateRowById_(
        dbMasterId,
        sheetName,
        'rs_id',
        rsId,
        hospitalData
      );

      return jsonSuccess_({
        hospital: sanitizeHospital_(updated),
        updated_at: now_()
      }, 'Data rumah sakit berhasil diperbarui.');
    }

    appendRows_(dbMasterId, sheetName, [hospitalData]);

    return jsonSuccess_({
      hospital: hospitalData,
      created_at: now_()
    }, 'Data rumah sakit berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getMasterUserBootstrap(authToken) {
  try {
    const currentUser = requireCurrentUser_(authToken);

    if (currentUser.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat mengelola master user.');
    }

    const users = getActiveAndInactiveUsers_();
    const roles = getActiveRoles_();
    const hospitals = getActiveAndInactiveHospitals_();
    const units = getActiveUnits_();

    return jsonSuccess_({
      users: users,
      roles: roles,
      hospitals: hospitals,
      units: units
    }, 'Bootstrap master user berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function saveMasterUser(payload) {
  try {
    payload = payload || {};

    const currentUser = requireCurrentUser_(payload.authToken);

    if (currentUser.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat menyimpan master user.');
    }

    const dbMasterId = getDbSpreadsheetId_('MASTER');
    const sheetName = CONFIG.SHEETS.MASTER_USER;

    const userId = normalizeText_(payload.user_id);
    const nama = normalizeText_(payload.nama);
    const email = normalizeEmail_(payload.email);
    const role = normalizeText_(payload.role);
    const rsId = normalizeText_(payload.rs_id);
    const unitId = normalizeText_(payload.unit_id);
    const status = normalizeStatus_(payload.status || 'aktif');

    if (!nama) {
      return jsonError_('Nama user wajib diisi.');
    }

    if (!email) {
      return jsonError_('Email user wajib diisi.');
    }

    if (!role) {
      return jsonError_('Role user wajib dipilih.');
    }

    if (
      (
        role === 'ADMIN_RS' ||
        role === 'OPERATOR_RS' ||
        role === 'REVIEWER_RS' ||
        role === 'VIEWER_RS'
      ) &&
      !rsId
    ) {
      return jsonError_('User dengan role RS wajib memilih rumah sakit.');
    }

    if (role === 'VERIFIKATOR' && !unitId) {
      return jsonError_('User VERIFIKATOR wajib memilih unit kerja.');
    }

    const users = readTable_(
      dbMasterId,
      sheetName
    );

    const duplicateEmail = users.find(function (row) {
      return normalizeEmail_(row.email) === email &&
        normalizeText_(row.user_id) !== userId;
    });

    if (duplicateEmail) {
      return jsonError_(
        'Email sudah terdaftar pada user lain.',
        {
          email: email,
          existing_user_id: duplicateEmail.user_id
        }
      );
    }

    const userData = {
      user_id: userId || generateId_('USR'),
      nama: nama,
      email: email,
      role: role,
      rs_id: rsId,
      unit_id: unitId,
      status: status || 'aktif'
    };

    if (userId) {
      const before = findRowById_(
        dbMasterId,
        sheetName,
        'user_id',
        userId
      );

      if (!before) {
        return jsonError_(`User dengan ID ${userId} tidak ditemukan.`);
      }

      const updated = updateRowById_(
        dbMasterId,
        sheetName,
        'user_id',
        userId,
        userData
      );

      return jsonSuccess_({
        user: sanitizeMasterUser_(updated)
      }, 'Data user berhasil diperbarui.');
    }

    appendRows_(dbMasterId, sheetName, [userData]);

    return jsonSuccess_({
      user: userData
    }, 'Data user berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getActiveAndInactiveUsers_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const users = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_USER
  );

  return users
    .map(function (row) {
      return sanitizeMasterUser_(row);
    })
    .sort(function (a, b) {
      return a.nama.localeCompare(b.nama);
    });
}

function sanitizeMasterUser_(row) {
  return {
    user_id: normalizeText_(row.user_id),
    nama: normalizeText_(row.nama),
    email: normalizeEmail_(row.email),
    role: normalizeText_(row.role),
    rs_id: normalizeText_(row.rs_id),
    unit_id: normalizeText_(row.unit_id),
    status: normalizeStatus_(row.status)
  };
}

function debugMasterBootstrap() {
  const result = getMasterBootstrap('');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function debugHospitalList() {
  const result = getHospitalList('');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function debugMasterUserBootstrap() {
  const result = getMasterUserBootstrap('');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function getMasterUnitPeriodBootstrap(authToken) {
  try {
    const currentUser = requireCurrentUser_(authToken);

    if (currentUser.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat mengelola unit kerja dan periode.');
    }

    return jsonSuccess_({
      units: getActiveAndInactiveUnits_(),
      periods: getActiveAndInactivePeriods_()
    }, 'Bootstrap unit kerja dan periode berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getActiveAndInactiveUnits_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const units = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_UNIT_KERJA
  );

  return units
    .map(function (row) {
      return {
        unit_id: normalizeText_(row.unit_id),
        nama_unit: normalizeText_(row.nama_unit),
        bobot_unit: Number(row.bobot_unit || 0),
        urutan: Number(row.urutan || 0),
        status: normalizeStatus_(row.status)
      };
    })
    .sort(function (a, b) {
      return a.urutan - b.urutan;
    });
}

function getActiveAndInactivePeriods_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const periods = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_PERIODE
  );

  return periods
    .map(function (row) {
      return {
        periode_id: normalizeText_(row.periode_id),
        nama_periode: normalizeText_(row.nama_periode),
        tanggal_mulai_self: formatDateForClient_(row.tanggal_mulai_self),
        tanggal_akhir_self: formatDateForClient_(row.tanggal_akhir_self),
        tanggal_mulai_verif: formatDateForClient_(row.tanggal_mulai_verif),
        tanggal_akhir_verif: formatDateForClient_(row.tanggal_akhir_verif),
        status: normalizeStatus_(row.status)
      };
    })
    .sort(function (a, b) {
      return a.periode_id.localeCompare(b.periode_id);
    });
}

function saveUnitKerja(payload) {
  try {
    payload = payload || {};

    const currentUser = requireCurrentUser_(payload.authToken);

    if (currentUser.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat menyimpan unit kerja.');
    }

    const dbMasterId = getDbSpreadsheetId_('MASTER');
    const sheetName = CONFIG.SHEETS.MASTER_UNIT_KERJA;

    const unitId = normalizeText_(payload.unit_id);

    const unitData = {
      unit_id: unitId || generateId_('UNIT'),
      nama_unit: normalizeText_(payload.nama_unit),
      bobot_unit: Number(payload.bobot_unit || 0),
      urutan: Number(payload.urutan || 0),
      status: normalizeStatus_(payload.status || 'aktif')
    };

    if (!unitData.nama_unit) {
      return jsonError_('Nama unit kerja wajib diisi.');
    }

    if (unitData.bobot_unit < 0) {
      return jsonError_('Bobot unit tidak boleh negatif.');
    }

    if (unitId) {
      const before = findRowById_(
        dbMasterId,
        sheetName,
        'unit_id',
        unitId
      );

      if (!before) {
        return jsonError_(`Unit kerja dengan ID ${unitId} tidak ditemukan.`);
      }

      const updated = updateRowById_(
        dbMasterId,
        sheetName,
        'unit_id',
        unitId,
        unitData
      );

      return jsonSuccess_({
        unit: updated
      }, 'Unit kerja berhasil diperbarui.');
    }

    appendRows_(dbMasterId, sheetName, [unitData]);

    return jsonSuccess_({
      unit: unitData
    }, 'Unit kerja berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function savePeriode(payload) {
  try {
    payload = payload || {};

    const currentUser = requireCurrentUser_(payload.authToken);

    if (currentUser.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat menyimpan periode.');
    }

    const dbMasterId = getDbSpreadsheetId_('MASTER');
    const sheetName = CONFIG.SHEETS.MASTER_PERIODE;

    const periodeId = normalizeText_(payload.periode_id);

    const periodeData = {
      periode_id: periodeId || generateId_('PRD'),
      nama_periode: normalizeText_(payload.nama_periode),
      tanggal_mulai_self: normalizeText_(payload.tanggal_mulai_self),
      tanggal_akhir_self: normalizeText_(payload.tanggal_akhir_self),
      tanggal_mulai_verif: normalizeText_(payload.tanggal_mulai_verif),
      tanggal_akhir_verif: normalizeText_(payload.tanggal_akhir_verif),
      status: normalizeStatus_(payload.status || 'draft')
    };

    if (!periodeData.nama_periode) {
      return jsonError_('Nama periode wajib diisi.');
    }

    if (!periodeData.tanggal_mulai_self || !periodeData.tanggal_akhir_self) {
      return jsonError_('Tanggal mulai dan akhir self assessment wajib diisi.');
    }

    if (!periodeData.tanggal_mulai_verif || !periodeData.tanggal_akhir_verif) {
      return jsonError_('Tanggal mulai dan akhir verifikasi wajib diisi.');
    }

    if (periodeData.status === 'aktif') {
      deactivateOtherPeriods_(dbMasterId, sheetName, periodeData.periode_id);
    }

    if (periodeId) {
      const before = findRowById_(
        dbMasterId,
        sheetName,
        'periode_id',
        periodeId
      );

      if (!before) {
        return jsonError_(`Periode dengan ID ${periodeId} tidak ditemukan.`);
      }

      const updated = updateRowById_(
        dbMasterId,
        sheetName,
        'periode_id',
        periodeId,
        periodeData
      );

      return jsonSuccess_({
        periode: updated
      }, 'Periode berhasil diperbarui.');
    }

    appendRows_(dbMasterId, sheetName, [periodeData]);

    return jsonSuccess_({
      periode: periodeData
    }, 'Periode berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function deactivateOtherPeriods_(spreadsheetId, sheetName, activePeriodeId) {
  const periods = readTable_(spreadsheetId, sheetName);

  periods.forEach(function (period) {
    const periodeId = normalizeText_(period.periode_id);

    if (
      periodeId &&
      periodeId !== activePeriodeId &&
      isActiveStatus_(period.status)
    ) {
      updateRowById_(
        spreadsheetId,
        sheetName,
        'periode_id',
        periodeId,
        {
          status: 'selesai'
        }
      );
    }
  });
}