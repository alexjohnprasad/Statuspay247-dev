// Function to load/refresh available tasks
async function loadAvailableTasks() {
  const tasksContainer = document.querySelector('.available-tasks-container');
  if (!tasksContainer) return;

  tasksContainer.innerHTML =
    '<div style="padding:2em;text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading tasks...</div>';

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const phone = user.phone;

    if (!phone) {
      tasksContainer.innerHTML =
        '<div style="padding:2em;text-align:center;color:#e74c3c;">Please log in to view tasks.</div>';
      return;
    }

    const resp = await fetch(
      'https://script.google.com/macros/s/AKfycbwbXM1XFhg0k1H2VAnbPScR3h5z6pa_Wx9eLCLfez1iIHvDqnmctVFFAqkGFnXzHFun/exec?action=getTasks&phone=' +
        encodeURIComponent(phone)
    );
    const result = await resp.json();

    if (result.success && result.tasks && result.tasks.length > 0) {
      // Remove duplicates by adId (keep first occurrence)
      const seen = new Set();
      const uniqueTasks = result.tasks.filter((task) => {
        const t = parseTask(task);
        if (seen.has(t.adId)) return false;
        seen.add(t.adId);
        return true;
      });
      tasksContainer.innerHTML = uniqueTasks.map(renderTaskCard).join('');

      // Also update completed task upload dropdown if it exists
      if (document.getElementById('completedAdSelect')) {
        updateCompletedTaskDropdown(uniqueTasks);
      }
    } else {
      tasksContainer.innerHTML =
        '<div style="padding:2em;text-align:center;">No available tasks right now.</div>';

      // Clear completed task dropdown if no tasks
      if (document.getElementById('completedAdSelect')) {
        const adSelect = document.getElementById('completedAdSelect');
        const statusDiv = document.getElementById('adSelectionStatus');
        adSelect.innerHTML =
          '<option value="">No completed tasks available</option>';
        if (statusDiv) {
          statusDiv.textContent = 'No tasks available for screenshot upload.';
          statusDiv.style.color = '#6b7280';
        }
      }
    }
  } catch (e) {
    console.error('Error loading tasks:', e);
    tasksContainer.innerHTML =
      '<div style="padding:2em;text-align:center;color:#e74c3c;">Failed to load tasks. Please try again.</div>';
  }
}

// Load tasks immediately on page load
document.addEventListener('DOMContentLoaded', async function () {
  await loadAvailableTasks();

  // Add event listener for refresh button
  const refreshBtn = document.querySelector('.refresh-tasks-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async function () {
      // Show loading state on button
      const originalHTML = this.innerHTML;
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      this.disabled = true;

      try {
        await loadAvailableTasks();

        // Show success feedback briefly
        this.innerHTML = '<i class="fas fa-check"></i> Refreshed';
        setTimeout(() => {
          this.innerHTML = originalHTML;
          this.disabled = false;
        }, 1000);
      } catch (error) {
        // Show error feedback briefly
        this.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
        setTimeout(() => {
          this.innerHTML = originalHTML;
          this.disabled = false;
        }, 2000);
      }
    });
  }
});

// Helper function to download media files
async function downloadMedia(url, filename, adId) {
  try {
    // Show loading state
    const downloadBtn = document.querySelector(`[data-download-id="${adId}"]`);
    if (downloadBtn) {
      const originalText = downloadBtn.innerHTML;
      downloadBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Downloading...';
      downloadBtn.disabled = true;

      // Fetch the file
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');

      const blob = await response.blob();

      // Determine file extension from URL or content type
      let extension = '';
      const urlExtension = url.split('.').pop().split('?')[0].toLowerCase();
      if (
        [
          'jpg',
          'jpeg',
          'png',
          'gif',
          'webp',
          'mp4',
          'webm',
          'mov',
          'avi',
        ].includes(urlExtension)
      ) {
        extension = '.' + urlExtension;
      } else {
        // Fallback to content type
        const contentType = response.headers.get('content-type');
        if (contentType) {
          if (contentType.includes('image/jpeg')) extension = '.jpg';
          else if (contentType.includes('image/png')) extension = '.png';
          else if (contentType.includes('image/gif')) extension = '.gif';
          else if (contentType.includes('image/webp')) extension = '.webp';
          else if (contentType.includes('video/mp4')) extension = '.mp4';
          else if (contentType.includes('video/webm')) extension = '.webm';
          else if (contentType.includes('video/quicktime')) extension = '.mov';
        }
      }

      // Create download
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename + extension;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      // Reset button
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;

      // Show success message briefly
      downloadBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
      setTimeout(() => {
        downloadBtn.innerHTML = originalText;
      }, 2000);
    }
  } catch (error) {
    console.error('Download failed:', error);

    // Reset button and show error
    const downloadBtn = document.querySelector(`[data-download-id="${adId}"]`);
    if (downloadBtn) {
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
      downloadBtn.disabled = false;

      // Show error briefly
      downloadBtn.innerHTML =
        '<i class="fas fa-exclamation-triangle"></i> Failed';
      setTimeout(() => {
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
      }, 2000);
    }

    // Fallback: try opening in new tab
    try {
      window.open(url, '_blank');
    } catch (fallbackError) {
      alert(
        'Download failed. Please try right-clicking the download button and selecting "Save link as..."'
      );
    }
  }
}

