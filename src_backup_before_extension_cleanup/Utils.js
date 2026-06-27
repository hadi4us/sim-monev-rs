function now_() {
  return Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    'yyyy-MM-dd HH:mm:ss'
  );
}

function generateId_(prefix) {
  const timestamp = Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    'yyyyMMddHHmmss'
  );

  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  return `${prefix}-${timestamp}-${random}`;
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeText_(value) {
  return String(value || '').trim();
}

function normalizeStatus_(value) {
  return String(value || '').trim().toLowerCase();
}

function isActiveStatus_(value) {
  return normalizeStatus_(value) === 'aktif';
}

function jsonSuccess_(data, message) {
  return {
    success: true,
    message: message || 'OK',
    data: data || null
  };
}

function jsonError_(message, details) {
  return {
    success: false,
    message: message || 'Terjadi kesalahan',
    details: details || null
  };
}

function formatDateForClient_(value) {
  if (!value) {
    return '';
  }

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(
      value,
      CONFIG.TIMEZONE,
      'yyyy-MM-dd'
    );
  }

  return String(value);
}