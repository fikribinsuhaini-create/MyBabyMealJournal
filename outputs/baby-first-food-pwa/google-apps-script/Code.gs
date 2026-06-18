const SPREADSHEET_ID = '1Pudo5y5GyTxQalhXAC1KELEqFZ_FtVMXkU95mK3HQ8k';
const IMAGE_FOLDER_PROPERTY = '1E09YtnyIMt_BJzUHQUGgPPP27xeV3XKF';

const SHEETS = {
  BabyProfile: ['id', 'baby_name', 'birth_date'],
  MenuPlanner: ['id', 'week', 'age_category', 'date', 'day', 'menu'],
  FeedingSchedule: ['id', 'week', 'age_category', 'date', 'day', 'breakfast', 'lunch', 'evening', 'dinner'],
  Recipes: ['id', 'title', 'image_url', 'age_category', 'category', 'ingredients', 'instructions', 'notes'],
  FoodTracker: ['id', 'food_name', 'introduced_date', 'status', 'reaction', 'notes', 'image_url'],
};

const AGE_CATEGORIES = ['6 Bulan', '7 Bulan', '8 Bulan', '9 Bulan', '10 Bulan', '11 Bulan', '12 Bulan Ke Atas'];

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
      const row = parseJsonParameter_(e.parameter.row);
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
      const data = parseJsonParameter_(e.parameter.data);
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
    const payload = getRequestPayload_(e);
    const action = String(payload.action || '').trim();

    if (action === 'upsert') {
      const sheetName = payload.sheet;
      const row = parseJsonParameter_(payload.row);
      upsertRow_(sheetName, row);
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'delete') {
      const sheetName = payload.sheet;
      const id = payload.id;
      deleteRow_(sheetName, id);
      return respond_(e, true, { data: readAll_() });
    }

    if (action === 'seed') {
      const data = parseJsonParameter_(payload.data);
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

    if (sheetName === 'MenuPlanner') {
      migrateMenuPlannerSheet_(sheet, headers);
    }

    if (sheetName === 'FeedingSchedule') {
      migrateFeedingScheduleSheet_(sheet, headers);
    }
  });
}

function migrateMenuPlannerSheet_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  let needsMigration = lastColumn !== headers.length;
  const migrated = values.map((row) => {
    const entry = headers.reduce((accumulator, header, index) => {
      accumulator[header] = formatCell_(row[index]);
      return accumulator;
    }, {});
    const normalized = normalizeMenuPlannerRow_(entry);
    if (JSON.stringify(entry) !== JSON.stringify(normalized)) {
      needsMigration = true;
    }
    return headers.map((header) => normalized[header] || '');
  });

  if (needsMigration) {
    sheet.getRange(2, 1, migrated.length, headers.length).setValues(migrated);
    if (lastColumn > headers.length) {
      sheet.deleteColumns(headers.length + 1, lastColumn - headers.length);
    }
  }
}

function migrateFeedingScheduleSheet_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  let needsMigration = false;
  const migrated = values.map((row) => {
    const entry = headers.reduce((accumulator, header, index) => {
      accumulator[header] = formatCell_(row[index]);
      return accumulator;
    }, {});
    const normalized = normalizeFeedingScheduleRow_(entry);
    if (JSON.stringify(entry) !== JSON.stringify(normalized)) {
      needsMigration = true;
    }
    return headers.map((header) => normalized[header] || '');
  });

  if (needsMigration) {
    sheet.getRange(2, 1, migrated.length, headers.length).setValues(migrated);
  }
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
      }, {}))
      .map((row) => sheetName === 'MenuPlanner' ? normalizeMenuPlannerRow_(row) : row)
      .map((row) => sheetName === 'FeedingSchedule' ? normalizeFeedingScheduleRow_(row) : row);
  });

  return payload;
}

function upsertRow_(sheetName, row) {
  validateSheet_(sheetName);
  const headers = SHEETS[sheetName];
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  const id = String(row.id || '').trim();
  if (!id) throw new Error('Missing row id');

  const normalizedRow = sheetName === 'FeedingSchedule'
    ? normalizeFeedingScheduleRow_(row)
    : sheetName === 'MenuPlanner'
      ? normalizeMenuPlannerRow_(row)
    : sheetName === 'FoodTracker'
      ? normalizeFoodTrackerRow_(row)
      : row;
  const values = headers.map((header) => normalizedRow[header] === null || normalizedRow[header] === undefined ? '' : String(normalizedRow[header]));
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

function getRequestPayload_(e) {
  const params = e && e.parameter ? e.parameter : {};
  const body = e && e.postData && e.postData.contents ? parseJsonParameter_(e.postData.contents) : {};

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return Object.assign({}, body, params);
  }

  return params;
}

