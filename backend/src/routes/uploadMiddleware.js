const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const { storageDirectory } = require('../config/storage');

const maximumFileSize = 10 * 1024 * 1024;
const allowedTypesByExtension = {
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.txt': ['text/plain'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
};

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maximumFileSize,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = allowedTypesByExtension[extension];

    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error('O formato do arquivo não é permitido.');
      error.statusCode = 415;
      error.code = 'UNSUPPORTED_FILE_TYPE';
      return callback(error);
    }

    return callback(null, true);
  },
});

const uploadSingleFile = upload.single('file');

function parseSingleFile(req, res, next) {
  uploadSingleFile(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.message === 'Unexpected end of form' || error.message === 'Multipart: Boundary not found') {
      error.statusCode = 400;
      error.code = 'INVALID_MULTIPART';
      error.message = 'A requisição multipart é inválida.';
    }

    return next(error);
  });
}

module.exports = parseSingleFile;