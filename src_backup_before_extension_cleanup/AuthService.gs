function getCurrentUser() {
  try {
    const email = getRuntimeUserEmail_();

    if (!email) {
      return jsonError_(
        'Email user tidak terbaca. Pastikan membuka aplikasi menggunakan akun Google yang diizinkan.'
      );
    }

    const dbMasterId = getDbSpreadsheetId_('MASTER');

    const users = readTable_(
      dbMasterId,
      CONFIG.SHEETS.MASTER_USER
    );

    const user = users.find(function (row) {
      return normalizeEmail_(row.email) === email &&
        isActiveStatus_(row.status);
    });

    if (!user) {
      return jsonError_(
        'User belum terdaftar atau status user tidak aktif.',
        {
          email: email,
          hint: 'Tambahkan email ini ke sheet MASTER_USER dengan status aktif.'
        }
      );
    }

    return jsonSuccess_({
      user_id: normalizeText_(user.user_id),
      nama: normalizeText_(user.nama),
      email: normalizeEmail_(user.email),
      role: normalizeText_(user.role),
      rs_id: normalizeText_(user.rs_id),
      unit_id: normalizeText_(user.unit_id),
      status: normalizeText_(user.status)
    }, 'User aktif berhasil dibaca.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function requireCurrentUser_() {
  const result = getCurrentUser();

  if (!result.success) {
    throw new Error(result.message);
  }

  return result.data;
}

function getRuntimeUserEmail_() {
  const activeEmail = normalizeEmail_(Session.getActiveUser().getEmail());

  if (activeEmail) {
    return activeEmail;
  }

  if (CONFIG.AUTH && CONFIG.AUTH.DEV_ALLOW_EFFECTIVE_USER_FALLBACK) {
    return normalizeEmail_(Session.getEffectiveUser().getEmail());
  }

  return '';
}

function hasRole_(user, allowedRoles) {
  if (!user || !user.role) {
    return false;
  }

  return allowedRoles.indexOf(user.role) !== -1;
}

function assertRole_(user, allowedRoles) {
  if (!hasRole_(user, allowedRoles)) {
    throw new Error('Anda tidak memiliki hak akses untuk aksi ini.');
  }

  return true;
}

function canAccessRs_(user, rsId) {
  if (!user) {
    return false;
  }

  if (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'KOORDINATOR_MONEV' ||
    user.role === 'VERIFIKATOR'
  ) {
    return true;
  }

  return normalizeText_(user.rs_id) === normalizeText_(rsId);
}

function canAccessUnit_(user, unitId) {
  if (!user) {
    return false;
  }

  if (
    user.role === 'SUPER_ADMIN' ||
    user.role === 'KOORDINATOR_MONEV' ||
    user.role === 'ADMIN_RS' ||
    user.role === 'REVIEWER_RS'
  ) {
    return true;
  }

  return normalizeText_(user.unit_id) === normalizeText_(unitId);
}

function debugCurrentUser() {
  const result = getCurrentUser();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}