import { InvalidPDFException, PasswordException, PDFParse } from 'pdf-parse';
import { HttpError } from '../utils/httpError';

/** Extracts the plain text of a PDF held in memory (pdf-parse v2 API). */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // The browser-reported mimetype can be wrong, so check the PDF signature too
  if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new HttpError(400, 'This file is not a valid PDF', 'INVALID_PDF');
  }

  const parser = new PDFParse({ data: buffer });
  try {
    // pageJoiner: '' turns off the default "-- 1 of 3 --" markers between pages
    const { text } = await parser.getText({ pageJoiner: '' });
    // Collapse the extra spaces and blank lines PDFs tend to produce, but keep paragraph breaks
    return text
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (err) {
    if (err instanceof PasswordException) {
      throw new HttpError(400, 'This PDF is password-protected', 'PDF_PASSWORD_PROTECTED');
    }
    if (err instanceof InvalidPDFException) {
      throw new HttpError(400, 'This file is not a valid PDF', 'INVALID_PDF');
    }
    throw err;
  } finally {
    await parser.destroy();
  }
}
