// vet-activity.js - Veterinarian Activity Log
// Place in public/js/ folder

// =====================================================
// LOAD ACTIVITY LOGS
// =====================================================

async function loadActivityLogs() {
    try {
        const data = await apiCall('/vet/audit-logs');

        if (!data.success) {
            showAlert('alerts-container', 'Failed to load activity logs', 'error');
            return;
        }

        const logs = data.logs || [];
        const actionFilter = document.getElementById('action-filter')?.value || '';

        // Filter logs if needed
        let filteredLogs = logs;
        if (actionFilter) {
            filteredLogs = logs.filter(log => log.action_type === actionFilter);
        }

        if (filteredLogs.length === 0) {
            document.getElementById('activity-container').innerHTML = '<p style="color: #64748b; text-align: center; padding: 40px;">No activity logs found.</p>';
            return;
        }

        displayActivityTable(filteredLogs);
    } catch (err) {
        showAlert('alerts-container', 'Error: ' + err.message, 'error');
    }
}

// =====================================================
// DISPLAY ACTIVITY TABLE
// =====================================================

function displayActivityTable(logs) {
    let html = '<div style="overflow-x: auto;"><table class="table">';
    
    html += `
        <thead>
            <tr>
                <th>Date & Time</th>
                <th>Action Type</th>
                <th>Pet ID</th>
                <th>Record ID</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
    `;

    logs.forEach((log, index) => {
        const actionIcon = getActionIcon(log.action_type);
        const actionLabel = getActionLabel(log.action_type);
        const timestamp = formatDateTime(log.timestamp);

        html += `
            <tr>
                <td>
                    <strong>${timestamp.date}</strong><br>
                    <span style="color: #64748b; font-size: 0.85em;">${timestamp.time}</span>
                </td>
                <td>
                    <span style="display: inline-block; padding: 4px 8px; background: ${getActionColor(log.action_type)}; color: white; border-radius: 4px; font-size: 0.85em; font-weight: 500;">
                        ${actionIcon} ${actionLabel}
                    </span>
                </td>
                <td>
                    ${log.pet_id ? `<a href="#" onclick="viewPetFromLog(${log.pet_id}); return false;" style="color: #2563eb; text-decoration: none; font-weight: 500;">Pet #${log.pet_id}</a>` : '-'}
                </td>
                <td>
                    ${log.record_id ? `Record #${log.record_id}` : '-'}
                </td>
                <td>
                    <span style="color: #1e293b;">${log.description}</span>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    document.getElementById('activity-container').innerHTML = html;
}

// =====================================================
// GET ACTION ICON
// =====================================================

function getActionIcon(actionType) {
    const icons = {
        'ADD_MEDICAL_RECORD': '📝',
        'ADD_VACCINATION': '💉',
        'UPDATE_VACCINATION': '✏️',
        'UPDATE_MEDICAL_RECORD': '📋'
    };
    return icons[actionType] || '📌';
}

// =====================================================
// GET ACTION LABEL
// =====================================================

function getActionLabel(actionType) {
    const labels = {
        'ADD_MEDICAL_RECORD': 'Medical Record Added',
        'ADD_VACCINATION': 'Vaccination Added',
        'UPDATE_VACCINATION': 'Vaccination Updated',
        'UPDATE_MEDICAL_RECORD': 'Medical Record Updated'
    };
    return labels[actionType] || actionType;
}

// =====================================================
// GET ACTION COLOR
// =====================================================

function getActionColor(actionType) {
    const colors = {
        'ADD_MEDICAL_RECORD': '#3b82f6',      // Blue
        'ADD_VACCINATION': '#8b5cf6',         // Purple
        'UPDATE_VACCINATION': '#f59e0b',      // Amber
        'UPDATE_MEDICAL_RECORD': '#10b981'    // Green
    };
    return colors[actionType] || '#64748b';   // Gray default
}

// =====================================================
// FORMAT DATE AND TIME
// =====================================================

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    
    const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return {
        date: dateStr,
        time: timeStr
    };
}

// =====================================================
// VIEW PET FROM LOG (Navigate back to vet dashboard)
// =====================================================

function viewPetFromLog(petId) {
    if (confirm(`View Pet #${petId} details? You'll be taken to the search page.`)) {
        // Store pet ID in sessionStorage for auto-search
        sessionStorage.setItem('autoSearchPetId', petId);
        window.location.href = '/dashboard/vet.html';
    }
}

// =====================================================
// GET SUMMARY STATISTICS
// =====================================================

async function loadActivitySummary() {
    try {
        const data = await apiCall('/vet/audit-logs');

        if (!data.success || !data.logs) return;

        const logs = data.logs;

        // Count actions by type
        const counts = {
            medical: logs.filter(l => l.action_type === 'ADD_MEDICAL_RECORD').length,
            vaccination_add: logs.filter(l => l.action_type === 'ADD_VACCINATION').length,
            vaccination_update: logs.filter(l => l.action_type === 'UPDATE_VACCINATION').length
        };

        // Display summary (optional - commented out for now)
        console.log('Activity Summary:', counts);
    } catch (err) {
        console.error('Error loading summary:', err);
    }
}

// =====================================================
// EXPORT LOG TO CSV (Optional feature)
// =====================================================

function exportLogsToCSV() {
    try {
        const tables = document.querySelectorAll('table');
        if (!tables.length) {
            alert('No data to export');
            return;
        }

        let csv = 'Date,Time,Action Type,Pet ID,Record ID,Description\n';
        
        const rows = document.querySelectorAll('table tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                const date = cells[0].textContent.trim().split('\n')[0];
                const time = cells[0].textContent.trim().split('\n')[1].replace(/\n/g, ' ');
                const action = cells[1].textContent.trim().replace(/[\n\r]/g, ' ');
                const petId = cells[2].textContent.trim();
                const recordId = cells[3].textContent.trim();
                const description = cells[4].textContent.trim();

                csv += `"${date}","${time}","${action}","${petId}","${recordId}","${description}"\n`;
            }
        });

        // Create download link
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        link.download = `activity_log_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showAlert('alerts-container', 'Activity log exported successfully!', 'success');
    } catch (err) {
        showAlert('alerts-container', 'Error exporting log: ' + err.message, 'error');
    }
}

// =====================================================
// AUTO-SEARCH PET IF COMING FROM LOG
// =====================================================

async function checkAutoSearchPet() {
    const petId = sessionStorage.getItem('autoSearchPetId');
    if (petId) {
        sessionStorage.removeItem('autoSearchPetId');
        // Set input if on vet page
        const input = document.getElementById('petSearchInput');
        if (input) {
            input.value = petId;
            setTimeout(() => searchPet?.(), 500);
        }
    }
}

// =====================================================
// INITIALIZE ON PAGE LOAD
// =====================================================

window.addEventListener('load', () => {
    loadActivityLogs();
    loadActivitySummary();
    checkAutoSearchPet();
});