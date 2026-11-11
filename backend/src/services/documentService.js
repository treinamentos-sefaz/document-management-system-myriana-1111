const documentFileRepository = require('../repositories/documentFileRepository');
const documentMetadataRepository = require('../repositories/documentMetadataRepository');

function createServiceError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function createUploadFailure(message) {
  return createServiceError(500, 'UPLOAD_FAILED', message);
}

function toPublicDocument(document) {
  const { storageKey, ...publicDocument } = document;
  return publicDocument;
}

function createDocumentMetadata(file) {
  if (file.size === 0) {
    throw createServiceError(400, 'FILE_REQUIRED', 'O arquivo enviado está vazio.');
  }

  return {
    id: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'demo-user',
    storageKey: file.filename,
  };
}

async function removeUploadedFile(fileName) {
  try {
    await documentFileRepository.remove(fileName);
  } catch {
    throw createUploadFailure('Não foi possível registrar ou limpar o documento.');
  }
}

async function saveDocumentMetadata(file) {
  try {
    const metadata = createDocumentMetadata(file);
    return toPublicDocument(documentMetadataRepository.save(metadata));
  } catch (error) {
    await removeUploadedFile(file.filename);

    if (error.statusCode) {
      throw error;
    }

    throw createUploadFailure('Não foi possível registrar o documento.');
  }
}

async function createDocument(file) {
  if (!file) {
    throw createServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  return saveDocumentMetadata(file);
}

async function listDocuments() {
  return documentMetadataRepository.findAll().map(toPublicDocument);
}

function findDocumentOrThrow(id) {
  const document = documentMetadataRepository.findById(id);

  if (!document) {
    throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return document;
}

async function openDocumentStream(storageKey) {
  try {
    return await documentFileRepository.openReadStream(storageKey);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    throw createServiceError(500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
  }
}

async function getDocumentForDownload(id) {
  const document = findDocumentOrThrow(id);
  const stream = await openDocumentStream(document.storageKey);

  return { document: toPublicDocument(document), stream };
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};