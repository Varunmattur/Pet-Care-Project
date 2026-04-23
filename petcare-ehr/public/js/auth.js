const API_URL = 'http://localhost:3000/api';

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tab + '-tab').classList.add('active');
    event.target.classList.add('active');
}

function toggleForm(role, type) {
    const login = document.getElementById(role + '-login-form');
    const signup = document.getElementById(role + '-signup-form');
    const loginBtn = document.querySelector(`#${role}-tab .toggle-btn:first-child`);
    const signupBtn = document.querySelector(`#${role}-tab .toggle-btn:last-child`);

    if (type === 'login') {
        login.classList.add('active');
        signup.classList.remove('active');
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        login.classList.remove('active');
        signup.classList.add('active');
        loginBtn.classList.remove('active');
        signupBtn.classList.add('active');
    }
}

function showMsg(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = type;
}

async function ownerLogin(e) {
    e.preventDefault();
    const [email, password] = e.target;
    try {
        const res = await fetch(`${API_URL}/auth/owner/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value, password: password.value })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userEmail', data.userEmail);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userType', 'owner');
            window.location.href = '/dashboard/owner.html';
        } else {
            showMsg('owner-login-msg', data.error, 'error');
        }
    } catch (err) {
        showMsg('owner-login-msg', 'Error: ' + err.message, 'error');
    }
}

async function ownerSignup(e) {
    e.preventDefault();
    const [name, email, phone, address, location, password] = e.target;
    if (password.value.length < 6) {
        showMsg('owner-signup-msg', 'Password must be 6+ characters', 'error');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/auth/owner/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.value,
                email: email.value,
                phone: phone.value,
                address: address.value,
                location: location.value,
                password: password.value
            })
        });
        const data = await res.json();
        if (data.success) {
            showMsg('owner-signup-msg', 'Account created! Please login.', 'success');
            setTimeout(() => toggleForm('owner', 'login'), 1500);
            e.target.reset();
        } else {
            showMsg('owner-signup-msg', data.error, 'error');
        }
    } catch (err) {
        showMsg('owner-signup-msg', 'Error: ' + err.message, 'error');
    }
}

async function adopterLogin(e) {
    e.preventDefault();
    const [email, password] = e.target;
    try {
        const res = await fetch(`${API_URL}/auth/adopter/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value, password: password.value })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userEmail', data.userEmail);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userType', 'adopter');
            window.location.href = '/dashboard/adopter.html';
        } else {
            showMsg('adopter-login-msg', data.error, 'error');
        }
    } catch (err) {
        showMsg('adopter-login-msg', 'Error: ' + err.message, 'error');
    }
}

async function adopterSignup(e) {
    e.preventDefault();
    const [name, email, phone, address, agency, location, password] = e.target;
    if (password.value.length < 6) {
        showMsg('adopter-signup-msg', 'Password must be 6+ characters', 'error');
        return;
    }
    try {
        const res = await fetch(`${API_URL}/auth/adopter/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.value,
                email: email.value,
                phone: phone.value,
                address: address.value,
                agency_name: agency.value,
                location: location.value,
                password: password.value
            })
        });
        const data = await res.json();
        if (data.success) {
            showMsg('adopter-signup-msg', 'Account created! Please login.', 'success');
            setTimeout(() => toggleForm('adopter', 'login'), 1500);
            e.target.reset();
        } else {
            showMsg('adopter-signup-msg', data.error, 'error');
        }
    } catch (err) {
        showMsg('adopter-signup-msg', 'Error: ' + err.message, 'error');
    }
}

async function vetLogin(e) {
    e.preventDefault();
    const [email, password] = e.target;
    try {
        const res = await fetch(`${API_URL}/auth/vet/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value, password: password.value })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userType', 'vet');
            window.location.href = '/dashboard/vet.html';
        } else {
            showMsg('vet-login-msg', data.error, 'error');
        }
    } catch (err) {
        showMsg('vet-login-msg', 'Error: ' + err.message, 'error');
    }
}