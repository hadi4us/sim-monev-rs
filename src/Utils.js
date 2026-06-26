function now_() {
  return Utilities.formatDate(
    new Date(),
    CONFIG.TIMEZONE,
    'yyyy-MM-dd HH:mm:ss'
  );
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