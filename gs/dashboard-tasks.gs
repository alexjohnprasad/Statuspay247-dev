/**
 * Gets assigned tasks for a user based on their phone number
 * @param {Object} e - The request parameters
 * @return {ContentService.TextOutput} JSON response with tasks
 */
function doGet(e) {
  try {
    const phone = e.parameter.phone;
    if (!phone) {
      return createErrorResponse('Phone number is required');
    }

    const ss = SpreadsheetApp.openById('1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0');
    const tasks = getAssignedTasks(ss, phone);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      tasks: tasks
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return createErrorResponse(error.message);
  }
}

function getAssignedTasks(ss, phone) {
  // Get assigned tasks for this user from Task Assigner sheet
  const assignerSheet = ss.getSheetByName('Task Assigner');
  const assignerData = assignerSheet.getDataRange().getValues();
  
  // Column indexes (adjust based on your sheet structure)
  const COLUMNS = {
    DATE: 0,
    AD_ID: 1, 
    NUMBER: 2,
    POSTED: 3,
    WHATSAPP_LINK: 4,
    HELPER: 5,
    EXPIRED: 6
  };

  // Filter tasks for this user that aren't completed
  const userTasks = assignerData.filter(row => 
    row[COLUMNS.NUMBER] === phone && // Match phone number
    !row[COLUMNS.POSTED] && // Not marked as posted
    !row[COLUMNS.EXPIRED] // Not expired
  );

  // Get task details from TaskContent sheet
  const contentSheet = ss.getSheetByName('TaskContent');
  const contentData = contentSheet.getDataRange().getValues();
  
  // Process tasks
  return userTasks.map(task => {
    const adId = task[COLUMNS.AD_ID];
    const contentRow = contentData.find(row => row[0] === adId);
    
    if (!contentRow) return null;
    
    // Parse helper column (A ||| B ||| C ||| D format)
    const helperContent = contentRow[contentRow.length-1];
    const [adIdFromContent, caption, mediaType, mediaUrl] = helperContent.split(' ||| ');
    
    return {
      adId,
      caption,
      mediaType, 
      mediaUrl,
      whatsappLink: task[COLUMNS.WHATSAPP_LINK],
      dateAssigned: task[COLUMNS.DATE]
    };
  }).filter(task => task !== null);
}

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: message
  })).setMimeType(ContentService.MimeType.JSON);
}
