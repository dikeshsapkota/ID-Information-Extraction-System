const Tesseract = require("tesseract.js");

function cleanOcrText(text) {
  return text
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[|~©»¦�]/g, " ")
    .replace(/_{2,}/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+([,;:])/g, "$1")
    .replace(/([,;:])(?=\S)/g, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

async function recognizeText(imagePath) {
  const result = await Tesseract.recognize(
    imagePath,
    process.env.OCR_LANGUAGES || "eng+nep",
    {
      logger: (message) => console.log(message),
      tessedit_pageseg_mode: 6,
      preserve_interword_spaces: 1,
    }
  );

  return cleanOcrText(result.data.text);
}

module.exports = { cleanOcrText, recognizeText };
