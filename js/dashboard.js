/**
 * Fetches and displays assigned tasks for the logged in user
 */
async function refreshTasks() {
  const refreshBtn = document.querySelector('.refresh-tasks-btn');
  const tasksContainer = document.querySelector('.available-tasks-container');
  
  try {
    // Show loading state
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing';
    refreshBtn.disabled = true;
    tasksContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading tasks...</p></div>';

    // Get user phone from secure storage
    let user;
    try {
      const secureStorage = await import('./secureStorage.js');
      user = await secureStorage.default.getItem('user');
      if (!user?.phone) throw new Error('User phone not found');
      console.log('User data loaded:', user.phone);
    } catch (error) {
      console.error('Secure storage error:', error);
      throw new Error('Failed to load user data');
    }

    // Fetch tasks from AppScript
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbywl4LxL8sUD0WkZypEixDDIAQisCObavoSmt79qBKXOuYYYuRVePKnnv1NTL_hC2ZazA/exec';
    let response, result;
    try {
      response = await fetch(`${SCRIPT_URL}?phone=${user.phone}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to load tasks');
      console.log('Tasks loaded successfully:', result.tasks.length);
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error('Network error - please try again later');
    }

    // Display tasks
    if (result.tasks.length === 0) {
      tasksContainer.innerHTML = '<div class="no-tasks">No tasks available at this time</div>';
      return;
    }

    tasksContainer.innerHTML = result.tasks.map(task => `
      <div class="task-item">
        <div class="task-icon available">
          <i class="fab fa-whatsapp"></i>
        </div>
        <div class="task-details">
          <div class="task-title">${task.adId}</div>
          <div class="task-subtitle">${task.caption}</div>
          ${task.mediaType === 'image' ? 
            `<img src="${task.mediaUrl}" class="task-media-preview">` : ''}
        </div>
        <div class="task-actions">
          <a href="${task.whatsappLink}" target="_blank" class="task-action-btn">
            <i class="fab fa-whatsapp"></i> Start Task
          </a>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    tasksContainer.innerHTML = `
      <div class="error-container">
        <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <p>${error.message}</p>
      </div>
    `;
    console.error('Task refresh failed:', error);
  } finally {
    refreshBtn.innerHTML = '<i class="fas fa-refresh"></i> Refresh';
    refreshBtn.disabled = false;
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication via secure storage
  const secureStorage = await import('./secureStorage.js');
  const user = await secureStorage.default.getItem('user');
  
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize task refresh
  const refreshBtn = document.querySelector('.refresh-tasks-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshTasks);
  }

  // Load initial tasks
  await refreshTasks();
});
