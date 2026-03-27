import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request } from 'express';

// 첨부파일 저장 경로
const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');

// 확인 후 폴더가 없다면 생성
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXT.includes(ext)) {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      error.message = '허용되지 않은 파일 형식입니다.';
      return cb(error, '');
    }

    // 원본명 + 랜덤값 (확장자 유지)
    const filename = `${crypto.randomUUID()}${ext}`;
    cb(null, filename);
  },
});

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

export const uploadImage = upload.single('image');

export const uploadCsv = upload.single('file');
