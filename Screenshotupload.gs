const SCREENSHOT_FOLDER_ID = "1lymA7F9kub_TWggqHk9duICO2OPNUb2V"; // New folder ID 
const SPREADSHEET_ID = "1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0";
const LOGIN_SHEET_NAME = "New login";

// Utility functions
function standardizePhone(phone) {
  return (phone || "").toString().replace(/[^0-9]/g, "").slice(-10);
}

function getFileExtension(blob) {
  const mimeType = blob.getContentType();
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif'
  };
  return extensions[mimeType] || 'jpg';
}

function validateFile(blob) {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(blob.getContentType())) {
    throw new Error('Invalid file type. Only JPG, PNG or GIF allowed.');
  }
  
  // Check file size (5MB limit)
  if (blob.getBytes().length > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  
  return blob;
}

function updateScreenshotLink(phone, fileUrl) {
  console.log("Updating screenshot link for phone:", phone);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LOGIN_SHEET_NAME);
  
  // Get all data
  const data = sheet.getDataRange().getValues();
  
  // Find row with matching phone (Column F = index 5)
  for (let i = 1; i < data.length; i++) {
    const rowPhone = standardizePhone(data[i][5]); // Column F (index 5)
    if (rowPhone === phone) {
      // Found matching phone, update Column T (index 19)
      sheet.getRange(i + 1, 20).setValue(fileUrl); // Column T = 20
      console.log("Updated screenshot link for phone:", phone, "in row:", i + 1);
      return true;
    }
  }
  
  console.error("Phone number not found in sheet:", phone);
  return false;
}

// Helper function for JSON responses
function jsonResponse(obj) {
  return ContentService.createTextOutput(
    JSON.stringify(obj)
  )
  .setMimeType(ContentService.MimeType.JSON)
  .setHeader("Access-Control-Allow-Origin", "*")
  .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Add OPTIONS handler for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput(JSON.stringify({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web app endpoint that handles multiple types of requests
 * - POST: Upload screenshot (supports both form data and JSON)
 * - GET with action=checkUpload: Check upload status via JSONP
 * - GET with action=updateScreenshotLink: Update spreadsheet with file URL
 */
function doPost(e) {
  try {
    console.log("Incoming POST request:", JSON.stringify(e)); // Log full request object

    const requestData = e.parameter || {};
    
    // Get phone number
    const phone = standardizePhone(requestData.phone);
    if (!phone) {
      console.error("Phone number is missing or invalid.");
      return jsonResponse({ 
        success: false, 
        message: "Phone number is required" 
      });
    }

    // Get file data
    const base64Data = requestData.base64Data;
    const contentType = requestData.contentType || 'image/jpeg';
    
    if (!base64Data) {
      console.error("Base64 file data is missing.");
      return jsonResponse({ 
        success: false, 
        message: "File data is required" 
      });
    }

    // Create and validate blob
    const rawBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
    const fileBlob = validateFile(rawBlob);
    
    // Process upload
    const folder = DriveApp.getFolderById(SCREENSHOT_FOLDER_ID);
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    const finalFileName = `${phone}_${timestamp}.${getFileExtension(fileBlob)}`;
    
    const file = folder.createFile(fileBlob);
    file.setName(finalFileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();

    console.log("File uploaded successfully:", fileUrl);

    // Update sheet
    const updated = updateScreenshotLink(phone, fileUrl);
    console.log("Spreadsheet updated:", updated);

    return jsonResponse({
      success: true,
      fileUrl: fileUrl,
      phone: phone,
      sheetUpdated: updated
    });

  } catch (err) {
    console.error("Error during file upload:", err.message);
    return jsonResponse({
      success: false,
      message: err.message || 'Upload failed'
    });
  }
}

// New helper for consistent JSON responses
function sendJsonResponse(obj) {
  return HtmlService.createHtmlOutput(`
    <script>
      parent.postMessage(${JSON.stringify(obj)}, '*');
    </script>
  `).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Add doGet handler
function doGet(e) {
  const callback = e.parameter && e.parameter.callback;
  const successRedirect = e.parameter && e.parameter.success_redirect;
  
  if (successRedirect) {
    return HtmlService.createHtmlOutput(`
      <script>
        window.location.href = "${successRedirect}";
      </script>
    `);
  }
  
  // Default response
  const response = {
    success: true,
    message: "Screenshot upload endpoint is live"
  };
  
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return jsonResponse(response);
}