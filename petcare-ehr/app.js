// =====================================================
// app.js - PetCareEHR Complete Backend Server
// =====================================================

const express = require('express');
const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));



// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'petcare_ehr',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateToken(userId, userType) {
    return jwt.sign(
        { userId, userType },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '24h' }
    );
}

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
}

async function logAuditAction(vet_id, action_type, pet_id, record_id, description) {
    try {
        const connection = await pool.getConnection();
        const query = 'INSERT INTO audit_logs (vet_id, action_type, pet_id, record_id, description) VALUES (?, ?, ?, ?, ?)';
        await connection.execute(query, [vet_id, action_type, pet_id, record_id, description]);
        connection.release();
    } catch (err) {
        console.error('Audit log error:', err);
    }
}

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// Owner Sign Up
app.post('/api/auth/owner/signup', async (req, res) => {
    const { name, email, phone, address, location, password } = req.body;
    const connection = await pool.getConnection();

    try {
        if (!name || !email || !phone || !address || !location || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const passwordHash = await bcryptjs.hash(password, 10);
        const query = 'INSERT INTO owners (name, email, phone, address, location, password_hash) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.execute(query, [name, email, phone, address, location, passwordHash]);
        
        res.json({ success: true, message: 'Owner registered successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Email already registered' });
        } else {
            res.status(400).json({ error: err.message });
        }
    } finally {
        connection.release();
    }
});

