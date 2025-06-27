// Updated onboarding screenshot upload logic (using iframe like dashboard)
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('onboardingScreenshotForm');
  var fileInput = document.getElementById('onboardingScreenshotFile');
  var statusDiv = document.getElementById('onboardingScreenshotStatus');

  if (form && fileInput && statusDiv) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      statusDiv.style.color = 'var(--primary-color)';
      statusDiv.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Reading file...';

      if (!fileInput.files.length) {
        statusDiv.textContent = 'Please select a screenshot to upload.';
        statusDiv.style.color = '#e74c3c';
        return;
      }
      var file = fileInput.files[0];
      var allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.indexOf(file.type) === -1) {
        statusDiv.textContent = 'Only JPG, PNG, or GIF images are allowed.';
        statusDiv.style.color = '#e74c3c';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        statusDiv.textContent = 'File size exceeds 5MB limit.';
        statusDiv.style.color = '#e74c3c';
        return;
      }

      // Always get phone from localStorage at submit time
      var user = null;
      try {
        user = JSON.parse(localStorage.getItem('user'));
      } catch (err) {
        user = null;
      }
      var phone = user && user.phone ? user.phone : '';
      if (!phone) {
        statusDiv.textContent =
          'Could not determine your phone number. Please log in again.';
        statusDiv.style.color = '#e74c3c';
        return;
      }

      try {
        // Use the same handleScreenshotUpload function as dashboard
        await handleScreenshotUpload(file, phone, statusDiv);
      } catch (err) {
        // Error already handled in handleScreenshotUpload
      }
    });
  }
});

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getTimestampString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
}

// Screenshot upload handler
async function handleScreenshotUpload(file, phone, statusElement) {
  try {
    if (!file) throw new Error('Please select a screenshot to upload.');
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      throw new Error('Only JPG, PNG, or GIF images are allowed.');
    }
    if (file.size > 5 * 1024 * 1024)
      throw new Error('File size exceeds 5MB limit.');

    statusElement.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    statusElement.style.color = 'var(--primary-color)';

    const base64Data = await readFileAsBase64(file);
    const base64Content = base64Data.split(',')[1];
    const timestamp = getTimestampString();
    const filename = `${phone.slice(-10)}_${timestamp}.${
      file.name.split('.').pop() || 'png'
    }`;

    const SCRIPT_URL =
      'https://script.google.com/macros/s/AKfycbxp23JcJ69LiuJ0ks0M7Z0YLU-OPDpfVWQqDwLCtN2AjDCWhx_mwP52-GnOSfpq764SPQ/exec';

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        phone: phone,
        base64Data: base64Content,
        contentType: file.type,
        filename: filename,
      }),
    });

    const result = await response.json();

    if (result.success) {
      statusElement.innerHTML =
        '<i class="fas fa-check-circle"></i> Screenshot uploaded successfully!';
      statusElement.style.color = 'var(--primary-color)';
    } else {
      throw new Error(result.message || 'Upload failed');
    }

    return result;
  } catch (err) {
    statusElement.textContent = err.message || 'Upload failed';
    statusElement.style.color = '#e74c3c';
    throw err;
  }
}

// Add event listener for dashboard upload button
document.addEventListener('DOMContentLoaded', function () {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('uploadFile');
  const statusDiv = document.getElementById('uploadStatusMessage');

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', async function () {
      if (!fileInput.files.length) {
        if (statusDiv) {
          statusDiv.textContent = 'Please select a file first';
          statusDiv.style.color = '#e74c3c';
        }
        return;
      }

      // Get user phone from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const phone = user.phone;

      if (!phone) {
        if (statusDiv) {
          statusDiv.textContent = 'Please log in again';
          statusDiv.style.color = '#e74c3c';
        }
        return;
      }

      try {
        await handleScreenshotUpload(fileInput.files[0], phone, statusDiv);
      } catch (err) {
        if (statusDiv) {
          statusDiv.textContent = err.message || 'Upload failed';
          statusDiv.style.color = '#e74c3c';
        }
      }
    });
  }
});
