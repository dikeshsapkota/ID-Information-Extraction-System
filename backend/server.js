const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { preprocessImage } = require("./services/imageProcessor");
const { recognizeText } = require("./services/ocrService");
const { requireAccess } = require("./services/accessControl");
const {
  extractNepaliIdFields,
} = require("./services/aiExtractor");
const {
  listCitizens,
  saveCitizen,
} = require("./services/databaseService");
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
  fileFilter: (req, file, callback) => {
    const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!supportedTypes.has(file.mimetype)) {
      return callback(new Error("Unsupported file type. Upload a JPEG, PNG, or WebP image."));
    }
    return callback(null, true);
  },
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/extract-id", requireAccess, upload.single("idImage"), async (req, res) => {
  let imagePath;
  let processedImage;
  let stage = "upload validation";

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    imagePath = req.file.path;
    processedImage = path.join(uploadDir, `${req.file.filename}-processed.png`);

    stage = "image preprocessing";
    await preprocessImage(imagePath, processedImage);
    stage = "text recognition";
    const fullText = await recognizeText(processedImage);
    stage = "field extraction";
    const extraction = await extractNepaliIdFields(
      fullText,
      imagePath,
      req.file.mimetype
    );

    res.json({
      message: "ID extracted. Review the fields before saving.",
      extractedText: fullText,
      documentType: extraction.document_type,
      fields: extraction.fields,
      extractionMethod: extraction.extraction_method,
      warning: extraction.warning,
    });
  } catch (error) {
    console.error(`${stage} error:`, error);
    res.status(500).json({
      message: `ID ${stage} failed`,
      stage,
      error: error.message,
    });
  } finally {
    const filesToDelete = [imagePath, processedImage].filter(Boolean);
    await Promise.all(
      filesToDelete.map((file) => fs.promises.unlink(file).catch(() => {}))
    );
  }
});

app.post("/api/citizens", requireAccess, (req, res) => {
  try {
    const { extractedText, fields } = req.body;

    if (typeof extractedText !== "string" || !fields) {
      return res.status(400).json({ message: "Extracted text and fields are required" });
    }

    const saveResult = saveCitizen(extractedText, fields);
    return res.status(201).json({
      message: "Reviewed citizen record saved successfully",
      databaseId: saveResult.lastInsertRowid,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid citizen record",
      error: error.message,
    });
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

  if (error.message?.startsWith("Unsupported file type")) {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

app.get("/api/citizens", requireAccess, (req, res) => {
  try {
    const rows = listCitizens();
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
