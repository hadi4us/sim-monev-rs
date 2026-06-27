function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setScriptProperty_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function getDbSpreadsheetId_(dbKey) {
  const propKey = CONFIG.PROP[`DB_${dbKey}`];

  if (!propKey) {
    throw new Error(`Property key database tidak ditemukan untuk: ${dbKey}`);
  }

  const spreadsheetId = getScriptProperty_(propKey);

  if (!spreadsheetId) {
    throw new Error(
      `Database ${dbKey} belum tersedia. Jalankan setupProjectResources() terlebih dahulu.`
    );
  }

  return spreadsheetId;
}

function openSpreadsheet_(spreadsheetId) {
  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID kosong.');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet_(spreadsheetId, sheetName) {
  const ss = openSpreadsheet_(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet tidak ditemukan: ${sheetName}`);
  }

  return sheet;
}

function readTable_(spreadsheetId, sheetName) {
  const sheet = getSheet_(spreadsheetId, sheetName);
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function (header) {
    return String(header).trim();
  });

  return values
    .slice(1)
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== '' && cell !== null;
      });
    })
    .map(function (row) {
      const obj = {};

      headers.forEach(function (header, index) {
        obj[header] = row[index];
      });

      return obj;
    });
}

function appendRows_(spreadsheetId, sheetName, rows) {
  if (!rows || rows.length === 0) {
    return 0;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const sheet = getSheet_(spreadsheetId, sheetName);
    const lastColumn = sheet.getLastColumn();

    if (lastColumn === 0) {
      throw new Error(`Sheet ${sheetName} belum memiliki header.`);
    }

    const headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0]
      .map(function (header) {
        return String(header).trim();
      });

    const values = rows.map(function (rowObj) {
      return headers.map(function (header) {
        return rowObj[header] !== undefined ? rowObj[header] : '';
      });
    });

    sheet
      .getRange(sheet.getLastRow() + 1, 1, values.length, headers.length)
      .setValues(values);

    return values.length;
  } finally {
    lock.releaseLock();
  }
}

function appendIfEmpty_(spreadsheetId, sheetName, rows) {
  const existingRows = readTable_(spreadsheetId, sheetName);

  if (existingRows.length > 0) {
    return 0;
  }

  return appendRows_(spreadsheetId, sheetName, rows);
}

function updateRowById_(spreadsheetId, sheetName, idField, idValue, patch) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);

    const sheet = getSheet_(spreadsheetId, sheetName);
    const values = sheet.getDataRange().getValues();

    if (values.length < 2) {
      throw new Error(`Sheet ${sheetName} belum memiliki data.`);
    }

    const headers = values[0].map(function (header) {
      return String(header).trim();
    });

    const idIndex = headers.indexOf(idField);

    if (idIndex === -1) {
      throw new Error(`Field ID ${idField} tidak ditemukan di sheet ${sheetName}.`);
    }

    let targetRowNumber = -1;
    let targetRowObject = null;

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idIndex]) === String(idValue)) {
        targetRowNumber = i + 1;

        targetRowObject = {};
        headers.forEach(function (header, index) {
          targetRowObject[header] = values[i][index];
        });

        break;
      }
    }

    if (targetRowNumber === -1) {
      throw new Error(`Data dengan ${idField} = ${idValue} tidak ditemukan.`);
    }

    const updatedObject = Object.assign({}, targetRowObject, patch);

    const updatedValues = headers.map(function (header) {
      return updatedObject[header] !== undefined ? updatedObject[header] : '';
    });

    sheet
      .getRange(targetRowNumber, 1, 1, headers.length)
      .setValues([updatedValues]);

    return updatedObject;
  } finally {
    lock.releaseLock();
  }
}

function findRowById_(spreadsheetId, sheetName, idField, idValue) {
  const rows = readTable_(spreadsheetId, sheetName);

  return rows.find(function (row) {
    return String(row[idField]) === String(idValue);
  }) || null;
}