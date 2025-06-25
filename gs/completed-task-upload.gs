const SCREENSHOT_FOLDER_ID = "1lymA7F9kub_TWggqHk9duICO2OPNUb2V";
const SPREADSHEET_ID = "1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0";
const TASK_ASSIGNER_SHEET_NAME = "Task Assigner";

// === Utility ===

function standardizePhoneNumber(phone) {
  return (phone || "").toString().replace(/[^0-9]/g, "").slice(-10);
}

function getFileExtensionFromBlob(blob) {
  const mimeType = blob.getContentType();
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return extensions[mimeType] || 'jpg';
}

function validateUploadFile(blob) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(blob.getContentType())) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, or WEBP images are allowed.');
  }
  if (blob.getBytes().length > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
  return blob;
}

function withCorsHeaders(output) {
  return output
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// === CORS preflight ===

function doOptions() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// === Spreadsheet / Upload Logic ===

function getAvailableAdIds(phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const standardizedPhone = standardizePhoneNumber(phone);
  const availableAdIds = [];

  for (let i = 1; i < data.length; i++) {
    const rowAdId = data[i][0];
    const rowPhone = standardizePhoneNumber(data[i][2]);
    if (rowPhone === standardizedPhone && rowAdId) {
      availableAdIds.push({
        adId: rowAdId,
        hasScreenshot: !!data[i][8]
      });
    }
  }
  return availableAdIds;
}

function hasExistingScreenshot(adId, phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const standardizedPhone = standardizePhoneNumber(phone);

  for (let i = 1; i < data.length; i++) {
    const rowAdId = data[i][0];
    const rowPhone = standardizePhoneNumber(data[i][2]);
    const screenshotLink = data[i][8];
    if (rowAdId === adId && rowPhone === standardizedPhone && screenshotLink) {
      return true;
    }
  }
  return false;
}

function updateTaskScreenshotLink(adId, phone, fileUrl) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const standardizedPhone = standardizePhoneNumber(phone);

  for (let i = 1; i < data.length; i++) {
    const rowAdId = data[i][0];
    const rowPhone = standardizePhoneNumber(data[i][2]);
    if (rowAdId === adId && rowPhone === standardizedPhone) {
      sheet.getRange(i + 1, 9).setValue(fileUrl);
      return true;
    }
  }
  return false;
}

function handleUploadRequest(requestData) {
  try {
    const phone = standardizePhoneNumber(requestData.phone);
    const adId = requestData.adId;
    const base64Data = requestData.base64Data;
    const contentType = requestData.contentType || 'image/jpeg';

    if (!phone || !adId || !base64Data) {
      return { success: false, message: "Missing phone, adId, or file data" };
    }

    if (hasExistingScreenshot(adId, phone)) {
      return {
        success: false,
        message: "You have already uploaded a screenshot for this task",
        alreadyUploaded: true
      };
    }

    const rawBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
    const fileBlob = validateUploadFile(rawBlob);
    const folder = DriveApp.getFolderById(SCREENSHOT_FOLDER_ID);
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    const fileName = `completed_task_${adId}_${phone}_${timestamp}.${getFileExtensionFromBlob(fileBlob)}`;
    const file = folder.createFile(fileBlob);
    file.setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();
    const updated = updateTaskScreenshotLink(adId, phone, fileUrl);

    return {
      success: true,
      message: "Screenshot uploaded successfully!",
      fileUrl,
      adId,
      phone,
      fileName,
      sheetUpdated: updated
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || 'Upload failed'
    };
  }
}

// === doGet ===

function doGet(e) {
  try {
    const action = e.parameter.action;
    const phone = e.parameter.phone;
    const callback = e.parameter.callback;

    // JSONP upload fallback
    if (callback && phone && e.parameter.adId && e.parameter.base64Data) {
      const uploadResult = handleUploadRequest(e.parameter);
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(uploadResult)});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    if (!phone) {
      const response = { success: false, message: "Phone number is required" };
      return callback
        ? ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`).setMimeType(ContentService.MimeType.JAVASCRIPT)
        : jsonResponse(response);
    }

    if (action === 'getAvailableAdIds') {
      const availableAdIds = getAvailableAdIds(phone);
      const response = { success: true, availableAdIds, phone };
      return callback
        ? ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`).setMimeType(ContentService.MimeType.JAVASCRIPT)
        : jsonResponse(response);
    }

    const defaultResponse = {
      success: true,
      message: "Completed task screenshot upload endpoint is active",
      availableActions: ["getAvailableAdIds"]
    };

    return callback
      ? ContentService.createTextOutput(`${callback}(${JSON.stringify(defaultResponse)});`).setMimeType(ContentService.MimeType.JAVASCRIPT)
      : jsonResponse(defaultResponse);

  } catch (error) {
    const errResp = { success: false, message: error.message || 'Failed to process request' };
    const callback = e.parameter && e.parameter.callback;
    return callback
      ? ContentService.createTextOutput(`${callback}(${JSON.stringify(errResp)});`).setMimeType(ContentService.MimeType.JAVASCRIPT)
      : jsonResponse(errResp);
  }
}

// === doPost ===

function doPost(e) {
  try {
    const requestData = e.parameter || {};
    const phone = standardizePhoneNumber(requestData.phone);
    const adId = requestData.adId;
    const base64Data = requestData.base64Data;
    const contentType = requestData.contentType || 'image/jpeg';

    if (!phone || !adId || !base64Data) {
      return jsonResponse({ success: false, message: "Missing phone, adId, or file data" });
    }

    if (hasExistingScreenshot(adId, phone)) {
      return jsonResponse({
        success: false,
        message: "You have already uploaded a screenshot for this task",
        alreadyUploaded: true
      });
    }

    const rawBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
    const fileBlob = validateUploadFile(rawBlob);
    const folder = DriveApp.getFolderById(SCREENSHOT_FOLDER_ID);
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    const finalFileName = `completed_task_${adId}_${phone}_${timestamp}.${getFileExtensionFromBlob(fileBlob)}`;
    const file = folder.createFile(fileBlob);
    file.setName(finalFileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();
    const updated = updateTaskScreenshotLink(adId, phone, fileUrl);

    return jsonResponse({
      success: true,
      message: "Screenshot uploaded successfully!",
      fileUrl,
      adId,
      phone,
      fileName: finalFileName,
      sheetUpdated: updated
    });

  } catch (err) {
    return jsonResponse({
      success: false,
      message: err.message || 'Upload failed'
    });
  }
}
