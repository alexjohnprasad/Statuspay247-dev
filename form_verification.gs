/**
 * This function processes form submissions, verifies phone numbers, and handles dashboard data
 * Optimized for better performance and reliability
 */
function doGet(e) {
  try {
    // Add CORS headers for all responses
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '3600'
    };
    
    // Handle OPTIONS preflight requests
    if (e.parameter.method === 'options') {
      return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }
    
    // Handle ping test
    if (e.parameter.test === 'ping') {
      return ContentService.createTextOutput('pong')
        .setMimeType(ContentService.MimeType.TEXT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }
    
    // Handle JSONP test
    if (e.parameter.callback) {
      const callback = e.parameter.callback;
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
    
    // Handle regular test action
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
    
    const startTime = new Date().getTime();
    Logger.log("doGet called with parameters: " + JSON.stringify(e.parameter));
    
    const phone = e.parameter.phone;
    const email = e.parameter.email;
    const check = e.parameter.check;
    const action = e.parameter.action;
    const password = e.parameter.password;
    const callback = e.parameter.callback; // For JSONP support
    
    let response;
    
    // Handle different actions
    if (action === "login") {
      response = handleLogin(phone, password);
    } else if (action === "getDashboard") {
      response = getDashboardData(phone);
    } else {
      // Get the spreadsheet by ID
      const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
      const sheet = ss.getSheetByName("New login"); // Using the correct sheet name
      
      // Get all data from the sheet
      const data = sheet.getDataRange().getValues();
      
      // Use the exact column indexes from your sheet structure (0-based indexing)
      const emailColIndex = 3;  // "Email Address" is column 4
      const phoneColIndex = 5;  // "WhatsApp Number" is column 6
      const eligibleColIndex = 14; // "Eligible" is column 15
      const statusColIndex = 15;   // "Status" is column 16
      
      // Check the most recent entries first (last 20 rows for better coverage)
      let verified = false;
      const startRow = Math.max(1, data.length - 20);
      
      // Clean the query phone number once
      const queryPhone = phone ? phone.toString().replace(/[^0-9]/g, "").slice(-10) : "";
      
      for (let i = data.length - 1; i >= startRow; i--) {
        // More flexible matching for phone numbers
        const sheetPhone = data[i][phoneColIndex] ? data[i][phoneColIndex].toString().replace(/[^0-9]/g, "").slice(-10) : "";
        
        // Match by phone (last 10 digits)
        if (sheetPhone && sheetPhone === queryPhone) {
          verified = true;
          break;
        }
      }
      
      // If checking and found, update the status column
      if (check && verified) {
        for (let i = data.length - 1; i >= startRow; i--) {
          const sheetPhone = data[i][phoneColIndex] ? data[i][phoneColIndex].toString().replace(/[^0-9]/g, "").slice(-10) : "";
          
          if (sheetPhone === queryPhone) {
            // Update the Status column
            sheet.getRange(i + 1, statusColIndex + 1).setValue("Verified - " + new Date().toLocaleString());
            
            // Also mark as Eligible if that column is empty
            if (!data[i][eligibleColIndex]) {
              sheet.getRange(i + 1, eligibleColIndex + 1).setValue("Yes");
            }
            break;
          }
        }
      }
      
      response = ContentService.createTextOutput(JSON.stringify({
        verified: verified,
        timestamp: new Date().toString(),
        phone: phone
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // If a callback is provided, wrap the response for JSONP
    if (callback) {
      // Log the callback being used
      Logger.log("Using callback: " + callback);
      
      // Get the content from the response
      const content = response.getContent();
      
      // Create the JSONP response
      const jsonpResponse = callback + "(" + content + ");";
      
      // Set CORS headers for the JSONP response
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }

    const endTime = new Date().getTime();
    Logger.log("doGet completed in " + (endTime - startTime) + "ms");

    // Fix: Only set headers if response is a ContentService.TextOutput (has setHeader)
    if (response && typeof response.setHeader === 'function') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      response.setHeader('Access-Control-Max-Age', '3600');
      return response;
    } else {
      // If response is not a ContentService output, wrap it
      var textOutput = ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
      textOutput.setHeader('Access-Control-Allow-Origin', '*');
      textOutput.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      textOutput.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
      textOutput.setHeader('Access-Control-Max-Age', '3600');
      return textOutput;
    }
  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    
    // Create an error response
    const errorResponse = {
      success: false,
      message: "Server error occurred",
      error: error.toString()
    };
    
    // If callback is provided, wrap the error response for JSONP
    if (e.parameter.callback) {
      const jsonpResponse = e.parameter.callback + "(" + JSON.stringify(errorResponse) + ");";
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .setHeader('Access-Control-Max-Age', '3600');
    }
    
    // Otherwise return a regular JSON response
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
      .setHeader('Access-Control-Max-Age', '3600');
  }
}

/**
 * Get dashboard data for a specific user by phone number
 */
function getDashboardData(phone) {
  try {
    if (!phone) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Phone number is required"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
    
    // Clean phone number for comparison
    const queryPhone = phone.toString().replace(/[^0-9]/g, "").slice(-10);
    Logger.log("Getting dashboard data for phone: " + queryPhone);
    
    // Get data directly from MoneyTracking sheet
    const moneySheet = ss.getSheetByName("MoneyTracking");
    if (!moneySheet) {
      Logger.log("MoneyTracking sheet not found");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Dashboard data not available"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const moneyData = moneySheet.getDataRange().getValues();
    Logger.log("MoneyTracking sheet has " + moneyData.length + " rows");
    
    // Column indexes based on the MoneyTracking sheet
    // A: Poster ID (index 0)
    // B: Mobile number (index 1)
    // C: Full Name (index 2)
    // D: Total Task Completed (index 3)
    // E: Total earned (index 4)
    // F: Paid (index 5)
    // G: Current Balance (index 6)
    // H: Last assigned task (index 7)
    
    let userData = null;
    
    // Look for user's data in MoneyTracking sheet
    for (let i = 1; i < moneyData.length; i++) {
      const rowPhone = String(moneyData[i][1] || "").trim().replace(/[^0-9]/g, "").slice(-10);
      
      if (rowPhone === queryPhone) {
        Logger.log("Found user in MoneyTracking at row " + i);
        userData = {
          posterId: moneyData[i][0] || "",                // Poster ID
          phone: moneyData[i][1] || "",                   // Mobile number
          name: moneyData[i][2] || "",                    // Full Name
          tasksCompleted: moneyData[i][3] || 0,           // Total Task Completed
          totalEarned: moneyData[i][4] || 0,              // Total earned
          paid: moneyData[i][5] || 0,                     // Paid
          balance: moneyData[i][6] || 0,                  // Current Balance
          lastTask: moneyData[i][7] || "No active tasks"  // Last assigned task
        };
        break;
      }
    }
    
    if (!userData) {
      // If user not found in MoneyTracking, try to get basic info from New login sheet
      Logger.log("User not found in MoneyTracking, checking New login sheet");
      const loginSheet = ss.getSheetByName("New login");
      if (loginSheet) {
        const loginData = loginSheet.getDataRange().getValues();
        
        for (let i = 1; i < loginData.length; i++) {
          const rowPhone = loginData[i][5]?.toString().replace(/[^0-9]/g, "").slice(-10) || "";
          
          if (rowPhone === queryPhone) {
            Logger.log("Found user in New login at row " + i);
            userData = {
              posterId: `PST-${String(i).padStart(4, '0')}`, // Generate Poster ID
              phone: loginData[i][5] || "",                  // WhatsApp Number
              name: loginData[i][2] || "",                   // Full Name
              tasksCompleted: 0,
              totalEarned: 0,
              paid: 0,
              balance: 0,
              lastTask: "No active tasks",
              eligible: loginData[i][14] === "Yes"           // Eligible
            };
            break;
          }
        }
      }
    }
    
    if (!userData) {
      Logger.log("User not found in any sheet");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "User not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get assigned ads (placeholder - you can implement this if you have an Ads sheet)
    userData.ads = [];
    
    Logger.log("Returning dashboard data: " + JSON.stringify(userData));
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: userData
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Dashboard data error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "System error: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Optimized login function with consistent password handling and caching
 * This function assumes all passwords are stored as SHA-256 hashes (64 characters)
 */
function checkLogin(phone, password) {
  const startTime = new Date().getTime();
  Logger.log("checkLogin called with phone: " + phone);
  
  // Standardize phone number
  const queryPhone = standardizePhone(phone);
  if (queryPhone.length !== 10) {
    return createError('INVALID_PHONE', 'Invalid phone number format');
  }
  
  // Validate password format
  if (!password || password.length !== 64) {
    return createError('INVALID_PASSWORD', 
      'Invalid password format',
      'Password must be provided as a SHA-256 hash');
  }
  
  // Rate limiting with improved counter management
  const userKey = `login_${queryPhone}`;
  const cache = CacheService.getScriptCache();
  const attempts = parseInt(cache.get(userKey) || "0");
  
  if (attempts >= 5) {
    const waitMinutes = 5;
    return createError('RATE_LIMIT', 
      `Too many failed attempts. Please wait ${waitMinutes} minutes.`);
  }

  try {
    // Check cached data first
    const cachedUserKey = `user_${queryPhone}`;
    const cachedUserData = cache.get(cachedUserKey);
    
    if (cachedUserData) {
      const userData = JSON.parse(cachedUserData);
      
      // Use constant-time comparison for passwords
      if (secureCompare(userData.password, password)) {
        cache.remove(userKey); // Reset attempts on success
        return handleSuccessfulLogin(userData, queryPhone);
      } else {
        cache.put(userKey, attempts + 1, 300); // Increment only on failure
        return createError('INVALID_CREDENTIALS', 'Invalid password');
      }
    }
    
    // Query spreadsheet if no cache hit
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
        
        // Cache user data
        const userDataToCache = {
          name: data[i][2] || "",
          phone: data[i][5] || "",
          password: storedPassword
        };
        cache.put(cachedUserKey, JSON.stringify(userDataToCache), 3600);
        
        if (secureCompare(storedPassword, password)) {
          cache.remove(userKey); // Reset attempts on success
          return handleSuccessfulLogin(userDataToCache, queryPhone, sheet, i + 1);
        } else {
          cache.put(userKey, attempts + 1, 300); // Increment only on failure
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
 * Handle login requests by checking credentials against the sheet
 * This function wraps checkLogin to maintain compatibility with existing code
 */
function handleLogin(phone, password) {
  Logger.log("handleLogin called with phone: " + phone);
  Logger.log("Password length: " + (password ? password.length : 0));
  
  // Validate input
  if (!phone || !password) {
    Logger.log("Missing required login parameters");
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Phone number and password are required"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Check if password is a valid SHA-256 hash (should be 64 characters)
  if (password.length !== 64) {
    Logger.log("Warning: Password is not a standard SHA-256 hash length (received: " + password.length + ")");
  }
  
  // Use the improved checkLogin function
  const result = checkLogin(phone, password);
  
  // Convert the result to the expected format
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a new user record to the sheet
 * Ensures password is stored as a hash
 */
function addRecord(name, phone, email, password) {
  try {
    const ss = SpreadsheetApp.openById("1ym0pnue6tbGImFA2ANYDFi0YAr7JQV8yfD2WPu3-um0");
    const sheet = ss.getSheetByName("New login");
    
    // Check if phone already exists
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
    
    // Ensure password is a hash (should be 64 characters for SHA-256)
    // If it's not, we'll assume it's a plain text password and won't store it
    // The client should be responsible for hashing before sending
    if (password && password.length !== 64) {
      Logger.log("Warning: Received non-standard hash length password during registration");
      return {
        success: false,
        message: "Invalid password format. Please try again."
      };
    }
    
    // Create a new row with the user data
    // Adjust the column positions based on your sheet structure
    const newRow = [];
    newRow[2] = name;           // Full Name (column C)
    newRow[3] = email;          // Email Address (column D)
    newRow[5] = phone;          // WhatsApp Number (column F)
    newRow[14] = "Yes";         // Eligible (column O)
    newRow[15] = "Registered - " + new Date().toLocaleString(); // Status (column P)
    newRow[18] = password;      // Password (column S)
    
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
 * Add cross-origin support for direct POST requests
 * Improved error handling and CORS support
 */
function doPost(e) {
  try {
    const params = e.parameter;
    Logger.log("doPost called with action: " + params.action);
    
    // Create a response with CORS headers
    const createResponse = function(content) {
      return ContentService.createTextOutput(JSON.stringify(content))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'GET, POST')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
      
      // Use the improved checkLogin function
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
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

// Utility functions
function standardizePhone(phone) {
  return (phone || "").toString().replace(/[^0-9]/g, "").slice(-10);
}

function createResponse(data, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'X-Status-Code': status
  };
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
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

// Helper functions
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
  // Update last login time if sheet info provided
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
      phone: phone
    }
  };
}