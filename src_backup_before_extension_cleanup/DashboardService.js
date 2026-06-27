function getDashboardSummary() {
  try {
    const currentUser = requireCurrentUser_();

    const dbMasterId = getDbSpreadsheetId_('MASTER');

    const hospitals = readTable_(
      dbMasterId,
      CONFIG.SHEETS.MASTER_RS
    );

    const users = readTable_(
      dbMasterId,
      CONFIG.SHEETS.MASTER_USER
    );

    const units = readTable_(
      dbMasterId,
      CONFIG.SHEETS.MASTER_UNIT_KERJA
    );

    const periods = readTable_(
      dbMasterId,
      CONFIG.SHEETS.MASTER_PERIODE
    );

    const activeHospitals = hospitals.filter(function (row) {
      return isActiveStatus_(row.status);
    });

    const activeUsers = users.filter(function (row) {
      return isActiveStatus_(row.status);
    });

    const activeUnits = units.filter(function (row) {
      return isActiveStatus_(row.status);
    });

    const activePeriod = periods.find(function (row) {
      return isActiveStatus_(row.status);
    }) || null;

    return jsonSuccess_({
      current_user_role: currentUser.role,
      total_rs_aktif: activeHospitals.length,
      total_user_aktif: activeUsers.length,
      total_unit_kerja_aktif: activeUnits.length,
      total_periode: periods.length,
      periode_aktif: activePeriod
        ? {
            periode_id: normalizeText_(activePeriod.periode_id),
            nama_periode: normalizeText_(activePeriod.nama_periode),
            tanggal_mulai_self: formatDateForClient_(activePeriod.tanggal_mulai_self),
            tanggal_akhir_self: formatDateForClient_(activePeriod.tanggal_akhir_self),
            tanggal_mulai_verif: formatDateForClient_(activePeriod.tanggal_mulai_verif),
            tanggal_akhir_verif: formatDateForClient_(activePeriod.tanggal_akhir_verif),
            status: normalizeText_(activePeriod.status)
          }
        : null
    }, 'Dashboard summary berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function debugDashboardSummary() {
  const result = getDashboardSummary();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}