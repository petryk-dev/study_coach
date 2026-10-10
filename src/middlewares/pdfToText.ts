import type { Request, Response, NextFunction } from 'express';
import { extractPdfText } from '../services/pdf.service';
import { HttpError } from '../utils/httpError';
import { NOTES_MIN_CHARS } from '../schemas/deck.schema';

/**
 * For multipart uploads with a PDF in "file": replaces req.body with { title, text },
 * so the same validation and deck flow work for JSON and PDF requests.
 * JSON requests (no req.file) pass straight through.
 */
export async function pdfToText(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.file) return next();

  const text = await extractPdfText(req.file.buffer);
  // Scanned PDFs are images of pages, with no text layer to read
  if (!text) {
    throw new HttpError(
      422,
      "Couldn't find text in this PDF. Scanned PDFs aren't supported yet",
      'NO_TEXT_IN_PDF',
    );
  }

  // Same minimum as typed notes, but with a message that explains it's about the PDF
  if (text.length < NOTES_MIN_CHARS) {
    throw new HttpError(
      422,
      `This PDF has too little text to make flashcards (${text.length} characters found, at least ${NOTES_MIN_CHARS} needed)`,
      'PDF_TEXT_TOO_SHORT',
    );
  }

  const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title : undefined;
  req.body = {
    // Without a title, use the file name ("Biology notes.pdf" → "Biology notes")
    title: title ?? req.file.originalname.replace(/\.pdf$/i, '').slice(0, 120),
    text,
  };
  next();
}
