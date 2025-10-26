import Tesseract from 'tesseract.js';

export async function extractText(imagePath) {
  console.log('Running Tesseract on', imagePath);
  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: m => console.log(m)
  });
  return result.data.text;
}
