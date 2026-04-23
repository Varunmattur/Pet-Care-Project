// owner-alerts.js - Owner Vaccination Alerts & Reminders
// Place in public/js/ folder

// =====================================================
// LOAD ALL VACCINATION ALERTS FOR OWNER'S PETS
// =====================================================

async function loadVaccinationAlerts() {
    try {
        // First get all owner's pets
        const petsData = await apiCall('/owner/pets');
        
        if (!petsData.success || petsData.pets.length === 0) {
            showAlert('alerts-container', 'No pets found', 'info');
            document.getElementById('upcoming-alerts').innerHTML = '<p style="color: #64748b;">No pets registered.</p>';
            return;
        }

        // Collect all vaccination alerts from all pets
        let allUpcoming = [];
        let allCompleted = [];
        let allOverdue = [];

        for (const pet of petsData.pets) {
            try {
                const petData = await apiCall(`/owner/pet/${pet.pet_id}`);
                
                if (petData.success && petData.vaccAlerts) {
                    petData.vaccAlerts.forEach(alert => {
                        alert.petName = pet.pet_name;
                        alert.petId = pet.pet_id;

                        if (alert.status === 'pending') {
                            allUpcoming.push(alert);
                        } else if (alert.status === 'completed') {
                            allCompleted.push(alert);
                        } else if (alert.status === 'overdue') {
                            allOverdue.push(alert);
                        }
                    });
                }
            } catch (err) {
                console.error(`Error loading alerts for pet ${pet.pet_id}:`, err);
            }
        }

        // Sort by date
        allUpcoming.sort((a, b) => new Date(a.next_date) - new Date(b.next_date));
        allCompleted.sort((a, b) => new Date(b.last_date) - new Date(a.last_date));
        allOverdue.sort((a, b) => new Date(a.next_date) - new Date(b.next_date));

        // Display results
        displayUpcomingAlerts(allUpcoming);
        displayCompletedAlerts(allCompleted);
        displayOverdueAlerts(allOverdue);

    } catch (err) {
        showAlert('alerts-container', 'Error: ' + err.message, 'error');
    }
}

// =====================================================
// DISPLAY UPCOMING VACCINATIONS
// =====================================================

function displayUpcomingAlerts(alerts) {
    const container = document.getElementById('upcoming-alerts');
    
    if (alerts.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No upcoming vaccinations scheduled.</p>';
        return;
    }

    let html = '<div style="overflow-x: auto;"><table class="table"><thead><tr><th>Pet</th><th>Vaccine</th><th>Scheduled Date</th><th>Status</th></tr></thead><tbody>';

    alerts.forEach(alert => {
        const nextDate = new Date(alert.next_date);
        const today = new Date();
        const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        let daysText = '';
        if (daysUntil < 0) {
            daysText = `(${Math.abs(daysUntil)} days overdue)`;
        } else if (daysUntil === 0) {
            daysText = '(Due today!)';
        } else if (daysUntil === 1) {
            daysText = '(Due tomorrow!)';
        } else if (daysUntil <= 7) {
            daysText = `(Due in ${daysUntil} days)`;
        } else if (daysUntil <= 30) {
            daysText = `(Due in ${Math.ceil(daysUntil / 7)} weeks)`;
        }

        html += `
            <tr>
                <td><strong>${alert.petName}</strong></td>
                <td>${alert.vaccination_type}</td>
                <td>
                    ${formatDate(alert.next_date)}<br>
                    <span style="color: #64748b; font-size: 0.85em;">${daysText}</span>
                </td>
                <td>${getStatusBadge(alert.status)}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// =====================================================
// DISPLAY COMPLETED VACCINATIONS
// =====================================================

function displayCompletedAlerts(alerts) {
    const container = document.getElementById('completed-alerts');
    
    if (alerts.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">No completed vaccinations.</p>';
        return;
    }

    let html = '<div style="overflow-x: auto;"><table class="table"><thead><tr><th>Pet</th><th>Vaccine</th><th>Completed Date</th><th>Status</th></tr></thead><tbody>';

    alerts.forEach(alert => {
        html += `
            <tr>
                <td><strong>${alert.petName}</strong></td>
                <td>${alert.vaccination_type}</td>
                <td>${formatDate(alert.last_date) || 'Unknown'}</td>
                <td>${getStatusBadge(alert.status)}</td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// =====================================================
// DISPLAY OVERDUE VACCINATIONS
// =====================================================

function displayOverdueAlerts(alerts) {
    const container = document.getElementById('overdue-alerts');
    
    if (alerts.length === 0) {
        container.innerHTML = '<div style="background: rgba(34, 197, 94, 0.1); padding: 15px; border-radius: 6px; border-left: 4px solid #16a34a; color: #166534;">✓ All vaccinations are up to date!</div>';
        return;
    }

    let html = '<div style="overflow-x: auto;"><table class="table"><thead><tr><th>Pet</th><th>Vaccine</th><th>Was Due</th><th>Days Overdue</th><th>Action</th></tr></thead><tbody>';

    alerts.forEach(alert => {
        const dueDate = new Date(alert.next_date);
        const today = new Date();
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        html += `
            <tr style="background: rgba(220, 38, 38, 0.02);">
                <td><strong>${alert.petName}</strong></td>
                <td>${alert.vaccination_type}</td>
                <td>${formatDate(alert.next_date)}</td>
                <td><span style="color: #dc2626; font-weight: bold;">${daysOverdue} days</span></td>
                <td>
                    <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="contactVet('${alert.petName}', '${alert.vaccination_type}')">
                        Contact Vet
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// =====================================================
// CONTACT VET HELPER (Could integrate with email later)
// =====================================================

function contactVet(petName, vaccinationType) {
    alert(`Please contact your veterinarian to schedule ${vaccinationType} vaccination for ${petName}.\n\nThis is a reminder - actual contact would be implemented with email integration.`);
}

// =====================================================
// CALCULATE DAYS UNTIL VACCINATION
// =====================================================

function daysUntilVaccination(nextDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(nextDate);
    date.setHours(0, 0, 0, 0);
    
    const difference = date - today;
    return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

// =====================================================
// INITIALIZE ON PAGE LOAD
// =====================================================

window.addEventListener('load', () => {
    loadVaccinationAlerts();
});