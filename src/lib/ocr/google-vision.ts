/**
 * Google Cloud Vision OCR Integration
 * 
 * Use this for scanned PDFs or image-based documents that pdf2json can't extract.
 * 
 * Setup:
 * 1. Enable Cloud Vision API in Google Cloud Console
 * 2. Create a service account and download the JSON key
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json in .env
 * 4. npm install @google-cloud/vision
 * 
 * Note: This incurs API costs. Use pdf2json first for digital PDFs.
 */

export interface OCRResult {
  text: string;
  confidence: number;
  pages: number;
}

/**
 * Perform OCR on an image or PDF buffer using Google Cloud Vision
 * 
 * @param buffer - The file buffer (image or PDF)
 * @param mimeType - The MIME type of the file
 * @returns Extracted text with confidence score
 */
export async function performOCR(buffer: Buffer, mimeType: string = 'application/pdf'): Promise<OCRResult> {
  // Check if Google Vision is configured
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'OCR not configured. Set GOOGLE_APPLICATION_CREDENTIALS in .env to enable Google Cloud Vision OCR.'
    );
  }

  // Stub implementation - returns empty result
  // Full implementation requires @google-cloud/vision package
  return {
    text: '',
    confidence: 0,
    pages: 1,
  };
}

/**
 * Check if OCR is available and configured
 */
export function isOCRAvailable(): boolean {
  return !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
