function setLanguage(lang) {
  // Toggle active button state
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-ml').classList.toggle('active', lang === 'ml');

  // Save preference to localStorage
  localStorage.setItem('statuspay247_lang', lang);

  // Update all elements with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach((el) => {
    const key = el.getAttribute('data-translate');
    const translations = {
      'wallet-title': { en: 'Your Wallet', ml: 'നിങ്ങളുടെ വോലറ്റ്' },
      'total-earned': { en: 'Total Earned', ml: 'ആകെ നേടിയത്' },
      'paid-out': { en: 'Paid Out', ml: 'കൈപ്പറ്റിയത്' },
      'threshold-note': {
        en: 'You can only withdraw your amount after meeting the ₹500 threshold.',
        ml: '₹500 ആകുമ്പോൾ മാത്രമേ പണം പിൻവലിക്കാൻ സാധിക്കൂ.',
      },
      'profile-title': {
        en: 'Profile Information',
        ml: 'പ്രൊഫൈൽ വിവരങ്ങൾ',
      },
      'poster-id': { en: 'Poster ID', ml: 'പോസ്റ്റർ നമ്പർ' },
      'phone-number': { en: 'Phone Number', ml: 'ഫോൺ നമ്പർ' },
      'group-title': {
        en: 'Join Official Posters Group',
        ml: 'ഔദ്യോഗിക വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ചേരൂ',
      },
      'upload-title': {
        en: 'Upload Task Screenshot',
        ml: 'സ്‌ക്രീൻഷോട്ട് അപ്‌ലോഡ് ചെയ്യൂ',
      },
      'completed-upload-title': {
        en: 'Upload Completed Task',
        ml: 'പൂർത്തിയായ ടാസ്ക് അപ്‌ലോഡ് ചെയ്യൂ',
      },
      'select-ad-label': {
        en: 'Select Completed Task:',
        ml: 'പൂർത്തിയായ ടാസ്ക് തിരഞ്ഞെടുക്കൂ:',
      },
      'loading-tasks': {
        en: 'Loading available tasks...',
        ml: 'ലഭ്യമായ ടാസ്കുകൾ ലോഡ് ചെയ്യുന്നു...',
      },
      'upload-screenshot-label': {
        en: 'Upload Screenshot:',
        ml: 'സ്‌ക്രീൻഷോട്ട് അപ്‌ലോഡ് ചെയ്യൂ:',
      },
      'upload-btn': { en: 'Upload', ml: 'അപ്‌ലോഡ് ചെയ്യൂ' },
      'completed-task-instructions': {
        en: 'Select a completed task and upload your status screenshot showing the view count after 23 hours.',
        ml: 'പൂർത്തിയായ ടാസ്ക് തിരഞ്ഞെടുത്ത് 23 മണിക്കൂർ കഴിഞ്ഞുള്ള വ്യൂ കൗണ്ട് കാണിക്കുന്ന സ്‌ക്രീൻഷോട്ട് അപ്‌ലോഡ് ചെയ്യൂ.',
      },
      'contact-support': {
        en: 'Contact Support',
        ml: 'സഹായത്തിന് ബന്ധപ്പെടൂ',
      },
      'view-terms': { en: 'View Terms', ml: 'നിബന്ധനകൾ' },
      'onboarding-title': {
        en: 'Complete Onboarding',
        ml: 'രജിസ്ട്രേഷൻ പൂർത്തിയാക്കൂ',
      },
      'onboarding-instructions': {
        en: 'Please complete onboarding by uploading your screenshot.',
        ml: 'നിങ്ങളുടെ വാട്സ്ആപ്പ് സ്റ്റാറ്റസിന്റെ സ്‌ക്രീൻഷോട്ട് അപ്‌ലോഡ് ചെയ്ത് രജിസ്ട്രേഷൻ പൂർത്തിയാക്കൂ.',
      },
      'step1-title': {
        en: 'Step 1: Follow us on Social Media',
        ml: 'ആദ്യപടി: ഞങ്ങളുടെ സോഷ്യൽ മീഡിയ അക്കൗണ്ടുകൾ ഫോളോ ചെയ്യൂ',
      },
      'step2-title': {
        en: 'Step 2: WhatsApp Status Task',
        ml: 'രണ്ടാം പടി: വാട്സ്ആപ്പ് സ്റ്റാറ്റസ് പോസ്റ്റ് ചെയ്യൂ',
      },
      'step3-title': {
        en: 'Step 3: Upload Your Status Screenshot',
        ml: 'മൂന്നാം പടി: സ്റ്റാറ്റസിന്റെ സ്‌ക്രീൻഷോട്ട് അപ്‌ലോഡ് ചെയ്യൂ',
      },
      'status-caption': {
        en: 'Status Caption (copy & paste)',
        ml: 'സ്റ്റാറ്റസിനൊപ്പം ചേർക്കേണ്ട വാചകം (കോപ്പി ചെയ്യൂ)',
      },
      'upload-instructions': {
        en: 'After 23 hours of posting, take a screenshot of your WhatsApp status showing the number of views your post received.',
        ml: 'സ്റ്റാറ്റസ് പോസ്റ്റ് ചെയ്ത് 23 മണിക്കൂർ കഴിഞ്ഞ്, എത്ര പേർ കണ്ടു എന്ന് കാണിക്കുന്ന സ്‌ക്രീൻഷോട്ട് എടുക്കൂ.',
      },
      'upload-note': {
        en: 'Make sure your screenshot clearly shows the number of views on your status after 23 hours.',
        ml: 'സ്റ്റാറ്റസ് എത്ര പേർ കണ്ടു എന്നത് സ്‌ക്രീൻഷോട്ടിൽ വ്യക്തമായി കാണണം.',
      },
      'follow-note': {
        en: 'Please follow our official pages and keep a screenshot for verification.',
        ml: 'ദയവായി ഞങ്ങളുടെ ഔദ്യോഗിക പേജുകൾ ഫോളോ ചെയ്ത് അതിന്റെ സ്‌ക്രീൻഷോട്ട് എടുത്തു വയ്ക്കൂ.',
      },
      'download-note': {
        en: 'Download and post this image to your WhatsApp status.',
        ml: 'ഈ ചിത്രം ഡൗൺലോഡ് ചെയ്യുക  .',
      },
      'copy-note': {
        en: 'Copy this caption and paste it with your status image.',
        ml: 'മുകളിലെ വാചകം കോപ്പി ചെയ്ത് ചിത്രത്തോടൊപ്പം സ്റ്റാറ്റസിൽ ചേര്ക്കു .',
      },
      'post-note': {
        en: 'Post both the image and caption to your WhatsApp status for approval.',
        ml: 'ചിത്രവും വാചകവും നിങ്ങളുടെ വാട്സ്ആപ്പ് സ്റ്റാറ്റസിൽ പോസ്റ്റ് ചെയ്യൂ.',
      },
      'verification-note': {
        en: 'Note: Screenshot verification is a manual process and may take up to 24 hours. Once you upload your screenshot, just sit back and relax – our team will review and approve it as soon as possible!',
        ml: 'കുറിപ്പ്: സ്‌ക്രീൻഷോട്ട് പരിശോധിക്കാൻ 24 മണിക്കൂർ വരെ എടുത്തേക്കാം. നിങ്ങൾ അപ്‌ലോഡ് ചെയ്തുകഴിഞ്ഞാൽ, ഞങ്ങളുടെ ടീം എത്രയും പെട്ടെന്ന് അത് പരിശോധിച്ച് അംഗീകരിക്കുന്നതാണ്!',
      },
    };

    if (translations[key]) {
      el.textContent = translations[key][lang];
    }
  });
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function () {
  const savedLang = localStorage.getItem('statuspay247_lang') || 'en';
  setLanguage(savedLang);

  // Add event listeners to language buttons
  document.getElementById('btn-en').addEventListener('click', function () {
    setLanguage('en');
  });

  document.getElementById('btn-ml').addEventListener('click', function () {
    setLanguage('ml');
  });
});

