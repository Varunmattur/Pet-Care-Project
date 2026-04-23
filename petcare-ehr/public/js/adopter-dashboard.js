let allPets = [];

async function loadPets() {
    try {
        const data = await apiCall('/adopter/available-pets');
        allPets = data.pets || [];
        filterAndDisplay();
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

function filterAndDisplay() {
    const species = document.getElementById('species-filter')?.value;
    const age = document.getElementById('age-filter')?.value;
    const sort = document.getElementById('sort-filter')?.value || 'name';
    
    let filtered = allPets.filter(p => !species || p.species === species);
    filtered = filtered.filter(p => {
        if (!age) return true;
        if (age === '0-2') return p.age <= 2;
        if (age === '2-5') return p.age > 2 && p.age <= 5;
        if (age === '5+') return p.age > 5;
        return true;
    });
    
    filtered.sort((a, b) => {
        if (sort === 'name') return a.pet_name.localeCompare(b.pet_name);
        if (sort === 'age') return (a.age || 0) - (b.age || 0);
        return 0;
    });
    
    const container = document.getElementById('pets-container');
    container.innerHTML = '';
    
    if (!filtered.length) {
        container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#64748b;padding:40px;">No pets match your filters.</p>';
        return;
    }
    
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card pet-card';
        card.onclick = () => viewPet(p.pet_id);
        card.innerHTML = `
            <h3>${p.pet_name}</h3>
            <p><strong>Type:</strong> ${p.species}</p>
            <p><strong>Breed:</strong> ${p.breed || 'Mixed'}</p>
            <p><strong>Age:</strong> ${p.age || '?'} years</p>
            <p><strong>Color:</strong> ${p.color || 'Unknown'}</p>
            <button class="btn btn-primary" style="width:100%;margin-top:10px;">View Details</button>
        `;
        container.appendChild(card);
    });
}

async function viewPet(id) {
    try {
        const data = await apiCall(`/adopter/pet/${id}`);
        const pet = data.pet;
        let html = `
            <div class="alert info">ℹ️ Click on owner contact below to reach them directly!</div>
            <div style="background:#f8fafc;padding:15px;border-radius:6px;margin-bottom:20px;">
                <h3>${pet.pet_name}</h3>
                <p><strong>Type:</strong> ${pet.species}</p>
                <p><strong>Breed:</strong> ${pet.breed || 'Mixed'}</p>
                <p><strong>Age:</strong> ${pet.age || '?'} years</p>
                <p><strong>Color:</strong> ${pet.color || 'Unknown'}</p>
                ${pet.weight ? `<p><strong>Weight:</strong> ${pet.weight} kg</p>` : ''}
            </div>
            <div style="background:#ecfdf5;padding:15px;border-radius:6px;margin-bottom:20px;border-left:4px solid #16a34a;">
                <h4 style="margin-bottom:10px;color:#166534;">Owner Contact Information</h4>
                <p><strong>Name:</strong> ${pet.owner_name}</p>
                <p><strong>Email:</strong> <a href="mailto:${pet.owner_email}" style="color:#2563eb;text-decoration:none;">${pet.owner_email}</a></p>
                <p><strong>Phone:</strong> <a href="tel:${pet.owner_phone}" style="color:#2563eb;text-decoration:none;">${pet.owner_phone}</a></p>
                <p><strong>Location:</strong> ${pet.owner_location}</p>
            </div>
            <h4>Medical Summary</h4>
        `;
        if (!data.recentMedical.length) {
            html += '<p style="color:#64748b;">No medical history.</p>';
        } else {
            html += '<div style="background:#f8fafc;padding:15px;border-radius:6px;">';
            data.recentMedical.forEach((r, i) => {
                html += `<div style="padding:10px;border-bottom:1px solid #e2e8f0;"><p><strong>Visit ${data.recentMedical.length - i}:</strong> ${formatDate(r.visit_date)}</p><p>${r.diagnosis}</p></div>`;
            });
            html += '</div>';
        }
        document.getElementById('pet-detail').innerHTML = html;
        showModal('pet-modal');
    } catch (err) {
        showAlert('alerts', 'Error: ' + err.message, 'error');
    }
}

window.addEventListener('load', () => {
    loadPets();
});