// == LoginApp.gs ==
const SHEET_ID = "1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0"; // Same sheet used by both scripts
const LOGIN_SHEET_NAME = "New login";
const TOKEN_REGISTRY_SHEET = "TokenRegistry";

function doGet(e) {
  // Debug: Log incoming parameters
  Logger.log("LoginApp.doGet params: " + JSON.stringify(e.parameter));
  // Debug/test endpoint
  if (e.parameter && e.parameter.test === "ping") {
    Logger.log("Ping test received");
    return ContentService.createTextOutput("pong").setMimeType(ContentService.MimeType.TEXT);
  }
  if (e.parameter && e.parameter.test === "debug") {
    return debugInfo(e);
  }
  const action = e.parameter.action;
  if (action === "login") {
    const phone = e.parameter.phone;
    const password = e.parameter.password;
    return handleLogin(phone, password);
  }
  return ContentService.createTextOutput("Unknown request");
}

function doPost(e) {
  // Debug: Log incoming POST parameters
  Logger.log("LoginApp.doPost params: " + JSON.stringify(e.parameter));
  return doGet(e); // Allow POST too
}

function handleLogin(phone, password) {
  Logger.log("handleLogin called with phone: " + phone);
  const result = checkLogin(phone, password);
  Logger.log("handleLogin result: " + JSON.stringify(result));
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkLogin(phone, password) {
  Logger.log("checkLogin phone: " + phone);
  const queryPhone = standardizePhone(phone);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(LOGIN_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowPhone = standardizePhone(data[i][5]);
    const storedPassword = data[i][18];
    Logger.log("Checking row " + i + ": rowPhone=" + rowPhone + ", storedPassword=" + storedPassword);
    if (rowPhone === queryPhone && secureCompare(storedPassword, password)) {
      // Check eligibility in a separate function (to avoid timeout)
      const eligible = checkEligibility(queryPhone);
      const token = Utilities.getUuid();
      saveTokenToRegistry(token, queryPhone);
      Logger.log("Login success for phone: " + queryPhone + ", eligible: " + eligible + ", token: " + token);
      return {
        success: true,
        user: {
          name: data[i][2],
          phone: queryPhone,
          token: token,
          eligible: eligible,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  Logger.log("Login failed for phone: " + queryPhone);
  return { success: false, message: "Invalid credentials" };
}

// Check eligibility (Column O, index 14)
function checkEligibility(phone) {
  Logger.log("checkEligibility for phone: " + phone);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(LOGIN_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowPhone = standardizePhone(data[i][5]);
    if (rowPhone === phone) {
      Logger.log("Eligibility for phone " + phone + ": " + !!data[i][14]);
      return !!data[i][14]; // true if ticked/checked
    }
  }
  Logger.log("Eligibility not found for phone: " + phone);
  return false;
}

function saveTokenToRegistry(token, phone) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(TOKEN_REGISTRY_SHEET);
  if (!sheet) sheet = ss.insertSheet(TOKEN_REGISTRY_SHEET);

  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 10); // 10-minute expiry

  sheet.appendRow([token, phone, expiration.toISOString()]);
}

// Debug utility endpoint: ?test=debug
function debugInfo(e) {
  const info = {
    time: new Date().toISOString(),
    params: e.parameter,
    sheetId: SHEET_ID,
    loginSheet: LOGIN_SHEET_NAME,
    tokenRegistrySheet: TOKEN_REGISTRY_SHEET
  };
  return ContentService.createTextOutput(JSON.stringify(info)).setMimeType(ContentService.MimeType.JSON);
}

// Utility functions
function standardizePhone(phone) {
  return (phone || "").toString().replace(/[^0-9]/g, "").slice(-10);
}
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}