function parseJsonParameter_(value) {
  if (value && typeof value === 'object') {
    return value;
  }

  const raw = String(value || '{}');

  try {
    return JSON.parse(raw);
  } catch (error) {
    return JSON.parse(decodeURIComponent(raw));
  }
}

function normalizeMenuPlannerRow_(row) {
  const next = Object.assign({}, row);
  const legacyShiftedRow = isLegacyMenuPlannerShift_(next);

  if (legacyShiftedRow) {
    const legacyDay = next.date;
    const legacyMenu = next.day;
    next.date = '';
    next.day = legacyDay;
    next.menu = legacyMenu;
  }

  return next;
}

function isLegacyMenuPlannerShift_(row) {
  return !isIsoDate_(row.date) && isDayLabel_(row.date) && String(row.menu || '').trim() === '';
}

function normalizeFeedingScheduleRow_(row) {
  const next = Object.assign({}, row);
  const legacyDateStoredInAgeCategory = isIsoDate_(next.age_category) && !isIsoDate_(next.date);

  if (legacyDateStoredInAgeCategory) {
    const legacyDate = next.age_category;
    const legacyDay = next.date;
    const inferredAgeCategory = inferAgeCategory_(next);
    next.date = legacyDate;
    next.day = legacyDay || next.day;
    next.age_category = inferredAgeCategory || next.age_category;
  }

  if (!isValidAgeCategory_(next.age_category)) {
    const inferredAgeCategory = inferAgeCategory_(next);
    if (inferredAgeCategory) {
      next.age_category = inferredAgeCategory;
    }
  }

  return next;
}

function normalizeFoodTrackerRow_(row) {
  const next = Object.assign({}, row);
  if (looksLikeDataUrl_(next.image_url)) {
    next.image_url = storeTrackerImage_(next.image_url, next.food_name);
  }
  return next;
}

function storeTrackerImage_(dataUrl, foodName) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return String(dataUrl || '');

  const mimeType = match[1];
  const base64 = match[2];
  const bytes = Utilities.base64Decode(base64);
  const safeName = String(foodName || 'baby-food').trim().replace(/[^\w\-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'baby-food';
  const extension = mimeType.split('/')[1] || 'jpg';
  const blob = Utilities.newBlob(bytes, mimeType, `${safeName}.${extension}`);
  const folder = getTrackerImageFolder_();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
}

function getTrackerImageFolder_() {
  const folderId = PropertiesService.getScriptProperties().getProperty(IMAGE_FOLDER_PROPERTY);
  if (folderId) {
    return DriveApp.getFolderById(folderId);
  }

  return DriveApp.getRootFolder();
}

function inferAgeCategory_(row) {
  const fields = [row.breakfast, row.lunch, row.evening, row.dinner];
  for (let index = 0; index < fields.length; index += 1) {
    const ageCategory = extractAgeCategory_(fields[index]);
    if (ageCategory) return ageCategory;
  }

  return isValidAgeCategory_(row.age_category) ? row.age_category : '';
}

function extractAgeCategory_(value) {
  const text = String(value || '');
  const match = text.match(/(6 Bulan|7 Bulan|8 Bulan|9 Bulan|10 Bulan|11 Bulan|12 Bulan Ke Atas)/i);
  if (!match) return '';

  const found = AGE_CATEGORIES.find((ageCategory) => ageCategory.toLowerCase() === match[1].toLowerCase());
  return found || '';
}

function isValidAgeCategory_(value) {
  return AGE_CATEGORIES.some((ageCategory) => ageCategory === String(value || '').trim());
}

function isIsoDate_(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function isDayLabel_(value) {
  return /^Day\s*\d+$/i.test(String(value || '').trim());
}

function looksLikeDataUrl_(value) {
  return /^data:image\//.test(String(value || '').trim());
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
