const SPREADSHEET_ID = '1Pudo5y5GyTxQalhXAC1KELEqFZ_FtVMXkU95mK3HQ8k';

const SHEETS = {
  BabyProfile: ['id', 'baby_name', 'birth_date'],
  MenuPlanner: ['id', 'week', 'day', 'menu'],
  FeedingSchedule: ['id', 'week', 'date', 'day', 'breakfast', 'lunch', 'evening', 'dinner'],
  Recipes: ['id', 'title', 'image_url', 'age_category', 'category', 'ingredients', 'instructions', 'notes', 'source_link'],
  FoodTracker: ['id', 'food_name', 'introduced_date', 'status', 'reaction', 'notes'],
};

function doGet(e) {
  try {
    const action = (e.parameter.action || 'readAll').trim();

    if (action === 'bootstrap') {
      ensureSheets_();
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'readAll') {
      ensureSheets_();
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'upsert') {
      ensureSheets_();
      const sheetName = e.parameter.sheet;
      const row = JSON.parse(e.parameter.row || '{}');
      upsertRow_(sheetName, row);
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'delete') {
      ensureSheets_();
      const sheetName = e.parameter.sheet;
      const id = e.parameter.id;
      deleteRow_(sheetName, id);
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'seed') {
      ensureSheets_();
      const data = JSON.parse(e.parameter.data || '{}');
      seedData_(data);
      return respond_(e, true, { data: readAll_() });
    }

    return respond_(e, false, { message: 'Unknown GET action' });
  } catch (error) {
    return respond_(e, false, { message: String(error) });
  }
}

function doPost(e) {
  try {
    ensureSheets_();
    const action = (e.parameter.action || '').trim();

    if (action === 'upsert') {
      const sheetName = e.parameter.sheet;
      const row = JSON.parse(e.parameter.row || '{}');
      upsertRow_(sheetName, row);
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'delete') {
      const sheetName = e.parameter.sheet;
      const id = e.parameter.id;
      deleteRow_(sheetName, id);
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'seed') {
      const data = JSON.parse(e.parameter.data || '{}');
      seedData_(data);
      return respond_(e, true, { data: readAll_() });
    }

    return respond_(e, false, { message: 'Unknown POST action' });
  } catch (error) {
    return respond_(e, false, { message: String(error) });
  }
}

function ensureSheets_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  Object.keys(SHEETS).forEach((sheetName) => {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) sheet = spreadsheet.insertSheet(sheetName);

    const headers = SHEETS[sheetName];
    const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const sameHeaders = headers.every((header, index) => currentHeaders[index] === header);
    if (!sameHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  });
}

function readAll_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const payload = {};

  Object.keys(SHEETS).forEach((sheetName) => {
    const headers = SHEETS[sheetName];
    const sheet = spreadsheet.getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      payload[sheetName] = [];
      return;
    }

    const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    payload[sheetName] = values
      .filter((row) => row.some((cell) => cell !== ''))
      .map((row) => headers.reduce((entry, header, index) => {
        entry[header] = formatCell_(row[index]);
        return entry;
      }, {}));
  });

  return payload;
}

function upsertRow_(sheetName, row) {
  validateSheet_(sheetName);
  const headers = SHEETS[sheetName];
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const id = String(row.id || '').trim();
  if (!id) throw new Error('Missing row id');

  const values = headers.map((header) => row[header] === null || row[header] === undefined ? '' : String(row[header]));
  const dataRowCount = sheet.getLastRow() - 1;
  const ids = dataRowCount > 0 ? sheet.getRange(2, 1, dataRowCount, 1).getValues().flat() : [];
  const existingIndex = ids.findIndex((value) => String(value) === id);

  if (existingIndex >= 0) {
    sheet.getRange(existingIndex + 2, 1, 1, headers.length).setValues([values]);
    return;
  }

  sheet.appendRow(values);
}

function deleteRow_(sheetName, id) {
  validateSheet_(sheetName);
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const dataRowCount = sheet.getLastRow() - 1;
  const ids = dataRowCount > 0 ? sheet.getRange(2, 1, dataRowCount, 1).getValues().flat() : [];
  const existingIndex = ids.findIndex((value) => String(value) === String(id));
  if (existingIndex >= 0) {
    sheet.deleteRow(existingIndex + 2);
  }
}

function seedData_(data) {
  Object.keys(SHEETS).forEach((sheetName) => {
    const rows = Array.isArray(data[sheetName]) ? data[sheetName] : [];
    rows.forEach((row) => upsertRow_(sheetName, row));
  });
}

function validateSheet_(sheetName) {
  if (!SHEETS[sheetName]) throw new Error('Invalid sheet name');
}

function formatCell_(value) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

function respond_(e, ok, payload) {
  const response = JSON.stringify({ ok, ...payload });
  const callback = e && e.parameter ? e.parameter.callback : '';

  if (callback) {
    return ContentService.createTextOutput(`${callback}(${response})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(response).setMimeType(ContentService.MimeType.JSON);
}
