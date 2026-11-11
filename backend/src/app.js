const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    const isFileTooLarge = error.code === 'LIMIT_FILE_SIZE';
    const statusCode = isFileTooLarge ? 413 : 400;

    return res.status(statusCode).json({
      error: {
        code: isFileTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_MULTIPART',
        message: isFileTooLarge
          ? 'O arquivo excede o limite de 10 MiB.'
          : 'A requisição de upload é inválida.',
      },
    });
  }

  const statusCode = error.statusCode || 500;
  const isInternalError = statusCode >= 500;
  const knownInternalCodes = ['UPLOAD_FAILED', 'DOWNLOAD_FAILED', 'LIST_FAILED'];

  return res.status(statusCode).json({
    error: {
      code: isInternalError
        ? knownInternalCodes.includes(error.code) ? error.code : 'INTERNAL_ERROR'
        : error.code || 'REQUEST_FAILED',
      message: isInternalError ? 'Ocorreu uma falha interna.' : error.message,
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
