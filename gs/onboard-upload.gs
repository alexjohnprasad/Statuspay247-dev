const FOLDER_ID = '1lymA7F9kub_TWggqHk9duICO2OPNUb2V'; // Screenshot folder
const SHEET_ID = '1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0';
const SHEET_NAME = 'New login';

function doPost(e) {
  try {
    // Get the folder explicitly here
    const folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log('Folder initialized: ' + (folder ? 'YES' : 'NO'));

    const params = e.parameter;
    const rawPhone = (params.phone || '').trim();
    const phone = rawPhone.slice(-10);
    const base64Data = params.base64Data;
    const contentType = params.contentType || 'image/png';

    const timezone = Session.getScriptTimeZone();
    const now = new Date();
    const readableTimestamp = Utilities.formatDate(now, timezone, "yyyy-MM-dd HH:mm:ss");
    const fileSafeTimestamp = Utilities.formatDate(now, timezone, "yyyyMMdd'T'HHmmss");
    const filename = params.filename || `${phone}_${fileSafeTimestamp}.png`;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!phone || !base64Data) return sendJsonResponse({ success: false, message: "Missing data." });
    if (!allowedTypes.includes(contentType)) return sendJsonResponse({ success: false, message: "Invalid file type." });
    if (!/^[0-9]{10}$/.test(phone)) return sendJsonResponse({ success: false, message: "Invalid phone number." });

    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, filename);
    const file = folder.createFile(blob);
    const fileUrl = file.getUrl();

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getRange('F2:F' + sheet.getLastRow()).getValues();

    function getFileIdFromUrl(url) {
      const idMatch = url.match(/[-\w]{25,}/);
      return idMatch ? idMatch[0] : null;
    }

    let matched = false;
    for (let i = 0; i < data.length; i++) {
      const sheetPhoneRaw = data[i][0];
      if (!sheetPhoneRaw) continue;

      const sheetPhone = String(sheetPhoneRaw).trim().slice(-10);

      if (sheetPhone === phone) {
        const row = i + 2;

        // Get existing formula or value in column T (20)
        const existingCell = sheet.getRange(row, 20).getFormula() || sheet.getRange(row, 20).getValue();

        // Extract old URLs from existing cell (formula or plain text)
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
          break;
        }

        // Build old links formulas (HYPERLINK("url","Link x"))
        const oldLinksFormulas = uniqueOldUrls.map((url, idx) => {
          return `HYPERLINK("${url}", "Link ${idx + 1}")`;
        });

        // Build combined formula string with image chip + old links separated by CHAR(10)
        let formula = `=HYPERLINK("https://drive.google.com/uc?id=${newFileId}", IMAGE("https://drive.google.com/uc?id=${newFileId}", 4, 50, 50))`;

        if (oldLinksFormulas.length > 0) {
          formula += ' & CHAR(10) & "' + oldLinksFormulas.join(' & CHAR(10) & "') + '"';
        }

        // Set the formula in the cell
        sheet.getRange(row, 20).setFormula(formula);

        matched = true;
        break;
      }
    }

    if (!matched) {
      file.setTrashed(true);
      return sendJsonResponse({ success: false, message: "Phone number not found in sheet." });
    }

    // Cleanup old or unlinked files after upload
    cleanupOldFiles(folder, sheet);

    return sendJsonResponse({ success: true, message: "Upload successful", fileUrl });

  } catch (err) {
    Logger.log('Error in doPost: ' + err.message);
    return sendJsonResponse({ success: false, message: err.message });
  }
}

function cleanupOldFiles(folder, sheet) {
  Logger.log('cleanupOldFiles: folder id = ' + (folder ? folder.getId() : 'null or undefined'));
  if (!folder) {
    Logger.log("cleanupOldFiles: folder is undefined or null");
    return;
  }

  const files = folder.getFiles();
  const sheetLinksRange = sheet.getRange('T2:T' + sheet.getLastRow()).getValues();

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
}

function sendJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
