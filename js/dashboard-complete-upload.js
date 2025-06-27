// Completed Task Upload Functionality
const COMPLETED_TASK_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxykW-vc-C5e63OltZCeHv3TZWEnqar__WQvaNQHGYp2Xz4IOgCZbeI0p1YZjzc_DM_/exec';

// Store available tasks data globally
let availableTasksData = [];

// Initialize completed task upload when page loads
document.addEventListener('DOMContentLoaded', function () {
  initializeCompletedTaskUpload();
});

async function initializeCompletedTaskUpload() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const phone = user.phone;

    if (!phone) {
      console.warn('No phone number found for completed task upload');
      return;
    }

    // Load available tasks and populate completed task dropdown
    await loadAvailableTasksForUpload();
    setupCompletedTaskEventListeners();
  } catch (error) {
    console.error('Error initializing completed task upload:', error);
  }
}

async function loadAvailableTasksForUpload() {
  const adSelect = document.getElementById('completedAdSelect');
  const statusDiv = document.getElementById('adSelectionStatus');

  if (!adSelect) return;

  try {
    // Show loading state
    adSelect.innerHTML = '<option value="">Loading available tasks...</option>';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const phone = user.phone;

    if (!phone) {
      throw new Error('Please log in to view tasks');
    }

    // Fetch available tasks from the same API used by main dashboard
    const resp = await fetch(
      'https://script.google.com/macros/s/AKfycbwbXM1XFhg0k1H2VAnbPScR3h5z6pa_Wx9eLCLfez1iIHvDqnmctVFFAqkGFnXzHFun/exec?action=getTasks&phone=' +
        encodeURIComponent(phone)
    );
    const result = await resp.json();

    if (result.success && result.tasks && result.tasks.length > 0) {
      // Store the tasks data globally
      availableTasksData = result.tasks;

      // Remove duplicates by adId (keep first occurrence)
      const seen = new Set();
      const uniqueTasks = result.tasks.filter((task) => {
        const t = parseTask(task);
        if (seen.has(t.adId)) return false;
        seen.add(t.adId);
        return true;
      });

      if (uniqueTasks.length === 0) {
        adSelect.innerHTML =
          '<option value="">No completed tasks available</option>';
        statusDiv.textContent = 'No tasks available for screenshot upload.';
        statusDiv.style.color = '#6b7280';
      } else {
        let optionsHTML =
          '<option value="">Select a completed task...</option>';

        uniqueTasks.forEach((task) => {
          const t = parseTask(task);
          // For completed tasks, we assume all tasks in the API are available for screenshot upload
          optionsHTML += `<option value="${t.adId}">${t.adId}${
            t.title ? ` - ${t.title}` : ''
          }</option>`;
        });

        adSelect.innerHTML = optionsHTML;
        statusDiv.textContent = `${uniqueTasks.length} task(s) available for screenshot upload.`;
        statusDiv.style.color = '#1e977e';
      }
    } else {
      adSelect.innerHTML =
        '<option value="">No completed tasks available</option>';
      statusDiv.textContent = 'No tasks available for screenshot upload.';
      statusDiv.style.color = '#6b7280';
    }
  } catch (error) {
    console.error('Error loading available tasks for upload:', error);
    adSelect.innerHTML = '<option value="">Error loading tasks</option>';
    statusDiv.textContent = 'Failed to load available tasks. Please try again.';
    statusDiv.style.color = '#ef4444';
  }
}

function setupCompletedTaskEventListeners() {
  const adSelect = document.getElementById('completedAdSelect');
  const uploadStep = document.getElementById('screenshotUploadStep');
  const uploadBtn = document.getElementById('completedTaskUploadBtn');
  const cancelBtn = document.getElementById('completedTaskCancelBtn');
  const fileInput = document.getElementById('completedTaskFile');

  // Handle Ad ID selection
  if (adSelect) {
    adSelect.addEventListener('change', function () {
      if (this.value && !this.selectedOptions[0].disabled) {
        uploadStep.style.display = 'block';
      } else {
        uploadStep.style.display = 'none';
        fileInput.value = '';
      }
    });
  }

  // Handle upload button
  if (uploadBtn) {
    uploadBtn.addEventListener('click', handleCompletedTaskUpload);
  }

  // Handle cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      const adSelect = document.getElementById('completedAdSelect');
      const uploadStep = document.getElementById('screenshotUploadStep');
      const fileInput = document.getElementById('completedTaskFile');

      adSelect.value = '';
      uploadStep.style.display = 'none';
      fileInput.value = '';
      updateCompletedTaskStatus('', '');
    });
  }
}

