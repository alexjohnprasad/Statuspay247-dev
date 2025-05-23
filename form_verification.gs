/**
 * This function processes form submissions, verifies phone numbers, and handles dashboard data
 * Optimized for better performance and reliability
 */
function doGet(e) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '3600'
    };

    if (e.parameter.method === 'options') {
      return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }

    if (e.parameter.test === 'ping') {
      return ContentService.createTextOutput('pong')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }

    if (e.parameter.callback) {
      const callback = sanitizeCallback(e.parameter.callback);
      const jsonData = JSON.stringify({
        success: true,
        message: 'JSONP test successful',
        timestamp: new Date().toISOString()
      });
      return ContentService.createTextOutput(`${callback}(${jsonData});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }

    if (e.parameter.action === 'test') {
      const response = {
        success: true,
        message: 'Test successful',
        timestamp: new Date().toISOString(),
        params: e.parameter
      };
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }

    const phone = e.parameter.phone;
    const email = e.parameter.email;
    const check = e.parameter.check;
    const action = e.parameter.action;
    const password = e.parameter.password;
    const callback = e.parameter.callback;

    let response;

    if (action === "login") {
      response = handleLogin(phone, password);
    } else if (action === "getDashboard") {
      return getDashboardData(phone, callback);
    } else {
      const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
      const sheet = ss.getSheetByName("New login");
      const data = sheet.getDataRange().getValues();

      const phoneColIndex = 5;
      const eligibleColIndex = 14;
      const statusColIndex = 15;
      const queryPhone = phone ? phone.toString().replace(/[^0-9]/g, "").slice(-10) : "";

      let verified = false;
      const startRow = Math.max(1, data.length - 20);
      for (let i = data.length - 1; i >= startRow; i--) {
        const sheetPhone = data[i][phoneColIndex]?.toString().replace(/[^0-9]/g, "").slice(-10) || "";
        if (sheetPhone === queryPhone) {
          verified = true;
          if (check) {
            sheet.getRange(i + 1, statusColIndex + 1).setValue("Verified - " + new Date().toLocaleString());
            if (!data[i][eligibleColIndex]) {
              sheet.getRange(i + 1, eligibleColIndex + 1).setValue("Yes");
            }
          }
          break;
        }
      }

      response = ContentService.createTextOutput(JSON.stringify({
        verified: verified,
        timestamp: new Date().toString(),
        phone: phone
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (callback) {
      const content = response.getContent();
      return ContentService.createTextOutput(callback + "(" + content + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }

    if (response && typeof response.setHeader === 'function') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      response.setHeader('Access-Control-Max-Age', '3600');
      return response;
    } else {
      var textOutput = ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
      textOutput.setHeader('Access-Control-Allow-Origin', '*');
      textOutput.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      textOutput.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      textOutput.setHeader('Access-Control-Max-Age', '3600');
      return textOutput;
    }
  } catch (error) {
    const errorResponse = {
      success: false,
      message: "Server error occurred",
      error: error.toString()
    };
    if (e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + "(" + JSON.stringify(errorResponse) + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
      .setHeader('Access-Control-Max-Age', '3600');
  }
}

/**
 * Fetches user dashboard data based on phone number
 */
function getDashboardData(phone, callback) {
  const queryPhone = phone ? phone.toString().replace(/[^0-9]/g, "").slice(-10) : "";
  const cacheKey = `dashboard_${queryPhone}`;
  const cache = CacheService.getScriptCache();

  let cached = cache.get(cacheKey);
  if (cached) {
    const json = cached;
    if (callback) {
      return ContentService.createTextOutput(callback + "(" + json + ");")
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeader('Access-Control-Allow-Origin', '*');
    } else {
      return ContentService.createTextOutput(json)
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*');
    }
  }

  const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
  const sheet = ss.getSheetByName("MoneyTracking");

  let result;
  if (!queryPhone || !sheet) {
    result = {
      success: false,
      message: "Phone number is required or sheet not found"
    };
  } else {
    const lastRow = sheet.getLastRow();
    const phoneColumnValues = sheet.getRange(2, 2, lastRow - 1).getValues(); // Column B
    let foundRow = -1;

    for (let i = 0; i < phoneColumnValues.length; i++) {
      const rowPhone = String(phoneColumnValues[i][0] || "").replace(/[^0-9]/g, "").slice(-10);
      if (rowPhone === queryPhone) {
        foundRow = i + 2; // Adjust for header
        break;
      }
    }

    if (foundRow !== -1) {
      const rowData = sheet.getRange(foundRow, 1, 1, sheet.getLastColumn()).getValues()[0];
      result = {
        success: true,
        data: {
          posterId: rowData[0] || "",
          phone: rowData[1] || "",
          name: rowData[2] || "",
          tasksCompleted: rowData[3] || 0,
          totalEarned: rowData[4] || 0,
          paid: rowData[5] || 0,
          balance: rowData[6] || 0,
          lastTask: rowData[7] || "",
          eligible: rowData[14] === "Yes"
        }
      };
    } else {
      result = {
        success: false,
        message: "No matching record found"
      };
    }
  }

  const json = JSON.stringify(result);
  cache.put(cacheKey, json, 300); // Cache for 5 minutes

  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT)
      .setHeader('Access-Control-Allow-Origin', '*');
  } else {
    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}


/**
 * Optimized login function with consistent password handling and caching
 */
function checkLogin(phone, password) {
  const startTime = new Date().getTime();
  Logger.log("checkLogin called with phone: " + phone);
  
  const queryPhone = standardizePhone(phone);
  if (queryPhone.length !== 10) {
    return createError('INVALID_PHONE', 'Invalid phone number format');
  }
  
  if (!password || password.length !== 64) {
    return createError('INVALID_PASSWORD', 
      'Invalid password format',
      'Password must be provided as a SHA-256 hash');
  }
  
  const userKey = `login_${queryPhone}`;
  const cache = CacheService.getScriptCache();
  const attempts = parseInt(cache.get(userKey) || "0");
  
  if (attempts >= 5) {
    const waitMinutes = 5;
    return createError('RATE_LIMIT', 
      `Too many failed attempts. Please wait ${waitMinutes} minutes.`);
  }

  try {
    const cachedUserKey = `user_${queryPhone}`;
    const cachedUserData = cache.get(cachedUserKey);
    
    if (cachedUserData) {
      const userData = JSON.parse(cachedUserData);
      
      if (secureCompare(userData.password, password)) {
        cache.remove(userKey);
        return handleSuccessfulLogin(userData, queryPhone);
      } else {
        cache.put(userKey, attempts + 1, 300);
        return createError('INVALID_CREDENTIALS', 'Invalid password');
      }
    }
    
    const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
    const sheet = ss.getSheetByName("New login");
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const rowPhone = standardizePhone(data[i][5]);
      if (rowPhone === queryPhone) {
        const storedPassword = data[i][18]?.toString() || "";
        
        if (!storedPassword) {
          return createError('ACCOUNT_SETUP', 
            'Account exists but password not set. Please contact support.');
        }
        
        const userDataToCache = {
          name: data[i][2] || "",
          phone: data[i][5] || "",
          password: storedPassword
        };
        cache.put(cachedUserKey, JSON.stringify(userDataToCache), 3600);
        
        if (secureCompare(storedPassword, password)) {
          cache.remove(userKey);
          return handleSuccessfulLogin(userDataToCache, queryPhone, sheet, i + 1);
        } else {
          cache.put(userKey, attempts + 1, 300);
          return createError('INVALID_CREDENTIALS', 'Invalid password');
        }
      }
    }
    
    return createError('USER_NOT_FOUND', 'No account found with this phone number');
    
  } catch (e) {
    Logger.log("Login error: " + e.toString());
    return createError('SYSTEM_ERROR', 
      'An unexpected error occurred. Please try again later.',
      e.toString());
  }
}

/**
 * Handle login requests
 */
function handleLogin(phone, password) {
  Logger.log("handleLogin called with phone: " + phone);
  
  if (!phone || !password) {
    Logger.log("Missing required login parameters");
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Phone number and password are required"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (password.length !== 64) {
    Logger.log("Warning: Password is not a standard SHA-256 hash length");
  }
  
  const result = checkLogin(phone, password);
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a new user record to the sheet
 */
function addRecord(name, phone, email, password) {
  try {
    const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
    const sheet = ss.getSheetByName("New login");
    
    const data = sheet.getDataRange().getValues();
    const queryPhone = phone.toString().replace(/[^0-9]/g, "").slice(-10);
    
    for (let i = 1; i < data.length; i++) {
      const rowPhone = data[i][5]?.toString().replace(/[^0-9]/g, "").slice(-10) || "";
      if (rowPhone === queryPhone) {
        return {
          success: false,
          message: "Phone number already registered"
        };
      }
    }
    
    if (password && password.length !== 64) {
      Logger.log("Warning: Received non-standard hash length password");
      return {
        success: false,
        message: "Invalid password format. Please try again."
      };
    }
    
    const newRow = [];
    newRow[2] = name;
    newRow[3] = email;
    newRow[5] = phone;
    newRow[14] = "Yes";
    newRow[15] = "Registered - " + new Date().toLocaleString();
    newRow[18] = password;
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      message: "Registration successful"
    };
    
  } catch (e) {
    Logger.log("Add record error: " + e.toString());
    return {
      success: false,
      message: "System error, please try again later",
      error: e.toString()
    };
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const params = e.parameter;
    Logger.log("doPost called with action: " + params.action);
    
    const createResponse = function(content) {
      return ContentService.createTextOutput(JSON.stringify(content))
        .setMimeType(ContentService.MimeType.JSON);
    };
    
    if (params.action === "login") {
      const phone = params.phone;
      const password = params.password;
      
      if (!phone || !password) {
        return createResponse({
          success: false,
          message: "Phone number and password are required"
        });
      }
      
      const result = checkLogin(phone, password);
      return createResponse(result);
      
    } else if (params.action === "register") {
      const name = params.name;
      const phone = params.phone;
      const email = params.email;
      const password = params.password;
      
      if (!name || !phone || !email || !password) {
        return createResponse({
          success: false,
          message: "All fields are required"
        });
      }
      
      const result = addRecord(name, phone, email, password);
      return createResponse(result);
    }
    
    return createResponse({
      success: false,
      message: "Invalid action"
    });
    
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "System error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Utility functions
function standardizePhone(phone) {
  return (phone || "").toString().replace(/[^0-9]/g, "").slice(-10);
}

function createError(code, message, details = null) {
  const error = {
    success: false,
    error: {
      code: code,
      message: message,
      details: details
    }
  };
  
  Logger.log(`Error ${code}: ${message}`);
  if (details) Logger.log(`Details: ${JSON.stringify(details)}`);
  
  return error;
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

function handleSuccessfulLogin(userData, phone, sheet = null, row = null) {
  if (sheet && row) {
    try {
      sheet.getRange(row, 16).setValue("Last login: " + new Date().toLocaleString());
    } catch (e) {
      Logger.log("Error updating login time: " + e.toString());
    }
  }

  return {
    success: true,
    user: {
      name: userData.name,
      phone: phone,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Sanitizes a callback parameter to prevent XSS attacks
 */
function sanitizeCallback(callback) {
  if (!/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(callback)) {
    Logger.log("Invalid callback: " + callback);
    return "callback";
  }
  return callback;
}
