const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Leads';

const HEADERS = [
  'Created At',
  'Name',
  'Phone',
  'Address',
  'Pincode',
  'Bundle',
  'Bundle Label',
  'WhatsApp Opt-in',
  'Page URL',
  'Referrer',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Term',
  'UTM Content',
  'User Agent'
];

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validateLead_(payload);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getLeadSheet_();
      sheet.appendRow([
        new Date(),
        clean_(payload.name),
        clean_(payload.phone),
        clean_(payload.address),
        clean_(payload.pincode),
        clean_(payload.bundle),
        clean_(payload.bundleLabel),
        payload.waOptin === 'true' || payload.waOptin === true ? 'Yes' : 'No',
        clean_(payload.pageUrl),
        clean_(payload.referrer),
        clean_(payload.utmSource),
        clean_(payload.utmMedium),
        clean_(payload.utmCampaign),
        clean_(payload.utmTerm),
        clean_(payload.utmContent),
        clean_(payload.userAgent)
      ]);
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doGet() {
  return json_({ ok: true, message: 'O-No-Stop lead capture endpoint is live.' });
}

function setupLeadSheet() {
  getLeadSheet_();
}

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = firstRow.some(Boolean);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function parsePayload_(e) {
  if (!e || !e.postData) return {};

  const type = e.postData.type || '';
  if (type.includes('application/json')) {
    return JSON.parse(e.postData.contents || '{}');
  }

  return e.parameter || {};
}

function validateLead_(payload) {
  if (!payload.name || String(payload.name).trim().length < 2) {
    throw new Error('Name is required.');
  }
  if (!/^[6-9]\d{9}$/.test(String(payload.phone || ''))) {
    throw new Error('Valid 10 digit phone number is required.');
  }
  if (!payload.address || String(payload.address).trim().length < 6) {
    throw new Error('Address is required.');
  }
  if (!/^\d{6}$/.test(String(payload.pincode || ''))) {
    throw new Error('Valid 6 digit pincode is required.');
  }
}

function clean_(value) {
  return String(value || '').trim();
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