// Owner Login
app.post('/api/auth/owner/login', async (req, res) => {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.execute('SELECT * FROM owners WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcryptjs.compare(password, rows[0].password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(rows[0].owner_id, 'owner');
        res.json({
            success: true,
            token,
            userId: rows[0].owner_id,
            userEmail: rows[0].email,
            userType: 'owner',
            name: rows[0].name,
            phone: rows[0].phone
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Adopter Sign Up
app.post('/api/auth/adopter/signup', async (req, res) => {
    const { name, email, phone, address, agency_name, location, password } = req.body;
    const connection = await pool.getConnection();

    try {
        if (!name || !email || !phone || !address || !agency_name || !location || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const passwordHash = await bcryptjs.hash(password, 10);
        const query = 'INSERT INTO adopters (name, email, phone, address, agency_name, location, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)';
        await connection.execute(query, [name, email, phone, address, agency_name, location, passwordHash]);
        
        res.json({ success: true, message: 'Adopter registered successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Email already registered' });
        } else {
            res.status(400).json({ error: err.message });
        }
    } finally {
        connection.release();
    }
});

// Adopter Login
app.post('/api/auth/adopter/login', async (req, res) => {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.execute('SELECT * FROM adopters WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcryptjs.compare(password, rows[0].password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(rows[0].adopter_id, 'adopter');
        res.json({
            success: true,
            token,
            userId: rows[0].adopter_id,
            userEmail: rows[0].email,
            userType: 'adopter',
            name: rows[0].name
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Veterinarian Login
app.post('/api/auth/vet/login', async (req, res) => {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.execute('SELECT * FROM veterinarians WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcryptjs.compare(password, rows[0].password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(rows[0].vet_id, 'vet');
        res.json({
            success: true,
            token,
            userId: rows[0].vet_id,
            userType: 'vet',
            name: rows[0].vet_name,
            clinic: rows[0].clinic_name
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// =====================================================
// OWNER ROUTES
// =====================================================

// Get Owner's Pets
app.get('/api/owner/pets', verifyToken, async (req, res) => {
    if (req.user.userType !== 'owner') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();
    try {
        const [owner] = await connection.execute('SELECT email FROM owners WHERE owner_id = ?', [req.user.userId]);
        if (owner.length === 0) return res.status(404).json({ error: 'Owner not found' });

        const ownerEmail = owner[0].email;
        const [pets] = await connection.execute('SELECT * FROM pets WHERE owner_email = ?', [ownerEmail]);

        res.json({ success: true, pets, ownerEmail });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Get Pet Details (Owner)
app.get('/api/owner/pet/:petId', verifyToken, async (req, res) => {
    if (req.user.userType !== 'owner') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();
    try {
        const [owner] = await connection.execute('SELECT email FROM owners WHERE owner_id = ?', [req.user.userId]);
        const ownerEmail = owner[0].email;

        const [pets] = await connection.execute('SELECT * FROM pets WHERE pet_id = ? AND owner_email = ?', [req.params.petId, ownerEmail]);
        if (pets.length === 0) return res.status(404).json({ error: 'Pet not found' });

        const pet = pets[0];

        const [medicalRecords] = await connection.execute(
            'SELECT mr.*, v.vet_name, v.clinic_name FROM medical_records mr JOIN veterinarians v ON mr.vet_id = v.vet_id WHERE mr.pet_id = ? ORDER BY mr.visit_date DESC',
            [req.params.petId]
        );

        const [vaccAlerts] = await connection.execute(
            'SELECT * FROM vaccination_alerts WHERE pet_id = ? ORDER BY next_date ASC',
            [req.params.petId]
        );

        const [checkupAlerts] = await connection.execute(
            'SELECT * FROM checkup_alerts WHERE pet_id = ? ORDER BY scheduled_date ASC',
            [req.params.petId]
        );

        res.json({ success: true, pet, medicalRecords, vaccAlerts, checkupAlerts });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Mark Pet as Available for Adoption
app.put('/api/owner/pet/:petId/mark-adoption', verifyToken, async (req, res) => {
    if (req.user.userType !== 'owner') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();
    try {
        const [owner] = await connection.execute('SELECT email FROM owners WHERE owner_id = ?', [req.user.userId]);
        const ownerEmail = owner[0].email;

        const query = 'UPDATE pets SET status = ?, available_for_adoption = ? WHERE pet_id = ? AND owner_email = ?';
        const [result] = await connection.execute(query, ['available_for_adoption', 1, req.params.petId, ownerEmail]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Pet not found' });

        res.json({ success: true, message: 'Pet marked as available for adoption' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Get All Veterinarians
app.get('/api/owner/veterinarians', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const location = req.query.location;
        let query = 'SELECT * FROM veterinarians';
        let params = [];

        if (location) {
            query += ' WHERE location = ?';
            params.push(location);
        }

        query += ' ORDER BY vet_name ASC';
        const [vets] = await connection.execute(query, params);

        res.json({ success: true, vets });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Get Pet Products
app.get('/api/owner/products', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [products] = await connection.execute('SELECT * FROM pet_products ORDER BY product_name ASC');
        res.json({ success: true, products });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// =====================================================
// ADOPTER ROUTES
// =====================================================

// Get Available Pets for Adoption (With Owner Details)
app.get('/api/adopter/available-pets', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const query = `
            SELECT p.*, o.email as owner_email, o.phone as owner_phone, o.name as owner_name 
            FROM pets p 
            JOIN owners o ON p.owner_email = o.email 
            WHERE p.status = 'available_for_adoption' AND p.available_for_adoption = 1
            ORDER BY p.pet_name ASC
        `;
        const [pets] = await connection.execute(query);
        res.json({ success: true, pets });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Get Pet Summary for Adopter (With Owner Contact)
app.get('/api/adopter/pet/:petId', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const query = `
            SELECT p.*, o.email as owner_email, o.phone as owner_phone, o.name as owner_name, o.location as owner_location
            FROM pets p 
            JOIN owners o ON p.owner_email = o.email 
            WHERE p.pet_id = ? AND p.status = 'available_for_adoption'
        `;
        const [pets] = await connection.execute(query, [req.params.petId]);

        if (pets.length === 0) return res.status(404).json({ error: 'Pet not found' });

        const [medicalRecords] = await connection.execute(
            'SELECT mr.visit_date, mr.diagnosis, mr.treatment FROM medical_records mr WHERE mr.pet_id = ? ORDER BY mr.visit_date DESC LIMIT 3',
            [req.params.petId]
        );

        res.json({ success: true, pet: pets[0], recentMedical: medicalRecords });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// =====================================================
// VETERINARIAN ROUTES
// =====================================================

// Add New Pet
app.post('/api/vet/add-pet', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const { pet_name, species, breed, age, color, owner_email, date_of_birth, weight, blood_type } = req.body;
    const connection = await pool.getConnection();

    try {
        const [owner] = await connection.execute('SELECT email FROM owners WHERE email = ?', [owner_email]);
        if (owner.length === 0) return res.status(400).json({ error: 'Owner email not found' });

        const query = 'INSERT INTO pets (pet_name, species, breed, age, color, owner_email, status, date_of_birth, weight, blood_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await connection.execute(query, [pet_name, species, breed, age, color, owner_email, 'with_owner', date_of_birth, weight, blood_type]);

        await logAuditAction(req.user.userId, 'ADD_PET', result.insertId, null, `Added pet: ${pet_name} for owner: ${owner_email}`);

        res.json({ success: true, message: 'Pet added successfully', petId: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Search Pets by Owner Email
app.get('/api/vet/search-pets-by-email/:ownerEmail', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const connection = await pool.getConnection();
    try {
        const [pets] = await connection.execute('SELECT * FROM pets WHERE owner_email = ? ORDER BY pet_name ASC', [req.params.ownerEmail]);

        if (pets.length === 0) return res.status(404).json({ error: 'No pets found for this owner' });

        res.json({ success: true, pets, ownerEmail: req.params.ownerEmail });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Search Pet by ID
app.get('/api/vet/search-pet/:petId', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const connection = await pool.getConnection();
    try {
        const [pets] = await connection.execute('SELECT * FROM pets WHERE pet_id = ?', [req.params.petId]);
        if (pets.length === 0) return res.status(404).json({ error: 'Pet not found' });

        res.json({ success: true, pet: pets[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Get Full Pet Profile (Vet)
app.get('/api/vet/pet/:petId', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const connection = await pool.getConnection();
    try {
        const [pets] = await connection.execute('SELECT * FROM pets WHERE pet_id = ?', [req.params.petId]);
        if (pets.length === 0) return res.status(404).json({ error: 'Pet not found' });

        const pet = pets[0];
        const [medicalRecords] = await connection.execute('SELECT * FROM medical_records WHERE pet_id = ? ORDER BY visit_date DESC', [req.params.petId]);
        const [vaccAlerts] = await connection.execute('SELECT * FROM vaccination_alerts WHERE pet_id = ? ORDER BY next_date ASC', [req.params.petId]);
        const [checkupAlerts] = await connection.execute('SELECT * FROM checkup_alerts WHERE pet_id = ? ORDER BY scheduled_date ASC', [req.params.petId]);

        res.json({ success: true, pet, medicalRecords, vaccAlerts, checkupAlerts });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Add Medical Record
app.post('/api/vet/add-medical-record', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const { pet_id, visit_date, diagnosis, treatment, medications, notes } = req.body;
    const connection = await pool.getConnection();

    try {
        const query = 'INSERT INTO medical_records (pet_id, vet_id, visit_date, diagnosis, treatment, medications, notes) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await connection.execute(query, [pet_id, req.user.userId, visit_date, diagnosis, treatment, medications, notes]);

        await logAuditAction(req.user.userId, 'ADD_MEDICAL_RECORD', pet_id, result.insertId, `Added medical record: ${diagnosis}`);

        res.json({ success: true, message: 'Medical record added', recordId: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Update Medical Record
app.put('/api/vet/medical-record/:recordId', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const { diagnosis, treatment, medications, notes } = req.body;
    const connection = await pool.getConnection();

    try {
        const query = 'UPDATE medical_records SET diagnosis = ?, treatment = ?, medications = ?, notes = ? WHERE record_id = ?';
        await connection.execute(query, [diagnosis, treatment, medications, notes, req.params.recordId]);

        await logAuditAction(req.user.userId, 'UPDATE_MEDICAL_RECORD', null, req.params.recordId, 'Updated medical record');

        res.json({ success: true, message: 'Medical record updated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Add Vaccination Alert
app.post('/api/vet/add-vaccination', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const { pet_id, vaccination_type, last_date, next_date } = req.body;
    const connection = await pool.getConnection();

    try {
        const query = 'INSERT INTO vaccination_alerts (pet_id, vet_id, vaccination_type, last_date, next_date, status) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.execute(query, [pet_id, req.user.userId, vaccination_type, last_date, next_date, 'pending']);

        await logAuditAction(req.user.userId, 'ADD_VACCINATION', pet_id, null, `Added vaccination: ${vaccination_type}`);

        res.json({ success: true, message: 'Vaccination alert added' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Update Vaccination Status
app.put('/api/vet/vaccination/:alertId', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const { status } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.execute('UPDATE vaccination_alerts SET status = ? WHERE alert_id = ?', [status, req.params.alertId]);

        await logAuditAction(req.user.userId, 'UPDATE_VACCINATION', null, null, `Updated vaccination status to: ${status}`);

        res.json({ success: true, message: 'Vaccination status updated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Add Checkup Alert
app.post('/api/vet/add-checkup', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const { pet_id, checkup_type, scheduled_date, notes } = req.body;
    const connection = await pool.getConnection();

    try {
        const query = 'INSERT INTO checkup_alerts (pet_id, vet_id, checkup_type, scheduled_date, status, notes) VALUES (?, ?, ?, ?, ?, ?)';
        await connection.execute(query, [pet_id, req.user.userId, checkup_type, scheduled_date, 'scheduled', notes]);

        await logAuditAction(req.user.userId, 'ADD_CHECKUP', pet_id, null, `Added checkup: ${checkup_type}`);

        res.json({ success: true, message: 'Checkup alert added' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// Get Audit Logs
app.get('/api/vet/audit-logs', verifyToken, async (req, res) => {
    if (req.user.userType !== 'vet') return res.status(403).json({ error: 'Unauthorized' });

    const connection = await pool.getConnection();
    try {
        const [logs] = await connection.execute('SELECT * FROM audit_logs WHERE vet_id = ? ORDER BY timestamp DESC LIMIT 50', [req.user.userId]);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(400).json({ error: err.message });
    } finally {
        connection.release();
    }
});
app.post('/ai/chat', verifyToken, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ reply: 'Empty message' });
    }

    try {
        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: message
        });

        res.json({
            reply: response.output[0].content[0].text
        });

    } catch (err) {
        res.status(500).json({ reply: 'AI error' });
    }
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✓ PetCareEHR Server Running`);
    console.log(`✓ URL: http://localhost:${PORT}`);
    console.log(`✓ Database: ${process.env.DB_NAME || 'petcare_ehr'}`);
    console.log(`${'='.repeat(50)}\n`);
});
