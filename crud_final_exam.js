require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection using your MYSQL_URL from Render
let pool;
try {
    pool = mysql.createPool(process.env.MYSQL_URL);
    console.log("Connected to Aiven MySQL");
} catch (err) {
    console.error("Database Connection Failed:", err);
}

// Create table if it doesn't exist
const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                course VARCHAR(100) NOT NULL,
                year_level VARCHAR(20) NOT NULL,
                email VARCHAR(100) NOT NULL
            );
        `);
    } catch (err) {
        console.error("Table Creation Error:", err);
    }
};
initDB();

// CREATE
app.post('/api/students', async (req, res) => {
    const { student_id, full_name, course, year_level, email } = req.body;
    try {
        await pool.query(
            'INSERT INTO students (student_id, full_name, course, year_level, email) VALUES (?, ?, ?, ?, ?)',
            [student_id, full_name, course, year_level, email]
        );
        res.status(201).json({ message: "Success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ
app.get('/api/students', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const { student_id, full_name, course, year_level, email } = req.body;
    try {
        await pool.query(
            'UPDATE students SET student_id=?, full_name=?, course=?, year_level=?, email=? WHERE id=?',
            [student_id, full_name, course, year_level, email, id]
        );
        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE
app.delete('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM students WHERE id = ?', [id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
