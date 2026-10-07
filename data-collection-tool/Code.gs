const SPREADSHEET_ID = "12H6IXz7A0hCjbq8oHLq4Bo_txZBYskm7Z6qycIikpCQ";
const SHEET_NAME = "Sheet1";
const EXPECTED_HEADERS = [
  "Record ID",
  "Full Name",
  "Phone Number",
  "Date of Birth",
  "Ghana Card",
  "Location",
  "Date Registered"
];

function doGet() {
  try {
    getRegistrationSheet();
    return jsonResponse({ success: true, message: "Sheet connection is ready." });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, message: "Sheet connection is unavailable. Contact the registration administrator." });
  }
}

function setupRegistrationSheet() {
  const sheet = getRegistrationSheet();
  console.log(`Connected to ${sheet.getParent().getName()} / ${sheet.getName()}.`);
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No request body received.");
    }

    const data = JSON.parse(e.postData.contents);
    const fullName = clean(data.fullName);
    const phone = normalizePhone(data.phone);
    const dateOfBirth = clean(data.dateOfBirth);
    const ghanaCard = normalizeGhanaCard(data.ghanaCard);
    const location = clean(data.location);
    const consent = data.consent === true;

    validateSubmission({ fullName, phone, dateOfBirth, ghanaCard, location, consent });
    const sheet = getRegistrationSheet();

    if (isDuplicate(sheet, phone, ghanaCard)) {
      return jsonResponse({
        success: false,
        code: "DUPLICATE",
        message: "A record with this phone number or Ghana Card already exists."
      });
    }

    const recordId = generateRecordId();

    sheet.appendRow([
      recordId,
      fullName,
      phone,
      dateOfBirth,
      ghanaCard,
      location,
      new Date()
    ]);

    return jsonResponse({
      success: true,
      message: "Registration submitted successfully.",
      recordId: recordId
    });

  } catch (error) {
    console.error(error);
    return jsonResponse({
      success: false,
      message: error.message || "An unexpected error occurred."
    });
  } finally {
    try { lock.releaseLock(); } catch (error) {}
  }
}

function getRegistrationSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
    sheet.setFrozenRows(1);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).getDisplayValues()[0];
  const headersMatch = EXPECTED_HEADERS.every((header, index) => currentHeaders[index] === header);

  if (!headersMatch) {
    throw new Error(`The '${SHEET_NAME}' sheet headers do not match the required structure.`);
  }

  return sheet;
}

function validateSubmission(data) {
  if (!data.fullName || !data.phone || !data.dateOfBirth || !data.ghanaCard || !data.location) {
    throw new Error("All required fields must be completed.");
  }

  if (!data.consent) {
    throw new Error("Consent is required.");
  }

  if (data.fullName.length < 2 || data.fullName.length > 120) {
    throw new Error("Full name is invalid.");
  }

  if (!/^\+233\d{9}$/.test(data.phone)) {
    throw new Error("Phone number is invalid.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
    throw new Error("Date of birth is invalid.");
  }

  const dob = new Date(`${data.dateOfBirth}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(dob.getTime()) || dob >= today) {
    throw new Error("Date of birth must be a valid past date.");
  }

  if (!/^GHA-\d{9}-\d$/.test(data.ghanaCard)) {
    throw new Error("Ghana Card must use the format GHA-XXXXXXXXX-X.");
  }

  if (data.location.length < 2 || data.location.length > 120) {
    throw new Error("Location is invalid.");
  }
}

function isDuplicate(sheet, phone, ghanaCard) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const rows = sheet.getRange(2, 3, lastRow - 1, 3).getDisplayValues();
  return rows.some(row => {
    const existingPhone = normalizePhone(row[0]);
    const existingCard = normalizeGhanaCard(row[2]);
    return existingPhone === phone || existingCard === ghanaCard;
  });
}

function normalizePhone(value) {
  let phone = clean(value).replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(phone)) return "+233" + phone.substring(1);
  if (/^233\d{9}$/.test(phone)) return "+" + phone;
  return phone;
}

function normalizeGhanaCard(value) {
  return clean(value).toUpperCase().replace(/\s+/g, "");
}

function clean(value) {
  return String(value == null ? "" : value).trim();
}

function generateRecordId() {
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMddHHmmss"
  );
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `REG-${timestamp}-${randomPart}`;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
