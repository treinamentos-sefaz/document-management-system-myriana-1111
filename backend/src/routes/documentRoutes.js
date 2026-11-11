const express = require('express');
const documentController = require('../controllers/documentController');
const upload = require('./uploadMiddleware');

const router = express.Router();

router.post('/upload', upload, documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;