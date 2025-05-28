document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize dashboard
    initDashboard();
});

function checkAuth() {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const loginTime = new Date(localStorage.getItem('loginTime'));
    const now = new Date();
    
    // Session expires after 24 hours
    if (now - loginTime > 24 * 60 * 60 * 1000) {
        localStorage.clear();
        return false;
    }
    
    return isLoggedIn;
}

function initDashboard() {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    // Update user info
    document.getElementById('userName').textContent = user.name || 'User';
    document.getElementById('userPhone').textContent = user.phone || '';
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('taskFilter').addEventListener('change', filterTasks);
}

function loadDashboardData() {
    // Fetch dashboard data from your API
    // For now using mock data
    updateDashboard({
        balance: 1500.00,
        todayEarnings: 300.00,
        tasksCompleted: 5,
        totalTasks: 10,
        tasks: [
            {
                id: 1,
                title: 'Post Status',
                payment: 50.00,
                deadline: '2h',
                status: 'pending'
            }
        ]
    });
}

function updateDashboard(data) {
    document.getElementById('availableBalance').textContent = data.balance.toFixed(2);
    document.getElementById('todayEarnings').textContent = data.todayEarnings.toFixed(2);
    document.getElementById('tasksCompleted').textContent = data.tasksCompleted;
    document.getElementById('totalTasks').textContent = data.totalTasks;
    
    renderTasks(data.tasks);
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
