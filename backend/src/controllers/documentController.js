const documentService = require('../services/documentService');

async function uploadDocument(req, res, next) {
  try {
    const document = await documentService.createDocument(req.file);
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

async function listDocuments(req, res, next) {
  try {
    const documents = await documentService.listDocuments();
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const { document, content } = await documentService.getDocumentForDownload(req.params.id);
    res.attachment(document.originalName);
    res.type(document.mimeType);
    return res.status(200).send(content);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};