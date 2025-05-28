function doPost(e) {
  try {
    // Step 1: Get the folder where uploaded screenshots will be stored in Google Drive
    const folderId = "1lymA7F9kub_TWggqHk9duICO2OPNUb2V"; // Ensure this is correct
    const folder = DriveApp.getFolderById(folderId);
    if (!folder) throw new Error("Target folder not found in Drive");

    // Step 2: Extract parameters from POST request
    const blobData = e.parameter.file || e.parameters.file;
    const phone = e.parameter.phone || e.parameters.phone;

    // Step 3: Validate required inputs
    if (!blobData || !phone) {
      return jsonOutput({ success: false, message: "Missing required data (file or phone)" });
    }

    // Step 4: Decode base64 image
    let decodedBlob;
    try {
      decodedBlob = Utilities.base64Decode(blobData);
    } catch (decodeErr) {
      throw new Error("Failed to decode base64 image: " + decodeErr.message);
    }

    // Step 5: Create file in Drive
    const fileName = `screenshot_${Utilities.getUuid()}.png`; // Unique name to avoid overwriting
    const file = folder.createFile(Utilities.newBlob(decodedBlob, "image/png", fileName));

    // Step 6: Open the target spreadsheet by URL
    const spreadsheetUrl = "https://docs.google.com/spreadsheets/d/1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0/edit";
    const ss = SpreadsheetApp.openByUrl(spreadsheetUrl);

    const sheetName = "New login";
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

    // Step 7: Get all data and find matching row by phone number (assumed in Column F)
    const data = sheet.getDataRange().getValues();
    const PHONE_COLUMN_INDEX = 5;  // Column F
    const STATUS_COLUMN_INDEX = 15; // Column P
    const URL_COLUMN_INDEX = 19;   // Column T

    // Sanitize input phone number
    const inputPhone = String(phone).replace(/\D/g, '');

    let matchedRow = -1;
    for (let i = 1; i < data.length; i++) {
      const sheetPhone = String(data[i][PHONE_COLUMN_INDEX]).replace(/\D/g, '');
      if (sheetPhone === inputPhone) {
        matchedRow = i + 1; // Row numbers are 1-indexed
        break;
      }
    }

    // Step 8: Update the row if a match was found
    if (matchedRow !== -1) {
      sheet.getRange(matchedRow, STATUS_COLUMN_INDEX + 1).setValue("verification status posted");
      sheet.getRange(matchedRow, URL_COLUMN_INDEX + 1).setValue(file.getUrl());
    } else {
      throw new Error(`No user found with phone number: ${phone}`);
    }

    // Step 9: Return success response
    return jsonOutput({
      success: true,
      message: "Screenshot uploaded and sheet updated successfully.",
      url: file.getUrl()
    });

  } catch (err) {
    console.error("Error in doPost:", err.message, err.stack);
    return jsonOutput({ success: false, message: err.message });
  }
}

// Helper function to return JSON responses
function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}