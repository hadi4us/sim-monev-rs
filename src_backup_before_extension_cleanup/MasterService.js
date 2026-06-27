function getMasterBootstrap() {
  try {
    const currentUserResult = getCurrentUser();

    if (!currentUserResult.success) {
      return currentUserResult;
    }

    const dbMasterId = getDbSpreadsheetId_('MASTER');

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
        status: normalizeText_(row.status)
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
        status: normalizeText_(row.status)
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
        status: normalizeText_(row.status)
      };
    });
}

function debugMasterBootstrap() {
  const result = getMasterBootstrap();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function getHospitalList() {
  try {
    const user = requireCurrentUser_();

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
    const user = requireCurrentUser_();

    if (user.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat menyimpan master RS.');
    }

    payload = payload || {};

    const dbMasterId = getDbSpreadsheetId_('MASTER');
    const sheetName = CONFIG.SHEETS.MASTER_RS;

    const rsId = normalizeText_(payload.rs_id);
    const now = now_();

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
        hospital: updated,
        updated_at: now
      }, 'Data rumah sakit berhasil diperbarui.');
    }

    appendRows_(dbMasterId, sheetName, [hospitalData]);

    return jsonSuccess_({
      hospital: hospitalData,
      created_at: now
    }, 'Data rumah sakit berhasil ditambahkan.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getActiveAndInactiveHospitals_() {
  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const hospitals = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_RS
  );

  return hospitals
    .map(function (row) {
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
    })
    .sort(function (a, b) {
      return a.nama_rs.localeCompare(b.nama_rs);
    });
}

function debugHospitalList() {
  const result = getHospitalList();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function getMasterUserBootstrap() {
  try {
    const currentUser = requireCurrentUser_();

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
    const currentUser = requireCurrentUser_();

    if (currentUser.role !== 'SUPER_ADMIN') {
      return jsonError_('Hanya SUPER_ADMIN yang dapat menyimpan master user.');
    }

    payload = payload || {};

    const dbMasterId = getDbSpreadsheetId_('MASTER');
    const sheetName = CONFIG.SHEETS.MASTER_USER;

    const userId = normalizeText_(payload.user_id);
    const email = normalizeEmail_(payload.email);
    const role = normalizeText_(payload.role);
    const rsId = normalizeText_(payload.rs_id);
    const unitId = normalizeText_(payload.unit_id);
    const status = normalizeStatus_(payload.status || 'aktif');

    if (!normalizeText_(payload.nama)) {
      return jsonError_('Nama user wajib diisi.');
    }

    if (!email) {
      return jsonError_('Email user wajib diisi.');
    }

    if (!role) {
      return jsonError_('Role user wajib dipilih.');
    }

    if (
      (role === 'ADMIN_RS' || role === 'OPERATOR_RS' || role === 'REVIEWER_RS' || role === 'VIEWER_RS') &&
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
      nama: normalizeText_(payload.nama),
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
        user: updated
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
      return {
        user_id: normalizeText_(row.user_id),
        nama: normalizeText_(row.nama),
        email: normalizeEmail_(row.email),
        role: normalizeText_(row.role),
        rs_id: normalizeText_(row.rs_id),
        unit_id: normalizeText_(row.unit_id),
        status: normalizeStatus_(row.status)
      };
    })
    .sort(function (a, b) {
      return a.nama.localeCompare(b.nama);
    });
}

function debugMasterUserBootstrap() {
  const result = getMasterUserBootstrap();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}