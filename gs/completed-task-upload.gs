/**
 * Google Apps Script for uploading completed task screenshots
 * This script handles:
 * 1. Showing available Ad IDs to users
 * 2. Checking if screenshot already exists for Ad ID + phone combination
 * 3. Uploading screenshot to Google Drive if not already uploaded
 * 4. Updating Task Assigner sheet with screenshot link
 */

const SCREENSHOT_FOLDER_ID = "1lymA7F9kub_TWggqHk9duICO2OPNUb2V";
const SPREADSHEET_ID = "1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0";
const TASK_ASSIGNER_SHEET_NAME = "Task Assigner";

// Utility functions
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
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(blob.getContentType())) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, or WEBP images are allowed.');
  }
  
  // Check file size (10MB limit)
  if (blob.getBytes().length > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 10MB.');
  }
  
  return blob;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// CORS preflight handler
function doOptions(e) {
  return ContentService.createTextOutput(JSON.stringify({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get available Ad IDs for a user's completed tasks
 * @param {string} phone - User's phone number
 * @return {Array} Array of available Ad IDs
 */
function getAvailableAdIds(phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  const standardizedPhone = standardizePhoneNumber(phone);
  const availableAdIds = [];
  
  // Column indexes: A=Ad ID (0), C=phone (2), I=screenshot link (8)
  for (let i = 1; i < data.length; i++) { // Skip header row
    const rowAdId = data[i][0]; // Column A
    const rowPhone = standardizePhoneNumber(data[i][2]); // Column C
    
    // Check if this is the user's task and they haven't uploaded a screenshot yet
    if (rowPhone === standardizedPhone && rowAdId) {
      availableAdIds.push({
        adId: rowAdId,
        hasScreenshot: !!data[i][8] // Column I - screenshot link
      });
    }
  }
  
  return availableAdIds;
}

/**
 * Check if screenshot already exists for Ad ID + phone combination
 * @param {string} adId - The Ad ID
 * @param {string} phone - User's phone number
 * @return {boolean} True if screenshot already exists
 */
function hasExistingScreenshot(adId, phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  const standardizedPhone = standardizePhoneNumber(phone);
  
  // Column indexes: A=Ad ID (0), C=phone (2), I=screenshot link (8)
  for (let i = 1; i < data.length; i++) { // Skip header row
    const rowAdId = data[i][0]; // Column A
    const rowPhone = standardizePhoneNumber(data[i][2]); // Column C
    const screenshotLink = data[i][8]; // Column I
    
    if (rowAdId === adId && rowPhone === standardizedPhone && screenshotLink) {
      return true;
    }
  }
  
  return false;
}

/**
 * Update screenshot link in Task Assigner sheet
 * @param {string} adId - The Ad ID
 * @param {string} phone - User's phone number
 * @param {string} fileUrl - The uploaded file URL
 * @return {boolean} True if update was successful
 */
function updateTaskScreenshotLink(adId, phone, fileUrl) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  const standardizedPhone = standardizePhoneNumber(phone);
  
  // Column indexes: A=Ad ID (0), C=phone (2), I=screenshot link (8)
  for (let i = 1; i < data.length; i++) { // Skip header row
    const rowAdId = data[i][0]; // Column A
    const rowPhone = standardizePhoneNumber(data[i][2]); // Column C
    
    if (rowAdId === adId && rowPhone === standardizedPhone) {
      // Update Column I (index 8) with the screenshot link
      sheet.getRange(i + 1, 9).setValue(fileUrl); // Column I = 9 (1-indexed)
      console.log(`Updated screenshot link for Ad ID: ${adId}, Phone: ${phone}, Row: ${i + 1}`);
      return true;
    }
  }
  
  console.error(`Ad ID ${adId} with phone ${phone} not found in Task Assigner sheet`);
  return false;
}

/**
 * Main GET handler - returns available Ad IDs for a user or handles JSONP uploads
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const phone = e.parameter.phone;
    const callback = e.parameter.callback;
    
    // Handle JSONP upload requests
    if (callback && phone && e.parameter.adId && e.parameter.base64Data) {
      // This is a JSONP upload request
      const uploadResult = handleUploadRequest(e.parameter);
      const responseText = `${callback}(${JSON.stringify(uploadResult)});`;
      
      return ContentService.createTextOutput(responseText)
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeader("Access-Control-Allow-Origin", "*");
    }
    
    if (!phone) {
      const response = {
        success: false,
        message: "Phone number is required"
      };
      
      if (callback) {
        return ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return createJsonResponse(response);
    }
    
    if (action === 'getAvailableAdIds') {
      const availableAdIds = getAvailableAdIds(phone);
      const response = {
        success: true,
        availableAdIds: availableAdIds,
        phone: phone
      };
      
      if (callback) {
        return ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return createJsonResponse(response);
    }
    
    // Default response
    const response = {
      success: true,
      message: "Completed task screenshot upload endpoint is active",
      availableActions: ["getAvailableAdIds"]
    };
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return createJsonResponse(response);
    
  } catch (error) {
    console.error("Error in doGet:", error.message);
    const response = {
      success: false,
      message: error.message || 'Failed to process request'
    };
    
    const callback = e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return createJsonResponse(response);
  }
}

/**
 * Handle upload request from either GET (JSONP) or POST
 * @param {Object} requestData - The request parameters
 * @return {Object} Upload result
 */
function handleUploadRequest(requestData) {
  try {
    console.log("Processing upload request:", JSON.stringify(requestData));
    
    // Get required parameters
    const phone = standardizePhoneNumber(requestData.phone);
    const adId = requestData.adId;
    const base64Data = requestData.base64Data;
    const contentType = requestData.contentType || 'image/jpeg';
    
    // Validate required fields
    if (!phone) {
      return {
        success: false,
        message: "Phone number is required"
      };
    }
    
    if (!adId) {
      return {
        success: false,
        message: "Ad ID is required"
      };
    }
    
    if (!base64Data) {
      return {
        success: false,
        message: "Screenshot file is required"
      };
    }
    
    // Check if screenshot already exists
    if (hasExistingScreenshot(adId, phone)) {
      return {
        success: false,
        message: "You have already uploaded a screenshot for this task",
        alreadyUploaded: true
      };
    }
    
    // Create and validate file blob
    const rawBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
    const fileBlob = validateUploadFile(rawBlob);
    
    // Upload to Google Drive
    const folder = DriveApp.getFolderById(SCREENSHOT_FOLDER_ID);
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    const fileName = `completed_task_${adId}_${phone}_${timestamp}.${getFileExtensionFromBlob(fileBlob)}`;
    
    const file = folder.createFile(fileBlob);
    file.setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();
    
    console.log("Screenshot uploaded successfully:", fileUrl);
    
    // Update Task Assigner sheet
    const sheetUpdated = updateTaskScreenshotLink(adId, phone, fileUrl);
    
    if (sheetUpdated) {
      return {
        success: true,
        message: "Screenshot uploaded successfully!",
        fileUrl: fileUrl,
        adId: adId,
        phone: phone,
        fileName: fileName
      };
    } else {
      // File was uploaded but sheet update failed
      return {
        success: false,
        message: "Screenshot was uploaded but failed to update task record. Please contact support.",
        fileUrl: fileUrl
      };
    }
    
  } catch (error) {
    console.error("Error during upload:", error.message);
    return {
      success: false,
      message: error.message || 'Upload failed'
    };
  }
}

/**
 * Main POST handler - handles screenshot uploads
 */
function doPost(e) {
  try {
    const uploadResult = handleUploadRequest(e.parameter || {});
    return createJsonResponse(uploadResult);
  } catch (error) {
    console.error("Error in doPost:", error.message);
    return createJsonResponse({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
}
