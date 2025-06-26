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
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return extensions[mimeType] || 'jpg';
}

function validateUploadFile(blob) {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(blob.getContentType())) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, or WEBP images are allowed.');
  }
  
  // Check file size (5MB limit)
  if (blob.getBytes().length > 5 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  
  return blob;
}

function getAvailableAdIds(phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const standardizedPhone = standardizePhoneNumber(phone);
  
  const availableAdIds = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowPhone = standardizePhoneNumber(data[i][2]); // Column C (phone)
    const rowAdId = data[i][0]; // Column A (adId)
    const screenshotLink = data[i][8]; // Column I (screenshot link)
    
    // If phone matches and no screenshot uploaded yet
    if (rowPhone === standardizedPhone && rowAdId && !screenshotLink) {
      availableAdIds.push(rowAdId);
    }
  }
  
  return availableAdIds;
}

function getFileIdFromUrl(url) {
  const idMatch = url.match(/[-\w]{25,}/);
  return idMatch ? idMatch[0] : null;
}

function sendJsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  return output;
}

// === CORS preflight ===

function doOptions(e) {
  return ContentService.createTextOutput(JSON.stringify({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "access-control-max-age": "86400"
  })).setMimeType(ContentService.MimeType.JSON);
}

// === Spreadsheet / Upload Logic ===

function hasExistingScreenshot(adId, phone) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const standardizedPhone = standardizePhoneNumber(phone);

  for (let i = 1; i < data.length; i++) {
    const rowAdId = data[i][0];
    const rowPhone = standardizePhoneNumber(data[i][2]);
    const screenshotLink = data[i][8]; // Column I (screenshot link)
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
      const row = i + 1;
      
      // Get existing formula or value in column I (9)
      const existingCell = sheet.getRange(row, 9).getFormula() || sheet.getRange(row, 9).getValue();

      // Extract old URLs from existing cell
      const oldUrls = [];
      if (existingCell) {
        const urlRegex = /https:\/\/drive\.google\.com\/uc\?id=[-\w]{25,}/g;
        let match;
        while ((match = urlRegex.exec(existingCell)) !== null) {
          oldUrls.push(match[0]);
        }
      }

      // Remove duplicates and limit to 4 old URLs
      const uniqueOldUrls = [...new Set(oldUrls)].slice(0, 4);

      // Get new file ID
      const newFileId = getFileIdFromUrl(fileUrl);
      if (!newFileId) {
        Logger.log('Could not extract file ID from URL: ' + fileUrl);
        return false;
      }

      // Build formula components
      const imageFormula = `HYPERLINK("https://drive.google.com/uc?id=${newFileId}", IMAGE("https://drive.google.com/uc?id=${newFileId}", 4, 50, 50))`;
      
      let formula;
      if (uniqueOldUrls.length > 0) {
        // Build old links formulas (HYPERLINK("url","Link x"))
        const oldLinksFormulas = uniqueOldUrls.map((url, idx) => {
          return `HYPERLINK("${url}", "Link ${idx + 1}")`;
        }).join(' & CHAR(10) & ');
        
        // Combine image with old links
        formula = `=${imageFormula} & CHAR(10) & ${oldLinksFormulas}`;
      } else {
        // Just the image
        formula = `=${imageFormula}`;
      }

      // Set the formula in the cell
      sheet.getRange(row, 9).setFormula(formula);
      return true;
    }
  }
  return false;
}

function cleanupOldFiles(folder) {
  try {
    Logger.log('cleanupOldFiles: folder id = ' + (folder ? folder.getId() : 'null or undefined'));
    if (!folder) {
      Logger.log("cleanupOldFiles: folder is undefined or null");
      return;
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(TASK_ASSIGNER_SHEET_NAME);
    const files = folder.getFiles();
    const sheetLinksRange = sheet.getRange('I2:I' + sheet.getLastRow()).getValues();

    const validUrls = new Set();
    sheetLinksRange.forEach(row => {
      const cell = row[0];
      if (cell) {
        const lines = cell.toString().split(/\n/);
        lines.forEach(line => {
          const match = line.match(/https?:\/\/drive\.google\.com\/uc\?id=[-\w]{25,}/);
          if (match && match[0]) validUrls.add(match[0]);
        });
      }
    });

    const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;
    const now = new Date();

    while (files.hasNext()) {
      const file = files.next();
      const url = file.getUrl();
      const created = file.getDateCreated();

      if (!validUrls.has(url) || (now - created) > THREE_WEEKS_MS) {
        file.setTrashed(true);
        Logger.log(`Deleted file: ${file.getName()} - URL: ${url}`);
      }
    }
  } catch (error) {
    Logger.log('Error in cleanupOldFiles: ' + error.message);
  }
}

// === doGet ===

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
    message: "Completed task screenshot upload endpoint is live"
  };
  
  if (callback) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(response)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  return sendJsonResponse(response);
}

// === doPost ===

function doPost(e) {
  try {
    console.log("Incoming POST request:", JSON.stringify(e)); // Log full request object

    const requestData = e.parameter || {};
    
    // Get phone number
    const phone = standardizePhoneNumber(requestData.phone);
    if (!phone) {
      console.error("Phone number is missing or invalid.");
      return sendJsonResponse({ 
        success: false, 
        message: "Phone number is required" 
      });
    }

    // Get adId (required for completed tasks)
    const adId = requestData.adId;
    if (!adId) {
      console.error("Ad ID is missing.");
      return sendJsonResponse({ 
        success: false, 
        message: "Ad ID is required" 
      });
    }

    // Get file data
    const base64Data = requestData.base64Data;
    const contentType = requestData.contentType || 'image/jpeg';
    
    if (!base64Data) {
      console.error("Base64 file data is missing.");
      return sendJsonResponse({ 
        success: false, 
        message: "File data is required" 
      });
    }

    // Check if screenshot already exists
    if (hasExistingScreenshot(adId, phone)) {
      return sendJsonResponse({
        success: false,
        message: "You have already uploaded a screenshot for this task",
        alreadyUploaded: true
      });
    }

    // Create and validate blob
    const rawBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
    const fileBlob = validateUploadFile(rawBlob);
    
    // Process upload
    const folder = DriveApp.getFolderById(SCREENSHOT_FOLDER_ID);
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd_HHmmss");
    const finalFileName = `completed_task_${adId}_${phone}_${timestamp}.${getFileExtensionFromBlob(fileBlob)}`;
    
    const file = folder.createFile(fileBlob);
    file.setName(finalFileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileUrl = file.getUrl();

    console.log("File uploaded successfully:", fileUrl);

    // Update sheet
    const updated = updateTaskScreenshotLink(adId, phone, fileUrl);
    console.log("Spreadsheet updated:", updated);

    if (!updated) {
      // If update failed, delete the uploaded file
      file.setTrashed(true);
      return sendJsonResponse({ 
        success: false, 
        message: "Task not found or phone number doesn't match" 
      });
    }

    // Cleanup old files
    cleanupOldFiles(folder);

    return sendJsonResponse({
      success: true,
      message: "Screenshot uploaded successfully!",
      fileUrl: fileUrl,
      adId: adId,
      phone: phone,
      fileName: finalFileName,
      sheetUpdated: updated
    });

  } catch (err) {
    console.error("Error during file upload:", err.message);
    return sendJsonResponse({
      success: false,
      message: err.message || 'Upload failed'
    });
  }
}
