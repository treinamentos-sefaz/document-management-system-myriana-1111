const documentFileRepository = require('../repositories/documentFileRepository');
const documentMetadataRepository = require('../repositories/documentMetadataRepository');

function createServiceError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function toPublicDocument(document) {
  const { storageKey, ...publicDocument } = document;
  return publicDocument;
}

async function createDocument(file) {
  if (!file) {
    throw createServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    if (file.size === 0) {
      throw createServiceError(400, 'FILE_REQUIRED', 'O arquivo enviado está vazio.');
    }

    const document = {
      id: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: 'demo-user',
      storageKey: file.filename,
    };

    return toPublicDocument(documentMetadataRepository.save(document));
  } catch (error) {
    try {
      await documentFileRepository.remove(file.filename);
    } catch {
      throw createServiceError(500, 'UPLOAD_FAILED', 'Não foi possível registrar ou limpar o documento.');
    }

    if (error.statusCode) {
      throw error;
    }

    throw createServiceError(500, 'UPLOAD_FAILED', 'Não foi possível registrar o documento.');
  }
}

async function listDocuments() {
  return documentMetadataRepository.findAll().map(toPublicDocument);
}

async function getDocumentForDownload(id) {
  const document = documentMetadataRepository.findById(id);

  if (!document) {
    throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  try {
    const content = await documentFileRepository.read(document.storageKey);
    return { document: toPublicDocument(document), content };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    throw createServiceError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
  }
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};