// Logout button logic
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('logoutBtn').onclick = function () {
    localStorage.removeItem('user');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('userPhone');
    window.location.href = 'login.html';
  };
});

function showOnboardingScreen(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('dashboardContent').style.display = 'none';
  document.getElementById('error').style.display = 'none';
  let onboarding = document.getElementById('onboardingScreen');
  var user = JSON.parse(localStorage.getItem('user'));
  var name = user && user.name ? user.name : '...';
  var onboardingUserName = document.getElementById('onboardingUserName');
  if (onboardingUserName) onboardingUserName.textContent = name;
  if (!onboarding) {
    onboarding = document.createElement('div');
    onboarding.id = 'onboardingScreen';
    onboarding.style.textAlign = 'center';
    onboarding.style.padding = '3rem';
    onboarding.innerHTML = `
            <div style="font-size:2.5rem; color:var(--primary-color); margin-bottom:1rem;">
              <i class="fas fa-user-plus"></i>
            </div>
            <h2>Complete Onboarding</h2>
            <p style="font-size:1.1rem; color:var(--text-light); margin-bottom:2rem;">${
              message ||
              'Please complete onboarding by uploading your screenshot.'
            }</p>
            <a href="#uploadSection" class="btn" style="font-size:1.1rem;">
              <i class="fas fa-upload"></i> Upload Screenshot
            </a>
          `;
    document.querySelector('main.container').prepend(onboarding);
  } else {
    onboarding.style.display = 'block';
  }
  onboarding.scrollIntoView({ behavior: 'smooth' });
}

