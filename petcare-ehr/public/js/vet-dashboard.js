// =====================================================
// vet-dashboard.js - COMPLETE Veterinarian Dashboard
// =====================================================

let currentPet = null;

// =====================================================
// SEARCH BY OWNER EMAIL
// =====================================================

async function searchEmail() {
    const email = document.getElementById('email-input')?.value.trim();
    if (!email) {
        showAlert('alerts', 'Please enter owner email', 'error');
        return;
    }
    
    try {
        const data = await apiCall(`/vet/search-pets-by-email/${email}`);
        const container = document.getElementById('search-results');
        container.innerHTML = '';
        
        if (!data.pets || data.pets.length === 0) {
            container.innerHTML = '<p style="color:#64748b;">No pets found for this email.</p>';
            return;
        }
        
        const heading = document.createElement('h3');
        heading.textContent = `Found ${data.pets.length} pet(s) for ${email}`;
        heading.style.marginBottom = '15px';
        container.appendChild(heading);
        
        const grid = document.createElement('div');
        grid.className = 'content-grid';
        
        data.pets.forEach(pet => {
            const card = document.createElement('div');
            card.className = 'card pet-card';
            card.style.cursor = 'pointer';
            card.onclick = () => loadPetProfile(pet.pet_id);
            
            card.innerHTML = `
                <h3>${pet.pet_name}</h3>
                <p><strong>Type:</strong> ${pet.species}</p>
                <p><strong>Breed:</strong> ${pet.breed || 'Not specified'}</p>
                <p><strong>Age:</strong> ${pet.age || 'Unknown'} years</p>
                <p><strong>Color:</strong> ${pet.color || 'Not specified'}</p>
                <p><strong>Microchip:</strong> ${pet.microchip_id || 'Not registered'}</p>
                <button class="btn btn-primary" style="width:100%;margin-top:10px;">View Full Profile</button>
            `;
            
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

// =====================================================
// SEARCH BY PET ID
// =====================================================

async function searchID() {
    const id = document.getElementById('id-input')?.value.trim();
    if (!id) {
        showAlert('alerts', 'Please enter Pet ID', 'error');
        return;
    }
    
    try {
        const data = await apiCall(`/vet/search-pet/${id}`);
        const pet = data.pet;
        const container = document.getElementById('search-results');
        container.innerHTML = '';
        
        const card = document.createElement('div');
        card.className = 'card pet-card';
        card.style.cursor = 'pointer';
        card.onclick = () => loadPetProfile(pet.pet_id);
        
        card.innerHTML = `
            <h3>${pet.pet_name}</h3>
            <p><strong>Type:</strong> ${pet.species}</p>
            <p><strong>Breed:</strong> ${pet.breed || 'Not specified'}</p>
            <p><strong>Age:</strong> ${pet.age || 'Unknown'} years</p>
            <p><strong>Owner Email:</strong> ${pet.owner_email}</p>
            <p><strong>Microchip:</strong> ${pet.microchip_id || 'Not registered'}</p>
            <button class="btn btn-primary" style="width:100%;margin-top:10px;">View Full Profile</button>
        `;
        
        container.appendChild(card);
    } catch (err) {
        showAlert('alerts', 'Pet not found', 'error');
        document.getElementById('search-results').innerHTML = '';
    }
}

// =====================================================
// LOAD COMPLETE PET PROFILE
// =====================================================

async function loadPetProfile(petId) {
    try {
        const data = await apiCall(`/vet/pet/${petId}`);
        currentPet = data.pet;
        
        let html = `
            <div style="background:#f8fafc;padding:20px;border-radius:6px;margin-bottom:20px;">
                <h2>${currentPet.pet_name}</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:15px;">
                    <div>
                        <p><strong>Species:</strong> ${currentPet.species}</p>
                        <p><strong>Breed:</strong> ${currentPet.breed || 'Not specified'}</p>
                        <p><strong>Color:</strong> ${currentPet.color || 'Not specified'}</p>
                        <p><strong>Age:</strong> ${currentPet.age || 'Unknown'} years</p>
                    </div>
                    <div>
                        <p><strong>Weight:</strong> ${currentPet.weight || 'Not recorded'} kg</p>
                        <p><strong>Blood Type:</strong> ${currentPet.blood_type || 'Not recorded'}</p>
                        <p><strong>Microchip ID:</strong> ${currentPet.microchip_id || 'Not registered'}</p>
                        <p><strong>DOB:</strong> ${formatDate(currentPet.date_of_birth) || 'Not recorded'}</p>
                    </div>
                </div>
                <p style="margin-top:15px;"><strong>Owner Email:</strong> ${currentPet.owner_email}</p>
                <p><strong>Status:</strong> ${getBadge(currentPet.status)}</p>
            </div>

            <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
                <button class="btn btn-primary" onclick="showAddMedicalModal(${petId})">+ Add Medical Record</button>
                <button class="btn btn-primary" onclick="showAddVaccinationModal(${petId})">+ Add Vaccination</button>
                <button class="btn btn-primary" onclick="showAddCheckupModal(${petId})">+ Add Checkup</button>
            </div>

            <!-- MEDICAL RECORDS SECTION -->
            <div style="background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <h3>📋 Medical Records</h3>
        `;
        
        if (!data.medicalRecords || data.medicalRecords.length === 0) {
            html += '<p style="color:#64748b;margin-top:10px;">No medical records found.</p>';
        } else {
            html += '<div style="overflow-x:auto;margin-top:15px;"><table class="table"><thead><tr><th>Date</th><th>Diagnosis</th><th>Treatment</th><th>Medications</th><th>Notes</th></tr></thead><tbody>';
            
            data.medicalRecords.forEach(record => {
                html += `
                    <tr>
                        <td>${formatDate(record.visit_date)}</td>
                        <td>${record.diagnosis || 'N/A'}</td>
                        <td>${record.treatment || 'N/A'}</td>
                        <td>${record.medications || 'None'}</td>
                        <td>${record.notes || '-'}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += `
            </div>

            <!-- VACCINATION SECTION -->
            <div style="background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <h3>💉 Vaccination Schedule</h3>
        `;
        
        if (!data.vaccAlerts || data.vaccAlerts.length === 0) {
            html += '<p style="color:#64748b;margin-top:10px;">No vaccination records found.</p>';
        } else {
            html += '<div style="overflow-x:auto;margin-top:15px;"><table class="table"><thead><tr><th>Vaccine Type</th><th>Last Date</th><th>Next Date</th><th>Status</th><th>Action</th></tr></thead><tbody>';
            
            data.vaccAlerts.forEach(vacc => {
                html += `
                    <tr>
                        <td>${vacc.vaccination_type}</td>
                        <td>${formatDate(vacc.last_date) || 'N/A'}</td>
                        <td>${formatDate(vacc.next_date)}</td>
                        <td>${getBadge(vacc.status)}</td>
                        <td>
                            <select onchange="updateVaccinationStatus(${vacc.alert_id}, this.value)" style="padding:6px;border:1px solid #e2e8f0;border-radius:4px;">
                                <option value="">-- Update --</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += `
            </div>

            <!-- CHECKUP SECTION -->
            <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <h3>📅 Scheduled Checkups</h3>
        `;
        
        if (!data.checkupAlerts || data.checkupAlerts.length === 0) {
            html += '<p style="color:#64748b;margin-top:10px;">No checkups scheduled.</p>';
        } else {
            html += '<div style="overflow-x:auto;margin-top:15px;"><table class="table"><thead><tr><th>Checkup Type</th><th>Scheduled Date</th><th>Status</th><th>Notes</th></tr></thead><tbody>';
            
            data.checkupAlerts.forEach(checkup => {
                html += `
                    <tr>
                        <td>${checkup.checkup_type}</td>
                        <td>${formatDate(checkup.scheduled_date)}</td>
                        <td>${getBadge(checkup.status)}</td>
                        <td>${checkup.notes || '-'}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table></div>';
        }
        
        html += '</div>';
        
        document.getElementById('profile-content').innerHTML = html;
        showModal('pet-profile');
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

// =====================================================
// ADD MEDICAL RECORD MODAL
// =====================================================

function showAddMedicalModal(petId) {
    const form = document.getElementById('medical-form');
    form.innerHTML = `
        <input type="hidden" id="medical-pet-id" value="${petId}">
        <div class="form-group">
            <label>Visit Date*</label>
            <input type="date" id="visit-date" required>
        </div>
        <div class="form-group">
            <label>Diagnosis*</label>
            <input type="text" id="diagnosis" placeholder="e.g., Ear infection" required>
        </div>
        <div class="form-group">
            <label>Treatment*</label>
            <input type="text" id="treatment" placeholder="e.g., Antibiotic drops" required>
        </div>
        <div class="form-group">
            <label>Medications</label>
            <input type="text" id="medications" placeholder="e.g., Neomycin drops">
        </div>
        <div class="form-group">
            <label>Notes</label>
            <textarea id="notes" placeholder="Additional notes"></textarea>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('medical-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Medical Record</button>
        </div>
    `;
    
    // Set today's date
    document.getElementById('visit-date').value = new Date().toISOString().split('T')[0];
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiCall('/vet/add-medical-record', 'POST', {
                pet_id: parseInt(petId),
                visit_date: document.getElementById('visit-date').value,
                diagnosis: document.getElementById('diagnosis').value,
                treatment: document.getElementById('treatment').value,
                medications: document.getElementById('medications').value,
                notes: document.getElementById('notes').value
            });
            
            if (res.success) {
                showAlert('alerts', 'Medical record added successfully!', 'success');
                closeModal('medical-modal');
                loadPetProfile(petId);
            }
        } catch (err) {
            showAlert('alerts', 'Error: ' + err.message, 'error');
        }
    };
    
    showModal('medical-modal');
}

// =====================================================
// ADD VACCINATION MODAL
// =====================================================

function showAddVaccinationModal(petId) {
    const form = document.getElementById('vacc-form');
    form.innerHTML = `
        <input type="hidden" id="vacc-pet-id" value="${petId}">
        <div class="form-group">
            <label>Vaccination Type*</label>
            <input type="text" id="vacc-type" placeholder="e.g., Rabies, DHPP" required>
        </div>
        <div class="form-group">
            <label>Last Vaccination Date</label>
            <input type="date" id="last-vacc-date">
        </div>
        <div class="form-group">
            <label>Next Vaccination Date*</label>
            <input type="date" id="next-vacc-date" required>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('vacc-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Vaccination</button>
        </div>
    `;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiCall('/vet/add-vaccination', 'POST', {
                pet_id: parseInt(petId),
                vaccination_type: document.getElementById('vacc-type').value,
                last_date: document.getElementById('last-vacc-date').value || null,
                next_date: document.getElementById('next-vacc-date').value
            });
            
            if (res.success) {
                showAlert('alerts', 'Vaccination added successfully!', 'success');
                closeModal('vacc-modal');
                loadPetProfile(petId);
            }
        } catch (err) {
            showAlert('alerts', 'Error: ' + err.message, 'error');
        }
    };
    
    showModal('vacc-modal');
}

// =====================================================
// ADD CHECKUP MODAL
// =====================================================

function showAddCheckupModal(petId) {
    const form = document.getElementById('checkup-form');
    form.innerHTML = `
        <input type="hidden" id="checkup-pet-id" value="${petId}">
        <div class="form-group">
            <label>Checkup Type*</label>
            <input type="text" id="checkup-type" placeholder="e.g., Annual Wellness, Dental Cleaning" required>
        </div>
        <div class="form-group">
            <label>Scheduled Date*</label>
            <input type="date" id="checkup-date" required>
        </div>
        <div class="form-group">
            <label>Notes</label>
            <textarea id="checkup-notes" placeholder="Additional notes"></textarea>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('checkup-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Checkup</button>
        </div>
    `;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiCall('/vet/add-checkup', 'POST', {
                pet_id: parseInt(petId),
                checkup_type: document.getElementById('checkup-type').value,
                scheduled_date: document.getElementById('checkup-date').value,
                notes: document.getElementById('checkup-notes').value
            });
            
            if (res.success) {
                showAlert('alerts', 'Checkup scheduled successfully!', 'success');
                closeModal('checkup-modal');
                loadPetProfile(petId);
            }
        } catch (err) {
            showAlert('alerts', 'Error: ' + err.message, 'error');
        }
    };
    
    showModal('checkup-modal');
}

// =====================================================
// UPDATE VACCINATION STATUS
// =====================================================

async function updateVaccinationStatus(alertId, newStatus) {
    if (!newStatus) return;
    
    try {
        const res = await apiCall(`/vet/vaccination/${alertId}`, 'PUT', {
            status: newStatus
        });
        
        if (res.success) {
            showAlert('alerts', 'Vaccination status updated!', 'success');
            if (currentPet) {
                loadPetProfile(currentPet.pet_id);
            }
        }
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

// =====================================================
// ADD NEW PET MODAL
// =====================================================

function showAddPetModal() {
    const form = document.getElementById('add-pet-form');
    form.innerHTML = `
        <div class="form-group">
            <label>Owner Email*</label>
            <input type="email" id="owner-email" placeholder="owner@example.com" required>
        </div>
        <div class="form-group">
            <label>Pet Name*</label>
            <input type="text" id="pet-name" required>
        </div>
        <div class="form-group">
            <label>Species*</label>
            <select id="pet-species" required>
                <option value="">Select Species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <div class="form-group">
            <label>Breed</label>
            <input type="text" id="pet-breed">
        </div>
        <div class="form-group">
            <label>Age (years)</label>
            <input type="number" id="pet-age" min="0">
        </div>
        <div class="form-group">
            <label>Color</label>
            <input type="text" id="pet-color">
        </div>
        <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="pet-dob">
        </div>
        <div class="form-group">
            <label>Weight (kg)</label>
            <input type="number" id="pet-weight" min="0" step="0.1">
        </div>
        <div class="form-group">
            <label>Blood Type</label>
            <input type="text" id="pet-blood-type" placeholder="e.g., O+">
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal('add-pet-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Pet</button>
        </div>
    `;
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const ownerEmail = document.getElementById('owner-email').value;
        if (!ownerEmail) {
            showAlert('alerts', 'Owner email is required', 'error');
            return;
        }
        
        try {
            const res = await apiCall('/vet/add-pet', 'POST', {
                pet_name: document.getElementById('pet-name').value,
                species: document.getElementById('pet-species').value,
                breed: document.getElementById('pet-breed').value,
                age: parseInt(document.getElementById('pet-age').value) || null,
                color: document.getElementById('pet-color').value,
                owner_email: ownerEmail,
                date_of_birth: document.getElementById('pet-dob').value || null,
                weight: parseFloat(document.getElementById('pet-weight').value) || null,
                blood_type: document.getElementById('pet-blood-type').value
            });
            
            if (res.success) {
                showAlert('alerts', 'Pet added successfully!', 'success');
                closeModal('add-pet-modal');
            }
        } catch (err) {
            showAlert('alerts', 'Error: ' + err.message, 'error');
        }
    };
    
    showModal('add-pet-modal');
}

// =====================================================
// LOAD ACTIVITY LOG
// =====================================================

async function loadActivityLog() {
    try {
        const data = await apiCall('/vet/audit-logs');
        
        if (!data.logs || data.logs.length === 0) {
            document.getElementById('activity-container').innerHTML = '<p style="color:#64748b;">No activity yet.</p>';
            return;
        }
        
        let html = '<div style="overflow-x:auto;"><table class="table"><thead><tr><th>Timestamp</th><th>Action</th><th>Pet ID</th><th>Description</th></tr></thead><tbody>';
        
        data.logs.forEach(log => {
            const actionIcon = log.action_type.includes('MEDICAL') ? '📝' : 
                               log.action_type.includes('VACCINATION') ? '💉' :
                               log.action_type.includes('CHECKUP') ? '📅' : '📌';
            
            html += `
                <tr>
                    <td>${formatDate(log.timestamp)}</td>
                    <td>${actionIcon} ${log.action_type.replace(/_/g, ' ')}</td>
                    <td>${log.pet_id || '-'}</td>
                    <td>${log.description || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        document.getElementById('activity-container').innerHTML = html;
    } catch (err) {
        showAlert('alerts', 'Error loading activity log: ' + err.message, 'error');
    }
}

// =====================================================
// INITIALIZE
// =====================================================

window.addEventListener('load', () => {
    checkAuth();
    loadUserInfo();
});