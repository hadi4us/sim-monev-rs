function doGet(e) {
  return HtmlService
    .createTemplateFromFile('ui/Index')
    .evaluate()
    .setTitle(CONFIG.APP_NAME);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function pingServer() {
  return jsonSuccess_({
    app: CONFIG.APP_NAME,
    version: CONFIG.APP_VERSION,
    server_time: now_()
  }, 'Server Apps Script aktif.');
}