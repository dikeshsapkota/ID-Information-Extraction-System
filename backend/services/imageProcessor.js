const sharp = require("sharp");

async function preprocessImage(inputPath, outputPath) {
  await sharp(inputPath)
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(160)
    .toFile(outputPath);

  return outputPath;
}

module.exports = { preprocessImage };
