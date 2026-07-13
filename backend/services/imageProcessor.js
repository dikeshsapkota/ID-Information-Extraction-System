const sharp = require("sharp");

async function preprocessImage(inputPath, outputPath) {
  const image = sharp(inputPath, { failOn: "warning" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const resize = width > 0 && width < 1800 ? { width: 1800, withoutEnlargement: false } : null;

  let pipeline = image
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1 });

  if (resize) {
    pipeline = pipeline.resize(resize);
  }

  await pipeline.png({ compressionLevel: 8 }).toFile(outputPath);

  return outputPath;
}

module.exports = { preprocessImage };
