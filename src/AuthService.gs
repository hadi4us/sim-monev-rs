function requestLoginOtp(email) {
  try {
    email = normalizeEmail_(email);

    if (!email) {
      return jsonError_('Email wajib diisi.');
    }

    const user = findActiveUserByEmail_(email);

    if (!user) {
      return jsonError_(
        'Email belum terdaftar atau status user tidak aktif.',
        {
          email: email,
          hint: 'Pastikan email sudah ada di MASTER_USER dan status = aktif.'
        }
      );
    }

    const otp = generateOtp_();
    const otpHash = hashText_(email + '|' + otp + '|' + getAuthSecret_());

    CacheService
      .getScriptCache()
      .put('LOGIN_OTP_' + email, otpHash, 600);

    MailApp.sendEmail({
      to: email,
      subject: 'Kode OTP SIM Monev RS',
      body:
        'Kode OTP SIM Monev RS Anda adalah: ' + otp + '\n\n' +
        'Kode ini berlaku selama 10 menit.\n\n' +
        'Abaikan email ini jika Anda tidak meminta login.'
    });

    return jsonSuccess_({
      email: email,
      expires_minutes: 10
    }, 'OTP berhasil dikirim ke email.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function verifyLoginOtp(email, otp) {
  try {
    email = normalizeEmail_(email);
    otp = normalizeText_(otp);

    if (!email || !otp) {
      return jsonError_('Email dan OTP wajib diisi.');
    }

    const cachedHash = CacheService
      .getScriptCache()
      .get('LOGIN_OTP_' + email);

    if (!cachedHash) {
      return jsonError_('OTP sudah kedaluwarsa atau belum diminta.');
    }

    const submittedHash = hashText_(email + '|' + otp + '|' + getAuthSecret_());

    if (cachedHash !== submittedHash) {
      return jsonError_('OTP tidak sesuai.');
    }

    const user = findActiveUserByEmail_(email);

    if (!user) {
      return jsonError_('User tidak aktif atau tidak terdaftar.');
    }

    const token = Utilities.getUuid() + '-' + Utilities.getUuid();

    CacheService
      .getScriptCache()
      .put('AUTH_TOKEN_' + token, email, 21600);

    CacheService
      .getScriptCache()
      .remove('LOGIN_OTP_' + email);

    return jsonSuccess_({
      token: token,
      user: sanitizeUser_(user),
      expires_hours: 6
    }, 'Login berhasil.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function logout(authToken) {
  try {
    if (authToken) {
      CacheService
        .getScriptCache()
        .remove('AUTH_TOKEN_' + authToken);
    }

    return jsonSuccess_(null, 'Logout berhasil.');
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function getCurrentUser(authToken) {
  try {
    const user = resolveUserFromToken_(authToken);

    return jsonSuccess_(
      sanitizeUser_(user),
      'User aktif berhasil dibaca.'
    );
  } catch (err) {
    return jsonError_(err.message, err.stack);
  }
}

function requireCurrentUser_(authToken) {
  const result = getCurrentUser(authToken);

  if (!result.success) {
    throw new Error(result.message);
  }

  return result.data;
}

function resolveUserFromToken_(authToken) {
  authToken = normalizeText_(authToken);

  if (!authToken) {
    throw new Error('Token login tidak ditemukan. Silakan login ulang.');
  }

  const email = CacheService
    .getScriptCache()
    .get('AUTH_TOKEN_' + authToken);

  if (!email) {
    throw new Error('Sesi login sudah berakhir. Silakan login ulang.');
  }

  const user = findActiveUserByEmail_(email);

  if (!user) {
    throw new Error('User tidak aktif atau tidak terdaftar.');
  }

  return user;
}

function findActiveUserByEmail_(email) {
  email = normalizeEmail_(email);

  const dbMasterId = getDbSpreadsheetId_('MASTER');

  const users = readTable_(
    dbMasterId,
    CONFIG.SHEETS.MASTER_USER
  );

  return users.find(function (row) {
    return normalizeEmail_(row.email) === email &&
      isActiveStatus_(row.status);
  }) || null;
}

function sanitizeUser_(user) {
  return {
    user_id: normalizeText_(user.user_id),
    nama: normalizeText_(user.nama),
    email: normalizeEmail_(user.email),
    role: normalizeText_(user.role),
    rs_id: normalizeText_(user.rs_id),
    unit_id: normalizeText_(user.unit_id),
    status: normalizeText_(user.status)
  };
}

function generateOtp_() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getAuthSecret_() {
  const key = 'AUTH_SECRET';
  let secret = getScriptProperty_(key);

  if (!secret) {
    secret = Utilities.getUuid() + '-' + Utilities.getUuid();
    setScriptProperty_(key, secret);
  }

  return secret;
}

function hashText_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function (byte) {
    const v = byte < 0 ? byte + 256 : byte;
    return v.toString(16).padStart(2, '0');
  }).join('');
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

function debugAuthorizeMail() {
  const quota = MailApp.getRemainingDailyQuota();

  Logger.log('Mail quota remaining: ' + quota);

  return jsonSuccess_({
    quota: quota
  }, 'MailApp sudah terotorisasi.');
}

function debugSessionUser() {
  const result = {
    active_user: normalizeEmail_(Session.getActiveUser().getEmail()),
    effective_user: normalizeEmail_(Session.getEffectiveUser().getEmail()),
    note: 'Jika active_user kosong, gunakan login OTP internal.'
  };

  Logger.log(JSON.stringify(result, null, 2));

  return jsonSuccess_(result, 'Debug session user berhasil.');
}