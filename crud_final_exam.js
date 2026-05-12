import express from "express";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database Pool (Using your structure)
const pool = mysql.createPool({
  uri: process.env.MYSQL_URL, // Use the full URI from Aiven for simplicity
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- CRUD ROUTES ---

// 1. READ - Get all students
app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students");
    res.send(generateHTML(rows));
  } catch (err) {
    res.status(500).send("Database Error: " + err.message);
  }
});

// 2. CREATE - Add student
app.post("/add", async (req, res) => {
  const { student_id, full_name, course, year_level, email } = req.body;
  try {
    await pool.query(
      "INSERT INTO students (student_id, full_name, course, year_level, email) VALUES (?, ?, ?, ?, ?)",
      [student_id, full_name, course, year_level, email]
    );
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Create Error: " + err.message);
  }
});

// 3. UPDATE - Show Edit Form
app.get("/edit/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).send("Student not found");
    res.send(generateEditForm(rows[0]));
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// 3b. UPDATE - Logic
app.post("/update/:id", async (req, res) => {
  const { student_id, full_name, course, year_level, email } = req.body;
  try {
    await pool.query(
      "UPDATE students SET student_id=?, full_name=?, course=?, year_level=?, email=? WHERE id=?",
      [student_id, full_name, course, year_level, email, req.params.id]
    );
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Update Error: " + err.message);
  }
});

// 4. DELETE
app.get("/delete/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM students WHERE id = ?", [req.params.id]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Delete Error: " + err.message);
  }
});

// --- HTML GENERATORS (Frontend) ---
function generateHTML(students) {
  let rows = students.map(s => `
    <tr>
      <td>${s.student_id}</td>
      <td>${s.full_name}</td>
      <td>${s.course}</td>
      <td>${s.year_level}</td>
      <td>${s.email}</td>
      <td>
        <a href="/edit/${s.id}">Edit</a> | 
        <a href="/delete/${s.id}" onclick="return confirm('Delete?')">Delete</a>
      </td>
    </tr>`).join('');

  return `<html><head><title>Student MS</title><style>body{font-family:sans-serif;margin:40px;}table{width:100%;border-collapse:collapse;}th,td{padding:10px;border:1px solid #ddd;}</style></head>
  <body>
    <h2>Student Information System</h2>
    <form action="/add" method="POST">
      <input name="student_id" placeholder="ID" required>
      <input name="full_name" placeholder="Name" required>
      <input name="course" placeholder="Course" required>
      <input name="year_level" placeholder="Year" required>
      <input name="email" type="email" placeholder="Email" required>
      <button type="submit">Add Student</button>
    </form>
    <table><tr><th>ID</th><th>Name</th><th>Course</th><th>Year</th><th>Email</th><th>Action</th></tr>${rows}</table>
  </body></html>`;
}

function generateEditForm(s) {
    return `<html><body><h2>Edit Student</h2>
    <form action="/update/${s.id}" method="POST">
      <input name="student_id" value="${s.student_id}"><br>
      <input name="full_name" value="${s.full_name}"><br>
      <input name="course" value="${s.course}"><br>
      <input name="year_level" value="${s.year_level}"><br>
      <input name="email" value="${s.email}"><br>
      <button type="submit">Update</button>
    </form></body></html>`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
