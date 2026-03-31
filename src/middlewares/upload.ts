import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import fs from 'fs';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

// 첨부파일 저장 경로
const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');

// 허용 확장자 (첨부파일용)
const ALLOWED_EXT = [
  // images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  // documents
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  // archive
  '.zip',
  // csv
  '.csv',
];

// storage 설정
let storage;

if (process.env.STORAGE_TYPE === 's3') {
  // S3 저장
  storage = multerS3({
    s3,
    bucket: process.env.S3_BUCKET!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      if (!ALLOWED_EXT.includes(ext)) {
        const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
        error.message = '허용되지 않은 파일 형식입니다.';
        return cb(error, '');
      }

      const filename = `uploads/${crypto.randomUUID()}${ext}`;
      cb(null, filename);
    },
  });
} else {
  // 로컬 저장
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();

      if (!ALLOWED_EXT.includes(ext)) {
        const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
        error.message = '허용되지 않은 파일 형식입니다.';
        return cb(error, '');
      }

      const filename = `${crypto.randomUUID()}${ext}`;
      cb(null, filename);
    },
  });
}

// MIME 타입 검사 (너무 엄격하지 않게)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!file.mimetype) {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    error.message = '잘못된 파일입니다.';
    return cb(error);
  }

  cb(null, true);
};

// 파일 크기 제한 (10MB)
const limits = {
  fileSize: 10 * 1024 * 1024,
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

// export const uploadAttachments = upload.array('files', 5);

export const uploadImage = upload.single('file');

export const uploadCsv = upload.single('file');
