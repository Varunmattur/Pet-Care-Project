async function loadPets() {
    try {
        const data = await apiCall('/owner/pets');
        const container = document.getElementById('pets-container');
        container.innerHTML = '';
        
        if (!data.pets.length) {
            container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#64748b;padding:40px;">No pets registered yet.</p>';
            return;
        }
        
        data.pets.forEach(pet => {
            const card = document.createElement('div');
            card.className = 'card pet-card';
            const btn = pet.available_for_adoption 
                ? '<span class="status-badge available">Available for Adoption</span>'
                : `<button class="btn btn-primary" style="margin-top:10px;" onclick="markAdoption(${pet.pet_id})">Mark for Adoption</button>`;
            card.innerHTML = `
                <h3>${pet.pet_name}</h3>
                <p><strong>Type:</strong> ${pet.species}</p>
                <p><strong>Breed:</strong> ${pet.breed || 'Mixed'}</p>
                <p><strong>Age:</strong> ${pet.age || '?'} years</p>
                <p><strong>Color:</strong> ${pet.color || 'Unknown'}</p>
                ${btn}
                <button class="btn btn-secondary" style="margin-top:10px;width:100%;" onclick="viewPet(${pet.pet_id})">View Details</button>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

async function viewPet(id) {
    try {
        const data = await apiCall(`/owner/pet/${id}`);
        const pet = data.pet;
        let html = `
            <div style="background:#f8fafc;padding:15px;border-radius:6px;margin-bottom:20px;">
                <h3>${pet.pet_name}</h3>
                <p><strong>Species:</strong> ${pet.species}</p>
                <p><strong>Weight:</strong> ${pet.weight || 'N/A'} kg</p>
                <p><strong>Blood Type:</strong> ${pet.blood_type || 'N/A'}</p>
                <p><strong>DOB:</strong> ${formatDate(pet.date_of_birth)}</p>
            </div>
            <h4>Medical History</h4>
        `;
        if (!data.medicalRecords.length) {
            html += '<p style="color:#64748b;">No records.</p>';
        } else {
            html += '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Date</th><th>Diagnosis</th><th>Treatment</th><th>Vet</th></tr></thead><tbody>';
            data.medicalRecords.forEach(r => {
                html += `<tr><td>${formatDate(r.visit_date)}</td><td>${r.diagnosis}</td><td>${r.treatment}</td><td>${r.vet_name}</td></tr>`;
            });
            html += '</tbody></table></div>';
        }
        html += '<h4 style="margin-top:20px;">Vaccinations</h4>';
        if (!data.vaccAlerts.length) {
            html += '<p style="color:#64748b;">None.</p>';
        } else {
            html += '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Vaccine</th><th>Next</th><th>Status</th></tr></thead><tbody>';
            data.vaccAlerts.forEach(v => {
                html += `<tr><td>${v.vaccination_type}</td><td>${formatDate(v.next_date)}</td><td>${getBadge(v.status)}</td></tr>`;
            });
            html += '</tbody></table></div>';
        }
        document.getElementById('pet-detail').innerHTML = html;
        showModal('pet-modal');
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

async function markAdoption(id) {
    if (!confirm('Mark for adoption?')) return;
    try {
        const res = await apiCall(`/owner/pet/${id}/mark-adoption`, 'PUT');
        if (res.success) {
            showAlert('alerts', 'Pet marked for adoption!', 'success');
            loadPets();
        }
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

// Removed showAddPetModal function
// Removed add-pet-form event listener

async function loadVets() {
    try {
        const location = document.getElementById('vet-location-filter')?.value;
        let url = '/owner/veterinarians';
        if (location) url += '?location=' + location;
        const data = await apiCall(url);
        const container = document.getElementById('vets-container');
        container.innerHTML = '';
        
        if (!data.vets.length) {
            container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#64748b;padding:40px;">No veterinarians found.</p>';
            return;
        }
        
        data.vets.forEach(v => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<h3>${v.vet_name}</h3><p><strong>Clinic:</strong> ${v.clinic_name}</p><p><strong>Location:</strong> ${v.location}</p><p><strong>Phone:</strong> ${v.phone}</p>`;
            container.appendChild(card);
        });
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

async function loadProducts() {
    try {
        const data = await apiCall('/owner/products');
        const container = document.getElementById('products-container');
        container.innerHTML = '';
        
        if (!data.products || !data.products.length) {
            container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#64748b;padding:40px;">No products available.</p>';
            return;
        }
        
        data.products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div style="height:200px;background:#f0f0f0;border-radius:6px;margin-bottom:10px;overflow:hidden;">
                    <img src="${p.image_url || '/images/placeholder.png'}" alt="${p.product_name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/images/placeholder.png'">
                </div>
                <h3>${p.product_name}</h3>
                <p><strong>Category:</strong> ${p.category}</p>
                <p><strong>Price:</strong> $${parseFloat(p.price).toFixed(2)}</p>
                <a href="${p.amazon_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="display:block;text-align:center;margin-top:10px;text-decoration:none;">Buy on Amazon</a>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        showAlert('alerts', 'Error loading products: ' + err.message, 'error');
    }
}

window.addEventListener('load', () => {
    loadPets();
    loadProducts();
});
// Add these functions to the VERY END of js/owner-dashboard.js
function toggleChat() {
    const win = document.getElementById('ai-window');
    win.style.display = win.style.display === 'none' ? 'flex' : 'none';
}

async function sendMsg() {
    const input = document.getElementById('ai-input');
    const body = document.getElementById('chat-body');
    const typing = document.getElementById('typing-indicator');
    const text = input.value.trim();
    
    if (!text) return;

    // 1. Add User Message (WhatsApp Style)
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    body.innerHTML += `
        <div style="align-self:flex-end; background:#dcf8c6; padding:10px; border-radius:12px; max-width:80%; font-size:14px; position:relative; box-shadow: 0 1px 1px rgba(0,0,0,0.1);">
            ${text} <br><small style="font-size:10px; color:gray; display:block; text-align:right; margin-top:4px;">${time}</small>
        </div>`;
    
    input.value = '';
    typing.style.display = 'block'; // Show typing dots
    body.scrollTop = body.scrollHeight;

    try {
        // IMPORTANT: Using your project's apiCall to include the JWT Token
        const data = await apiCall('/ai/chat', 'POST', { message: text });
        
        typing.style.display = 'none';

        // 2. Add AI Response (WhatsApp Style)
        body.innerHTML += `
            <div style="align-self:flex-start; background:white; padding:10px; border-radius:12px; max-width:80%; font-size:14px; border:1px solid #ddd; box-shadow: 0 1px 1px rgba(0,0,0,0.1);">
                ${data.reply} <br><small style="font-size:10px; color:gray; display:block; text-align:right; margin-top:4px;">${time}</small>
            </div>`;
        body.scrollTop = body.scrollHeight;
    } catch (err) {
        typing.style.display = 'none';
        body.innerHTML += `<p style="color:red; font-size:12px; text-align:center;">⚠️ Connection lost. Ensure server is running.</p>`;
        console.error("AI Error:", err);
    }
}