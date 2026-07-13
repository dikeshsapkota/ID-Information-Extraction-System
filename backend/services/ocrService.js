const Tesseract = require("tesseract.js");

function cleanOcrText(text) {
  return text
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[|~©»¦�]/g, " ")
    .replace(/_{2,}/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/[\t ]+/g, " ")
        .replace(/\s+([,;:])/g, "$1")
        .replace(/([,;:])(?=\S)/g, "$1 ")
        .trim()
    )
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function recognizeText(imagePath) {
  const worker = await Tesseract.createWorker(
    process.env.OCR_LANGUAGES || "eng+nep",
    1,
    {
      logger: (message) => {
        if (process.env.OCR_DEBUG === "true") console.log(message);
      },
    }
  );

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    const automatic = await worker.recognize(imagePath, { rotateAuto: true });
    const candidates = [automatic.data];

    if (automatic.data.confidence < 50) {
      const clockwise = await worker.recognize(imagePath, {
        rotateRadians: Math.PI / 2,
      });
      candidates.push(clockwise.data);

      if (clockwise.data.confidence < 50) {
        const counterclockwise = await worker.recognize(imagePath, {
          rotateRadians: -Math.PI / 2,
        });
        candidates.push(counterclockwise.data);
      }
    }

    const best = candidates.reduce((current, candidate) =>
      candidate.confidence > current.confidence ? candidate : current
    );

    return cleanOcrText(best.text);
  } finally {
    await worker.terminate();
  }
}

module.exports = { cleanOcrText, recognizeText };