async function handleCompletedTaskUpload() {
  const adSelect = document.getElementById('completedAdSelect');
  const fileInput = document.getElementById('completedTaskFile');
  const uploadBtn = document.getElementById('completedTaskUploadBtn');

  const selectedAdId = adSelect.value;
  const file = fileInput.files[0];

  if (!selectedAdId) {
    updateCompletedTaskStatus('Please select a completed task.', 'error');
    return;
  }

  if (!file) {
    updateCompletedTaskStatus('Please select a screenshot file.', 'error');
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    updateCompletedTaskStatus('Please select a valid image file.', 'error');
    return;
  }

  // Validate file size (5MB limit like the working onboarding upload)
  if (file.size > 5 * 1024 * 1024) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    updateCompletedTaskStatus(
      `File too large (${fileSizeMB}MB). Maximum size is 5MB. Please compress your image.`,
      'error'
    );
    return;
  }

  try {
    // Show uploading state
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    uploadBtn.disabled = true;

    updateCompletedTaskStatus('Uploading screenshot...', 'info');

    // Get user phone
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const phone = user.phone;

    if (!phone) {
      throw new Error('Please log in to upload screenshots.');
    }

    // Use the same upload method as the working onboarding upload
    await handleCompletedTaskScreenshotUpload(
      file,
      phone,
      selectedAdId,
      updateCompletedTaskStatus
    );
  } catch (error) {
    console.error('Upload error:', error);
    updateCompletedTaskStatus(`Upload failed: ${error.message}`, 'error');
  } finally {
    // Reset button
    uploadBtn.innerHTML =
      '<i class="fas fa-cloud-upload-alt"></i> <span data-translate="upload-btn">Upload</span>';
    uploadBtn.disabled = false;
  }
}

// New function based on the working handleScreenshotUpload but for completed tasks
async function handleCompletedTaskScreenshotUpload(
  file,
  phone,
  adId,
  statusCallback
) {
  try {
    if (!file) throw new Error('Please select a screenshot to upload.');
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      throw new Error('Only JPG, PNG, or GIF images are allowed.');
    }
    if (file.size > 5 * 1024 * 1024)
      throw new Error('File size exceeds 5MB limit.');

    statusCallback('Uploading screenshot...', 'info');

    const base64Data = await readFileAsBase64(file);
    const base64Content = base64Data.split(',')[1];
    const timestamp = getTimestampString();
    const filename = `completed_task_${adId}_${phone.slice(-10)}_${timestamp}.${
      file.name.split('.').pop() || 'png'
    }`;

    // Use the same approach as the working onboarding upload but with additional parameters
    const response = await fetch(COMPLETED_TASK_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        phone: phone,
        adId: adId,
        base64Data: base64Content,
        contentType: file.type,
        filename: filename,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      statusCallback('Screenshot uploaded successfully!', 'success');

      // Reset form
      const adSelect = document.getElementById('completedAdSelect');
      const fileInput = document.getElementById('completedTaskFile');

      if (adSelect) adSelect.value = '';
      const uploadStep = document.getElementById('screenshotUploadStep');
      if (uploadStep) uploadStep.style.display = 'none';
      if (fileInput) fileInput.value = '';

      // Reload available Ad IDs to reflect the upload
      setTimeout(() => {
        loadAvailableTasksForUpload();
      }, 1000);
    } else if (result.alreadyUploaded) {
      statusCallback(
        'You have already uploaded a screenshot for this task. Please wait for verification.',
        'warning'
      );
    } else {
      throw new Error(result.message || 'Upload failed');
    }

    return result;
  } catch (err) {
    statusCallback(err.message || 'Upload failed', 'error');
    throw err;
  }
}

function updateCompletedTaskStatus(message, type) {
  const statusDiv = document.getElementById('completedTaskUploadStatus');
  if (!statusDiv) return;

  statusDiv.textContent = message;

  // Set color based on type
  switch (type) {
    case 'success':
      statusDiv.style.color = '#1e977e';
      break;
    case 'error':
      statusDiv.style.color = '#ef4444';
      break;
    case 'warning':
      statusDiv.style.color = '#f59e0b';
      break;
    case 'info':
      statusDiv.style.color = '#3b82f6';
      break;
    default:
      statusDiv.style.color = '#6b7280';
  }

  // Clear message after 5 seconds for non-error messages
  if (type !== 'error') {
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 5000);
  }
}

// Helper function to update completed task dropdown when main tasks are refreshed
function updateCompletedTaskDropdown(tasks) {
  const adSelect = document.getElementById('completedAdSelect');
  const statusDiv = document.getElementById('adSelectionStatus');

  if (!adSelect) return;

  if (tasks && tasks.length > 0) {
    let optionsHTML = '<option value="">Select a completed task...</option>';

    tasks.forEach((task) => {
      const t = parseTask(task);
      optionsHTML += `<option value="${t.adId}">${t.adId}${
        t.title ? ` - ${t.title}` : ''
      }</option>`;
    });

    adSelect.innerHTML = optionsHTML;
    if (statusDiv) {
      statusDiv.textContent = `${tasks.length} task(s) available for screenshot upload.`;
      statusDiv.style.color = '#1e977e';
    }
  } else {
    adSelect.innerHTML =
      '<option value="">No completed tasks available</option>';
    if (statusDiv) {
      statusDiv.textContent = 'No tasks available for screenshot upload.';
      statusDiv.style.color = '#6b7280';
    }
  }
}
