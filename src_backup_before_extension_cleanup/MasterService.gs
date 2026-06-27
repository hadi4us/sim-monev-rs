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
    tanggal_mulai_self: activePeriod.tanggal_mulai_self,
    tanggal_akhir_self: activePeriod.tanggal_akhir_self,
    tanggal_mulai_verif: activePeriod.tanggal_mulai_verif,
    tanggal_akhir_verif: activePeriod.tanggal_akhir_verif,
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