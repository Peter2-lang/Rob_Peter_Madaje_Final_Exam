require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection (Using environment variables for security)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Aiven Cloud Database connections
});

// Automatically create the database table on startup
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                course VARCHAR(100) NOT NULL,
                year_level VARCHAR(20) NOT NULL,
                email VARCHAR(100) NOT NULL
            );
        `);
        console.log("Database table initialized successfully.");
    } catch (err) {
        console.error("Error creating database table:", err);
    }
};
initDB();

// ================= API ROUTES (CRUD) =================

// CREATE: Add a new student
app.post('/api/students', async (req, res) => {
    const { student_id, full_name, course, year_level, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO students (student_id, full_name, course, year_level, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [student_id, full_name, course, year_level, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to create record. Student ID might already exist." });
    }
});

// READ: Get all students
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY id DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE: Edit student information
app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const { student_id, full_name, course, year_level, email } = req.body;
    try {
        const result = await pool.query(
            'UPDATE students SET student_id=$1, full_name=$2, course=$3, year_level=$4, email=$5 WHERE id=$6 RETURNING *',
            [student_id, full_name, course, year_level, email, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Remove a student record
app.delete('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM students WHERE id = $1', [id]);
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
