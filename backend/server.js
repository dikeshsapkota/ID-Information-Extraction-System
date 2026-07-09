const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Tesseract = require("tesseract.js");
const db = require("./database");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

function extractFields(text) {
  const cleanText = text
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[»|©~_]/g, " ")
    .trim();

  const idMatch = cleanText.match(/\d{4}\.\d{2}\.\d{5}/);

  let name = "Not detected";
  const fullNameIndex = cleanText.toLowerCase().indexOf("fullname");

  if (fullNameIndex !== -1) {
    const afterFullName = cleanText.slice(fullNameIndex, fullNameIndex + 80);
    const possibleName = afterFullName.match(/[A-Z]{4,}\s*[A-Z]{4,}/);

    if (possibleName) {
      name = possibleName[0]
        .replace(/DIKESH\s*SAPKOTA/i, "DIKESH SAPKOTA")
        .trim();
    }
  }

  let dob = "Not detected";

  const yearMatch = cleanText.match(/Year\s*([0-9]{4})/i);
  const monthMatch = cleanText.match(/Month\s*([A-Za-z]{3,})/i);
  const dayMatch = cleanText.match(/Day\s*([0-9]+)/i);

  if (yearMatch && monthMatch) {
    dob = `${yearMatch[1]}-${monthMatch[1]}-${
      dayMatch ? dayMatch[1] : "Not detected"
    }`;
  }

  const genderMatch = cleanText.match(/Sex\s*([A-Za-z]+)/i);
  const districtMatch = cleanText.match(/District\s*([A-Za-z]+)/i);
  const municipalityMatch = cleanText.match(/Municipality\s*([A-Za-z]+)/i);

  return {
    name,
    id_number: idMatch ? idMatch[0] : "Not detected",
    dob,
    gender: genderMatch ? genderMatch[1] : "Not detected",
    district: districtMatch ? districtMatch[1] : "Not detected",
    municipality: municipalityMatch ? municipalityMatch[1] : "Not detected",
  };
}

app.post("/api/extract-id", upload.single("idImage"), async (req, res) => {
  let imagePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    imagePath = req.file.path;

    const result = await Tesseract.recognize(imagePath, "eng");
    const fullText = result.data.text;

    const fields = extractFields(fullText);

    const stmt = db.prepare(`
      INSERT INTO citizens (
        full_text,
        name,
        id_number,
        dob,
        gender,
        district,
        municipality
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const saveResult = stmt.run(
      fullText,
      fields.name,
      fields.id_number,
      fields.dob,
      fields.gender,
      fields.district,
      fields.municipality
    );

    res.json({
      message: "ID extracted and saved successfully",
      databaseId: saveResult.lastInsertRowid,
      extractedText: fullText,
      fields,
    });
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({
      message: "OCR extraction failed",
      error: error.message,
    });
  } finally {
    if (imagePath) {
      fs.promises.unlink(imagePath).catch(() => {});
    }
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Image is too large. Please upload an image under 5MB."
          : error.message,
    });
  }

  return next(error);
});

app.get("/api/citizens", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM citizens ORDER BY id DESC").all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Database error",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
