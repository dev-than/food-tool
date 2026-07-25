/**
 * Recipe tracker — Google Sheets backend
 *
 * SETUP
 * 1. Open your Sheet → Extensions → Apps Script. Paste this in, replacing Code.gs.
 * 2. Change SECRET below to any random string.
 * 3. Make sure the tab is named "Recipes" (or change SHEET_NAME).
 * 4. Row 1 must be these headers, in this order:
 *      ID | Recipe Name | Scheduled For | Image URL | Night Before Task |
 *      Original Recipe | Cook Time (Minutes) | Ingredients | Instructions
 * 5. Deploy → New deployment → type "Web app"
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the /exec URL into index.html.
 *
 * NOTE: re-deploy (Deploy → Manage deployments → edit → Version: New version)
 * every time you change this file, or the old code keeps running.
 */

const SECRET = '54321';
const SHEET_NAME = 'Recipes';

const COLUMNS = [
  'ID',
  'Recipe Name',
  'Scheduled For',
  'Image URL',
  'Night Before Task',
  'Original Recipe',
  'Cook Time (Minutes)',
  'Ingredients',
  'Instructions',
];

function sheet_() {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!s) throw new Error('No tab named "' + SHEET_NAME + '"');
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Sheet cells can come back as Date objects. Normalise to YYYY-MM-DD. */
function cell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return value === null || value === undefined ? '' : String(value);
}

function readAll_() {
  const rows = sheet_().getDataRange().getValues();
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue; // skip rows with no ID
    const r = {};
    COLUMNS.forEach(function (name, c) {
      r[name] = cell_(rows[i][c]);
    });
    out.push(r);
  }
  return out;
}

function rowForId_(id) {
  const ids = sheet_().getDataRange().getValues().map(function (r) {
    return String(r[0]);
  });
  const idx = ids.indexOf(String(id));
  return idx === -1 ? -1 : idx + 1; // 1-based sheet row
}

function toRow_(recipe) {
  return COLUMNS.map(function (name) {
    return recipe[name] === undefined ? '' : recipe[name];
  });
}

function doGet() {
  try {
    return json_({ ok: true, recipes: readAll_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    // Sent as text/plain to dodge the CORS preflight Apps Script can't answer.
    const body = JSON.parse(e.postData.contents);

    if (body.secret !== SECRET) {
      return json_({ ok: false, error: 'Bad secret' });
    }

    const s = sheet_();

    if (body.action === 'create') {
      const recipe = body.recipe;
      recipe['ID'] = 'r' + Date.now();
      s.appendRow(toRow_(recipe));
      return json_({ ok: true, recipes: readAll_() });
    }

    if (body.action === 'update') {
      const row = rowForId_(body.recipe['ID']);
      if (row === -1) return json_({ ok: false, error: 'Recipe not found' });
      s.getRange(row, 1, 1, COLUMNS.length).setValues([toRow_(body.recipe)]);
      return json_({ ok: true, recipes: readAll_() });
    }

    if (body.action === 'delete') {
      const row = rowForId_(body.id);
      if (row === -1) return json_({ ok: false, error: 'Recipe not found' });
      s.deleteRow(row);
      return json_({ ok: true, recipes: readAll_() });
    }

    return json_({ ok: false, error: 'Unknown action: ' + body.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Run once from the editor to write the header row into an empty sheet. */
function setUpHeaders() {
  const s = sheet_();
  s.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  s.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
  s.setFrozenRows(1);
  // Keep dates as plain text so they round-trip cleanly.
  s.getRange(2, 2, s.getMaxRows() - 1, 1).setNumberFormat('@');
}
