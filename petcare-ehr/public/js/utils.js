const API_URL = 'http://localhost:3000/api';

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = { method, headers: getHeaders() };
        if (body) options.body = JSON.stringify(body);
        
        const res = await fetch(API_URL + endpoint, options);
        const data = await res.json();
        
        if (!res.ok) {
            if (res.status === 403) {
                logout();
            }
            throw new Error(data.error || 'API Error');
        }
        return data;
    } catch (err) {
        throw err;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}

function showAlert(id, msg, type = 'success') {
    const container = document.getElementById(id);
    if (!container) return;
    const div = document.createElement('div');
    div.className = `alert ${type}`;
    div.textContent = msg;
    container.insertBefore(div, container.firstChild);
    setTimeout(() => div.remove(), 5000);
}

function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
    if (e.target.classList.contains('close-btn')) {
        e.target.closest('.modal').classList.remove('active');
    }
});

function formatDate(d) {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getBadge(status) {
    const badges = {
        'available_for_adoption': 'Available',
        'with_owner': 'With Owner',
        'adopted': 'Adopted',
        'pending': 'Pending',
        'completed': 'Completed',
        'overdue': 'Overdue',
        'scheduled': 'Scheduled',
        'missed': 'Missed'
    };
    const classes = {
        'available_for_adoption': 'available',
        'with_owner': 'with-owner',
        'adopted': 'adopted',
        'pending': 'pending',
        'completed': 'completed',
        'overdue': 'overdue'
    };
    return `<span class="status-badge ${classes[status] || 'available'}">${badges[status] || status}</span>`;
}

function loadUserInfo() {
    const name = localStorage.getItem('userName') || 'User';
    const avatar = document.querySelector('.user-avatar');
    const userP = document.querySelector('.user-info p');
    if (avatar) avatar.textContent = name[0].toUpperCase();
    if (userP) userP.textContent = name;
}

function showSection(name) {
    document.querySelectorAll('.section-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(el => el.classList.remove('active'));
    const section = document.getElementById(name + '-section');
    if (section) section.classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

window.addEventListener('load', () => {
    checkAuth();
    loadUserInfo();
});