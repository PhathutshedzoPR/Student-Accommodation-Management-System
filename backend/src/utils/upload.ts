import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Local-disk storage for the scaffold. Swap this out for an S3/Cloudinary
// multer-storage adapter in production — nothing else in the codebase needs
// to change, since callers only ever use the `.filename` / resulting URL.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const ABS_UPLOAD_DIR = path.resolve(process.cwd(), UPLOAD_DIR);

if (!fs.existsSync(ABS_UPLOAD_DIR)) {
  fs.mkdirSync(ABS_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ABS_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, matches the complaint photo spec
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type. Use JPEG, PNG, WEBP or PDF.'));
  },
});

export function fileUrl(filename: string): string {
  return `/uploads/${filename}`;
}