function hideSpecialScreens() {
  let onboarding = document.getElementById('onboardingScreen');
  if (onboarding) onboarding.style.display = 'none';
  let waiting = document.getElementById('waitingScreen');
  if (waiting) waiting.style.display = 'none';
}

function checkOnboardingStatus(phone, callback) {
  const cbName = 'onboardingStatusCb_' + Date.now();
  window[cbName] = function (result) {
    callback(result);
    // Remove script tag after callback
    const script = document.getElementById(cbName);
    if (script) script.remove();
    delete window[cbName];
  };
  // Use a variable for the script URL
  const scriptURL =
    'https://script.google.com/macros/s/AKfycbzBHaOZQjCMHy94swo86M_Hb_mFodqt-c5hepUy89RglCGeUbbv_5yf1E8tf3Ebhycd/exec';
  const url = `${scriptURL}?action=onboardingStatus&phone=${encodeURIComponent(
    phone
  )}&callback=${cbName}`;
  const script = document.createElement('script');
  script.src = url;
  script.id = cbName;
  document.head.appendChild(script);
}

// New: Step-by-step dashboard loader
async function loadDashboardSequence(token) {
  hideSpecialScreens();
  const loadingDiv = document.getElementById('loading');
  if (loadingDiv) {
    loadingDiv.style.display = 'block';
    const user = JSON.parse(localStorage.getItem('user'));
    const userName = user && user.name ? user.name : 'User';
    const h3 = loadingDiv.querySelector('#loadingMessage');
    const p = loadingDiv.querySelector('#loadingSubMessage');
    if (h3) h3.textContent = `Loading your dashboard, ${userName}...`;
    if (p)
      p.textContent =
        'Please wait while we fetch your latest data. This will take approximately 30 seconds.';
  }

  // Verify token
  let phone = null;
  try {
    const cbName = 'verifyTokenCb_' + Date.now();
    // Use a variable for the script URL
    const verifyScriptURL =
      'https://script.google.com/macros/s/AKfycbzBHaOZQjCMHy94swo86M_Hb_mFodqt-c5hepUy89RglCGeUbbv_5yf1E8tf3Ebhycd/exec';
    const verifyUrl = `${verifyScriptURL}?action=verifyToken&token=${encodeURIComponent(
      token
    )}&callback=${cbName}`;
    phone = await new Promise((resolve, reject) => {
      window[cbName] = function (result) {
        if (result === 'EXPIRED' || (result && !result.success)) {
          // Redirect to login page if token is expired or invalid
          window.location.href = 'login.html';
          return;
        }
        if (result && result.success && result.phone) {
          resolve(result.phone);
        } else {
          reject(
            result && result.message
              ? result.message
              : 'Token verification failed'
          );
        }
        delete window[cbName];
        const script = document.getElementById(cbName);
        if (script) script.remove();
      };
      const script = document.createElement('script');
      script.src = verifyUrl;
      script.id = cbName;
      document.body.appendChild(script);
    });
  } catch (err) {
    // Redirect to login page if an error occurs
    window.location.href = 'login.html';
    return;
  }

  // 2. Check eligibility
  let eligible = false;
  try {
    // Use a variable for the script URL
    const eligibleScriptURL =
      'https://script.google.com/macros/s/AKfycbzBHaOZQjCMHy94swo86M_Hb_mFodqt-c5hepUy89RglCGeUbbv_5yf1E8tf3Ebhycd/exec';
    const eligibleUrl = `${eligibleScriptURL}?action=checkEligibility&phone=${encodeURIComponent(
      phone
    )}&callback=checkEligibleCb_${Date.now()}`;
    eligible = await new Promise((resolve, reject) => {
      const cbName = 'checkEligibleCb_' + Date.now();
      window[cbName] = function (result) {
        if (result && result.success) {
          resolve(result.eligible === true);
        } else {
          reject(
            result && result.message
              ? result.message
              : 'Eligibility check failed'
          );
        }
        delete window[cbName];
        const script = document.getElementById(cbName);
        if (script) script.remove();
      };
      const script = document.createElement('script');
      script.src = eligibleUrl.replace(/callback=[^&]+/, 'callback=' + cbName);
      script.id = cbName;
      document.body.appendChild(script);
    });
  } catch (err) {
    if (loadingDiv) loadingDiv.style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    const errorP = document.querySelector('#error p');
    if (errorP)
      errorP.textContent = 'Failed to check eligibility. Please try again.';
    return;
  }

  // 3. Get dashboard data or show onboarding
  if (!eligible) {
    showOnboardingScreen(
      'Please complete onboarding by uploading your screenshot.'
    );
    if (loadingDiv) loadingDiv.style.display = 'none';
    return;
  }

  try {
    const dashboardScriptURL =
      'https://script.google.com/macros/s/AKfycbzBHaOZQjCMHy94swo86M_Hb_mFodqt-c5hepUy89RglCGeUbbv_5yf1E8tf3Ebhycd/exec';
    const dashboardUrl = `${dashboardScriptURL}?action=getDashboardData&phone=${encodeURIComponent(
      phone
    )}&callback=getDashboardCb_${Date.now()}`;
    await new Promise((resolve, reject) => {
      const cbName = 'getDashboardCb_' + Date.now();
      window[cbName] = function (result) {
        try {
          if (!result.success || !result.data)
            throw new Error(result.message || 'Unknown error');
          const data = result.data;
          // --- Print last assigned task details for debugging ---
          if (data.lastTask !== undefined) {
            console.log('Last assigned task details:', data.lastTask);
          } else {
            console.log('No lastTask field in dashboard data:', data);
          }
          // ...existing code...
          const user = JSON.parse(localStorage.getItem('user'));
          const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
          };
          setText('userNameHeader', user && user.name ? user.name : 'User');
          // If dashboard is empty (no earnings yet), show a friendly message in the dashboard
          if (
            (!data.name || data.name.trim() === '') &&
            (!data.totalEarned || data.totalEarned === '0') &&
            (!data.balance || data.balance === '0')
          ) {
            document.getElementById('dashboardContent').style.display = 'block';
            document.getElementById('loading').style.display = 'none';
            const dashboardWelcome = document.querySelector(
              '.dashboard-welcome p'
            );
            if (dashboardWelcome) {
              dashboardWelcome.textContent =
                result.message ||
                'No earnings yet. Complete your first task to see your dashboard.';
            }
            setText('balance', '0.00');
            setText('totalEarned', '0.00');
            setText('paid', '0.00');
            setText('posterId', '...');
            if (walletBar && walletBarLabel) {
              walletBar.style.width = '0%';
              walletBarLabel.textContent = '0% of ₹500 threshold';
            }
            resolve();
            return;
          }
          // Defensive: Only update elements if they exist
          setText(
            'balance',
            data.balance !== undefined
              ? Number(data.balance).toFixed(2)
              : '0.00'
          );
          setText(
            'totalEarned',
            data.totalEarned !== undefined
              ? Number(data.totalEarned).toFixed(2)
              : '0.00'
          );
          setText(
            'paid',
            data.paid !== undefined ? Number(data.paid).toFixed(2) : '0.00'
          );
          setText('posterId', data.posterId || '...');
          setText('phone', data.phone || '...');
          setText(
            'profileTasksCompleted',
            data.tasksCompleted !== undefined ? data.tasksCompleted : 0
          );
          setText('lastTask', data.lastTask || '...'); // Update wallet bar and withdrawal button
          const walletBar = document.getElementById('walletBar');
          const walletBarLabel = document.getElementById('walletBarLabel');
          const withdrawBtn = document.getElementById('withdrawBtn');
          const withdrawIcon = document.getElementById('withdrawLockIcon');

          if (walletBar && walletBarLabel) {
            const threshold = 500;
            const balance = Number(data.balance) || 0;
            const progress = Math.min((balance / threshold) * 100, 100);
            walletBar.style.width = progress + '%';
            walletBarLabel.textContent = `${progress.toFixed(
              0
            )}% of ₹${threshold} threshold`;

            // Update withdrawal button state
            if (withdrawBtn && withdrawIcon) {
              if (balance >= threshold) {
                withdrawBtn.disabled = false;
                withdrawBtn.style.background = 'var(--primary-color)';
                withdrawIcon.className = 'fas fa-unlock';
                withdrawBtn.innerHTML =
                  '<i class="fas fa-unlock"></i> Withdraw';
              } else {
                withdrawBtn.disabled = true;
                withdrawBtn.style.background = '#ccc';
                withdrawIcon.className = 'fas fa-lock';
                withdrawBtn.innerHTML = '<i class="fas fa-lock"></i> Withdraw';
              }
            }
          }
          document.getElementById('dashboardContent').style.display = 'block';
          document.getElementById('loading').style.display = 'none';
          // After fetching dashboard data and before resolve();
          setText('lastTask', data.lastTask || '...');
          // Parse and display recent completed tasks
          const lastTaskDisplay = document.getElementById('lastTaskDisplay');
          if (lastTaskDisplay) {
            let formattedHTML = '';
            if (
              data.lastTask &&
              typeof data.lastTask === 'string' &&
              data.lastTask.trim()
            ) {
              // Handle multiple tasks format: "1. AD001 - Niva Daily (2025-06-24), 2. AD005 - (2025-06-24), 3. AD004 - food (2025-06-24)"
              if (data.lastTask.includes(',') && data.lastTask.includes('.')) {
                // Split by comma and parse each task
                const tasks = data.lastTask
                  .split(',')
                  .map((task) => task.trim());
                const taskItems = tasks
                  .map((task) => {
                    // Parse pattern: "1. AD001 - Niva Daily (2025-06-24)"
                    const match = task.match(
                      /^(\d+)\.\s*([A-Z0-9]+)\s*-\s*(.*?)\s*\((.*?)\)$/
                    );
                    if (match) {
                      const order = match[1];
                      const adId = match[2];
                      const name = match[3] || 'Untitled';
                      const date = match[4];
                      return `
                            <div style="font-size:0.93rem;color:#334155;background:#f3f4f6;padding:0.6em 0.9em;border-radius:8px;border-left:3px solid var(--primary-color);display:flex;justify-content:space-between;align-items:center;">
                              <div>
                                <span style="font-weight:600;color:var(--primary-color);margin-right:0.5em;">${order}.</span>
                                <span style="font-weight:600;color:#1f2937;">${adId}</span>
                                ${
                                  name
                                    ? `<span style="margin-left:0.5em;color:#6b7280;">- ${name}</span>`
                                    : ''
                                }
                              </div>
                              <span style="color:#9ca3af;font-size:0.85rem;">${date}</span>
                            </div>
                          `;
                    }
                    return null;
                  })
                  .filter(Boolean);

                if (taskItems.length > 0) {
                  formattedHTML = taskItems.join('');
                } else {
                  formattedHTML = `<div style="font-size:0.93rem;color:#6b7280;background:#f3f4f6;padding:0.6em 0.9em;border-radius:8px;text-align:center;">No recent tasks found</div>`;
                }
              } else {
                // Handle single task format: "1. dummy (2025-06-23)"
                const match = data.lastTask.match(
                  /^(\d+)\.\s*(.*?)\s*\((.*?)\)$/
                );
                if (match) {
                  const order = match[1];
                  const name = match[2];
                  const date = match[3];
                  formattedHTML = `
                          <div style="font-size:0.93rem;color:#334155;background:#f3f4f6;padding:0.6em 0.9em;border-radius:8px;border-left:3px solid var(--primary-color);display:flex;justify-content:space-between;align-items:center;">
                            <div>
                              <span style="font-weight:600;color:var(--primary-color);margin-right:0.5em;">${order}.</span>
                              <span style="font-weight:600;color:#1f2937;">${name}</span>
                            </div>
                            <span style="color:#9ca3af;font-size:0.85rem;">${date}</span>
                          </div>
                        `;
                } else {
                  formattedHTML = `<div style="font-size:0.93rem;color:#6b7280;background:#f3f4f6;padding:0.6em 0.9em;border-radius:8px;text-align:center;">${data.lastTask}</div>`;
                }
              }
            } else {
              formattedHTML = `<div style="font-size:0.93rem;color:#6b7280;background:#f3f4f6;padding:0.6em 0.9em;border-radius:8px;text-align:center;">No recent tasks found</div>`;
            }
            lastTaskDisplay.innerHTML = formattedHTML;
          }

          resolve();
        } catch (error) {
          document.getElementById('dashboardContent').style.display = 'none';
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'block';
          var errorP = document.querySelector('#error p');
          if (errorP)
            errorP.textContent =
              'Failed to load dashboard data. Please try again later.';
          reject(error);
        }
        delete window[cbName];
        const script = document.getElementById(cbName);
        if (script) script.remove();
      };
      const script = document.createElement('script');
      script.src = dashboardUrl.replace(/callback=[^&]+/, 'callback=' + cbName);
      script.id = cbName;
      document.body.appendChild(script);
    });
  } catch (err) {
    document.getElementById('dashboardContent').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    var errorP = document.querySelector('#error p');
    if (errorP)
      errorP.textContent =
        'Failed to load dashboard data. Please try again later.';
    return;
  }
}

// Initial load: use the new sequence loader
document.addEventListener('DOMContentLoaded', function () {
  const user = JSON.parse(localStorage.getItem('user'));

  // Always set the user's name in the welcome header immediately
  const userNameEl = document.getElementById('userName');
  if (userNameEl && user && user.name) {
    userNameEl.textContent = user.name;
  }

  if (user && user.token) {
    loadDashboardSequence(user.token);
  } else {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    var errorP = document.querySelector('#error p');
    if (errorP) {
      errorP.textContent =
        'Failed to load dashboard data. Please try again later.';
    }
  }
});

// Onboarding copy button logic
document.addEventListener('DOMContentLoaded', function () {
  var copyBtn = document.getElementById('copyAdTextBtn');
  var adText = document.getElementById('onboardingAdText');
  if (copyBtn && adText) {
    copyBtn.onclick = function () {
      adText.select();
      adText.setSelectionRange(0, 99999); // For mobile
      document.execCommand('copy');
      copyBtn.textContent = 'Copied!';
      setTimeout(function () {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Text';
      }, 1500);
    };
  }
});
