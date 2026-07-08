const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

function extractFields(text) {
  const idMatch = text.match(/\b\d{6,}\b/);
  const dobMatch = text.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b|\b\d{2}[-/]\d{2}[-/]\d{4}\b/);

  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  return {
    name: lines[0] || "Not detected",
    id_number: idMatch ? idMatch[0] : "Not detected",
    dob: dobMatch ? dobMatch[0] : "Not detected",
  };
}

app.post("/api/extract-id", upload.single("idImage"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    const result = await Tesseract.recognize(imagePath, "eng");
    const fullText = result.data.text;

    const fields = extractFields(fullText);

    const [saveResult] = await db.query(
      "INSERT INTO citizens (full_text, name, id_number, dob) VALUES (?, ?, ?, ?)",
      [fullText, fields.name, fields.id_number, fields.dob]
    );

    res.json({
      message: "ID extracted and saved successfully",
      databaseId: saveResult.insertId,
      extractedText: fullText,
      fields,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OCR extraction failed" });
  }
});

app.get("/api/citizens", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM citizens ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.log("MySQL error:", error.message);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Backend running on port ${process.env.PORT}`);
});