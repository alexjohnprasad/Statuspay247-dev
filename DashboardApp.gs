/**
 * GET: ?action=getTasks&phone=XXXXXXXXXX
 * POST: { action: "markPosted", phone: "...", adId: "...", row: ... }
 */
function doGet(e) {
  var action = e.parameter.action;
  if (action === "getTasks") {
    return getTasks(e);
  }
  return ContentService.createTextOutput(JSON.stringify({success:false, message:"Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  if (params.action === "markPosted") {
    return markTaskPosted(params);
  }
  return ContentService.createTextOutput(JSON.stringify({success:false, message:"Invalid action"})).setMimeType(ContentService.MimeType.JSON);
}

function getTasks(e) {
  var phone = (e.parameter.phone || "").trim();
  var sheet = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0").getSheetByName("Task Assigner");
  var data = sheet.getDataRange().getValues();
  var tasks = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var phoneCol = String(row[2] || "").replace(/\D/g, "");
    var userPhone = phone.replace(/\D/g, "");
    var expired = row[3]; // D: Expired (checkbox)
    var completed = row[7]; // H: Completed (checkbox)
    var posted = row[10]; // K: Posted (checkbox)
    if (phoneCol === userPhone && !expired && !completed && !posted) {
      tasks.push({
        adId: row[0], // A
        caption: row[6], // G
        mediaType: row[8], // I
        mediaUrl: row[9], // J
        rowNumber: i + 1 // for updating later
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success:true, tasks:tasks})).setMimeType(ContentService.MimeType.JSON);
}

function markTaskPosted(params) {
  var phone = (params.phone || "").trim();
  var adId = params.adId;
  var rowNumber = params.row;
  var sheet = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0").getSheetByName("Task Assigner");
  var data = sheet.getDataRange().getValues();
  var rowIdx = rowNumber - 1;
  if (rowIdx < 1 || rowIdx >= data.length) {
    return ContentService.createTextOutput(JSON.stringify({success:false, message:"Invalid row"})).setMimeType(ContentService.MimeType.JSON);
  }
  // Double check phone and adId match
  if (
    String(data[rowIdx][2]).replace(/\D/g, "") === phone.replace(/\D/g, "") &&
    String(data[rowIdx][0]) === adId
  ) {
    sheet.getRange(rowNumber, 11).setValue(true); // K column (11th col)
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({success:false, message:"No match"})).setMimeType(ContentService.MimeType.JSON);
}