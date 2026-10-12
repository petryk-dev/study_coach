import multer from 'multer';
import { HttpError } from '../utils/httpError';

export const uploadPdf = multer({
  storage: multer.memoryStorage(), // keep in memory, never write to disk
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new HttpError(400, 'Only PDF files are supported', 'INVALID_FILE_TYPE'));
  },
}).single('file'); // the form field name must be "file"
