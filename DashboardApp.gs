// == DashboardApp.gs ==
const SHEET_ID = "1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0";
const DASHBOARD_SHEET_NAME = "MoneyTracking";
const TOKEN_REGISTRY_SHEET = "TokenRegistry";

function doGet(e) {
  Logger.log("DashboardApp.doGet params: " + JSON.stringify(e.parameter));
  // Debug/test endpoint
  if (e.parameter && e.parameter.test === "ping") {
    Logger.log("Ping test received");
    return ContentService.createTextOutput("pong").setMimeType(ContentService.MimeType.TEXT);
  }
  if (e.parameter && e.parameter.test === "debug") {
    return debugInfo(e);
  }
  if (e.parameter && e.parameter.test === "dashboardData" && e.parameter.phone) {
    // Directly check dashboard data for a phone number (bypass token)
    const phone = standardizePhone(e.parameter.phone);
    Logger.log("Dashboard debug: checking dashboard data for phone: " + phone);
    const dashboardData = getDashboardData(phone);
    return ContentService.createTextOutput(JSON.stringify(dashboardData)).setMimeType(ContentService.MimeType.JSON);
  }

  const action = e.parameter && e.parameter.action;
  const callback = e.parameter && e.parameter.callback;

  if (action === "verifyToken") {
    const token = e.parameter.token;
    if (!token) {
      return jsonpResponse({ success: false, message: "Token is required" }, callback);
    }
    const phone = verifyToken(token);
    if (!phone) {
      return jsonpResponse({ success: false, message: "Invalid or expired token" }, callback);
    }
    return jsonpResponse({ success: true, phone: phone }, callback);
  }

  if (action === "checkEligibility") {
    const phone = standardizePhone(e.parameter.phone);
    const eligible = checkEligibility(phone);
    return jsonpResponse({ success: true, eligible: eligible }, callback);
  }

  if (action === "getDashboardData") {
    const phone = standardizePhone(e.parameter.phone);
    const dashboardData = getDashboardData(phone);
    return jsonpResponse(dashboardData, callback);
  }

  // Legacy: fallback to old combined flow for backward compatibility
  const token = e.parameter.token;
  let output;

  if (!token) {
    Logger.log("No token provided");
    output = { success: false, message: "Token is required" };
    return jsonpResponse(output, callback);
  }

  const phone = verifyToken(token);
  Logger.log("verifyToken result: " + phone);
  if (!phone) {
    Logger.log("Invalid or expired token");
    output = { success: false, message: "Invalid or expired token" };
    return jsonpResponse(output, callback);
  }

  // Check eligibility
  const eligible = checkEligibility(phone);
  Logger.log("Eligibility for phone " + phone + ": " + eligible);
  if (!eligible) {
    output = { success: true, eligible: false };
    return jsonpResponse(output, callback);
  }

  // If eligible, return dashboard data
  const dashboardData = getDashboardData(phone);
  dashboardData.eligible = true;
  Logger.log("Dashboard data for phone " + phone + ": " + JSON.stringify(dashboardData));
  return jsonpResponse(dashboardData, callback);
}

// Helper for JSONP response
function jsonpResponse(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Check eligibility from "New login" sheet (Column O, index 14)
function checkEligibility(phone) {
  Logger.log("checkEligibility for phone: " + phone);
  const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
  const sheet = ss.getSheetByName("New login");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowPhone = standardizePhone(data[i][5]);
    // --- DEBUG LOGGING ---
    Logger.log("Row " + (i+1) + ": phone=" + rowPhone + " | eligible=" + data[i][14] + " | typeof=" + typeof data[i][14]);
    if (rowPhone === phone) {
      // Accept both boolean true and string "TRUE"
      const eligibleCell = data[i][14];
      const eligible =
        eligibleCell === true ||
        eligibleCell === "TRUE" ||
        eligibleCell === 1 ||
        eligibleCell === "1";
      Logger.log("Eligibility for phone " + phone + ": " + eligible + " (raw value: " + eligibleCell + ")");
      return eligible;
    }
  }
  Logger.log("Eligibility not found for phone: " + phone);
  return false;
}

function verifyToken(token) {
  Logger.log("verifyToken called with token: " + token);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(TOKEN_REGISTRY_SHEET);
  const data = sheet.getDataRange().getValues();

  const now = new Date();
  for (let i = 1; i < data.length; i++) {
    const savedToken = data[i][0];
    const savedPhone = data[i][1];
    const expiration = new Date(data[i][2]);

    if (savedToken === token) {
      Logger.log("Token match found for phone: " + savedPhone + ", expiration: " + expiration);
      if (expiration > now) {
        return savedPhone;
      } else {
        Logger.log("Token expired, deleting row: " + (i + 1));
        sheet.deleteRow(i + 1); // Clean up expired token
      }
    }
  }
  Logger.log("Token not found or expired");
  return null;
}

function getDashboardData(phone) {
  Logger.log("getDashboardData for phone: " + phone);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(DASHBOARD_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowPhone = standardizePhone(data[i][1]); // Column B
    if (rowPhone === phone) {
      Logger.log("Dashboard row found for phone: " + phone + ", row: " + i);
      const parts = data[i][8].split(" ||| ");
      Logger.log("Dashboard parts: " + JSON.stringify(parts));
      return {
        success: true,
        data: {
          name: parts[0],
          phone: parts[1],
          posterId: parts[2],
          tasksCompleted: parts[3],
          totalEarned: parts[4],
          paid: parts[5],
          balance: parts[6],
          lastTask: parts[7]
        }
      };
    }
  }

  Logger.log("No dashboard record found for phone: " + phone);
  // Return a friendly empty dashboard for eligible users with no data yet
  return {
    success: true,
    data: {
      name: "",
      phone: phone,
      posterId: "",
      tasksCompleted: "0",
      totalEarned: "0",
      paid: "0",
      balance: "0",
      lastTask: ""
    },
    message: "No earnings yet. Complete your first task to see your dashboard."
  };
}

// Debug utility endpoint: ?test=debug
function debugInfo(e) {
  const info = {
    time: new Date().toISOString(),
    params: e.parameter,
    sheetId: SHEET_ID,
    dashboardSheet: DASHBOARD_SHEET_NAME,
    tokenRegistrySheet: TOKEN_REGISTRY_SHEET
  };
  return ContentService.createTextOutput(JSON.stringify(info)).setMimeType(ContentService.MimeType.JSON);
}

// Shared utility functions
function standardizePhone(phone) {
  return (phone || "").toString().replace(/[^0-9]/g, "").slice(-10);
}