// Function to mark a task as posted
async function markTaskAsPosted(adId, rowNumber, buttonElement) {
  try {
    // Show loading state on button
    const originalHTML = buttonElement.innerHTML;
    buttonElement.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Marking...';
    buttonElement.disabled = true;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const phone = user.phone;

    if (!phone) {
      throw new Error('Please log in to mark tasks.');
    }

    // Make API call to mark task as posted
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbwbXM1XFhg0k1H2VAnbPScR3h5z6pa_Wx9eLCLfez1iIHvDqnmctVFFAqkGFnXzHFun/exec?action=markTaskPosted&phone=${encodeURIComponent(
        phone
      )}&adId=${encodeURIComponent(adId)}&rowNumber=${encodeURIComponent(
        rowNumber
      )}`
    );

    const result = await response.json();

    if (result.success) {
      // Show success feedback
      buttonElement.innerHTML = '<i class="fas fa-check"></i> Posted!';
      buttonElement.style.background = '#27ae60';

      // Remove the task card from the UI after a short delay
      setTimeout(() => {
        const taskCard = buttonElement.closest('.task-item');
        if (taskCard) {
          taskCard.style.transition = 'opacity 0.3s ease';
          taskCard.style.opacity = '0';
          setTimeout(() => {
            taskCard.remove();

            // Check if there are any tasks left
            const tasksContainer = document.querySelector(
              '.available-tasks-container'
            );
            const remainingTasks =
              tasksContainer.querySelectorAll('.task-item');
            if (remainingTasks.length === 0) {
              tasksContainer.innerHTML =
                '<div style="padding:2em;text-align:center;">No available tasks right now.</div>';
            }
          }, 300);
        }
      }, 1500);
    } else {
      throw new Error(result.message || 'Failed to mark task as posted');
    }
  } catch (error) {
    console.error('Error marking task as posted:', error);

    // Show error feedback
    buttonElement.innerHTML =
      '<i class="fas fa-exclamation-triangle"></i> Error';
    buttonElement.style.background = '#e74c3c';

    // Reset button after delay
    setTimeout(() => {
      buttonElement.innerHTML = 'Mark as Posted';
      buttonElement.style.background = '';
      buttonElement.disabled = false;
    }, 2000);
  }
}

// Helper: Parse task string if needed
function parseTask(task) {
  // If mediaType is empty and caption contains '|||', parse it
  if (
    (!task.mediaType || !task.mediaType.trim()) &&
    typeof task.caption === 'string' &&
    task.caption.includes('|||')
  ) {
    const parts = task.caption.split('|||').map((s) => s.trim());
    // [adId, title, caption, mediaType, mediaUrl]
    return {
      adId: parts[0] || task.adId || '',
      title: parts[1] || '',
      caption: parts[2] || '',
      mediaType: (parts[3] || '').trim(),
      mediaUrl: (parts[4] || '').trim(),
      rowNumber: task.rowNumber,
    };
  }
  // Already parsed
  return {
    adId: task.adId,
    title: task.title || '',
    caption: task.caption,
    mediaType: task.mediaType,
    mediaUrl: task.mediaUrl,
    rowNumber: task.rowNumber,
  };
}

function renderTaskCard(task) {
  const t = parseTask(task);
  let html = '';
  // Redesigned task card UI
  if (t.mediaType === 'Image') {
    html = `
        <div class="task-item redesigned-task-card">
          <div class="task-media">
            <img src="${
              t.mediaUrl
            }" alt="Task Image" class="task-media-img" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNNTAgNDBhMTAgMTAgMCAxIDAgMCAyMCAxMCAxMCAwIDAgMCAwLTIweiIgZmlsbD0iIzljYTNhZiIvPjwvc3ZnPg==';">
          </div>
          <div class="task-main">
            <div class="task-header">
              <div class="task-title">${
                t.title ? t.title : 'Image Task'
              } <span class="task-id">#${t.adId}</span></div>
              <div class="task-type-badge image">Image</div>
            </div>
            <div class="task-caption">${t.caption}</div>
            <div class="task-actions">
              <button class="btn-primary task-download-btn" data-download-id="${
                t.adId
              }" type="button" onclick="downloadMedia('${t.mediaUrl}', '${
      t.adId
    }_image', '${t.adId}')"><i class="fas fa-download"></i> Download</button>
              <button class="btn-secondary task-copy-btn" type="button" onclick="navigator.clipboard.writeText(\`${t.caption.replace(
                /`/g,
                '\\`'
              )}\`);this.textContent='Copied!';setTimeout(()=>this.innerHTML='<i class=\\'fas fa-copy\\'></i> Copy Caption',1200);"><i class="fas fa-copy"></i> Copy Caption</button>
            </div>
          </div>
          <div class="task-side">
            <button class="task-action-btn" type="button" onclick="markTaskAsPosted('${
              t.adId
            }',${t.rowNumber},this)">Mark as Posted</button>
          </div>
        </div>
      `;
  } else if (t.mediaType === 'Video') {
    html = `
        <div class="task-item redesigned-task-card">
          <div class="task-media">
            <video src="${
              t.mediaUrl
            }" controls class="task-media-video" preload="metadata"></video>
          </div>
          <div class="task-main">
            <div class="task-header">
              <div class="task-title">${
                t.title ? t.title : 'Video Task'
              } <span class="task-id">#${t.adId}</span></div>
              <div class="task-type-badge video">Video</div>
            </div>
            <div class="task-caption">${t.caption}</div>
            <div class="task-actions">
              <button class="btn-primary task-download-btn" data-download-id="${
                t.adId
              }" type="button" onclick="downloadMedia('${t.mediaUrl}', '${
      t.adId
    }_video', '${t.adId}')"><i class="fas fa-download"></i> Download</button>
              <button class="btn-secondary task-copy-btn" type="button" onclick="navigator.clipboard.writeText(\`${t.caption.replace(
                /`/g,
                '\\`'
              )}\`);this.textContent='Copied!';setTimeout(()=>this.innerHTML='<i class=\\'fas fa-copy\\'></i> Copy Caption',1200);"><i class="fas fa-copy"></i> Copy Caption</button>
            </div>
          </div>
          <div class="task-side">
            <button class="task-action-btn" type="button" onclick="markTaskAsPosted('${
              t.adId
            }',${t.rowNumber},this)">Mark as Posted</button>
          </div>
        </div>
      `;
  } else if (t.mediaType === 'Text' || (!t.mediaType && t.caption)) {
    html = `
        <div class="task-item redesigned-task-card">
          <div class="task-media text">
            <i class="fas fa-align-left"></i>
          </div>
          <div class="task-main">
            <div class="task-header">
              <div class="task-title">${
                t.title ? t.title : 'Text Task'
              } <span class="task-id">#${t.adId}</span></div>
              <div class="task-type-badge text">Text</div>
            </div>
            <div class="task-caption">${t.caption}</div>
            <div class="task-actions">
              <button class="btn-secondary task-copy-btn" type="button" onclick="navigator.clipboard.writeText(\`${t.caption.replace(
                /`/g,
                '\\`'
              )}\`);this.textContent='Copied!';setTimeout(()=>this.innerHTML='<i class=\\'fas fa-copy\\'></i> Copy Text',1200);"><i class="fas fa-copy"></i> Copy Text</button>
            </div>
          </div>
          <div class="task-side">
            <button class="task-action-btn" type="button" onclick="markTaskAsPosted('${
              t.adId
            }',${t.rowNumber},this)">Mark as Posted</button>
          </div>
        </div>
      `;
  }
  return html;
}
