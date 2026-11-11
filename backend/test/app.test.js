const { after, before, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.DMS_STORAGE_DIR = storageDirectory;

const app = require('../src/app');
const documentFileRepository = require('../src/repositories/documentFileRepository');

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  fs.rmSync(storageDirectory, { recursive: true, force: true });
  delete process.env.DMS_STORAGE_DIR;
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('envia, lista em ordem determinística e baixa documentos', async () => {
  const emptyListResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(emptyListResponse.status, 200);
  assert.deepStrictEqual((await emptyListResponse.json()).documents, []);

  const formData = new FormData();
  formData.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'notas.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'notas.txt');
  assert.strictEqual(document.mimeType, 'text/plain');
  assert.strictEqual(document.owner, 'demo-user');
  assert.strictEqual(document.size, Buffer.byteLength('conteudo de teste'));
  assert.ok(document.id);
  assert.ok(document.uploadedAt);
  assert.ok(!Object.hasOwn(document, 'storageKey'));

  const secondFormData = new FormData();
  secondFormData.append('file', new Blob(['segundo documento'], { type: 'text/plain' }), 'segundo.txt');
  const secondUploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: secondFormData,
  });
  assert.strictEqual(secondUploadResponse.status, 201);
  const { document: secondDocument } = await secondUploadResponse.json();

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  const { documents } = await listResponse.json();
  const expectedOrder = [document, secondDocument].sort((first, second) => {
    const dateDifference = Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt);
    return dateDifference || first.id.localeCompare(second.id);
  });
  assert.deepStrictEqual(documents.map((item) => item.id), expectedOrder.map((item) => item.id));

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(downloadResponse.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.match(downloadResponse.headers.get('content-disposition'), /notas\.txt/);
  assert.strictEqual(downloadResponse.headers.get('content-length'), String(document.size));
  assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');

  fs.unlinkSync(path.join(storageDirectory, document.id));
  const missingFileResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(missingFileResponse.status, 404);
  assert.strictEqual((await missingFileResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('rejeita upload sem arquivo e formato não permitido', async () => {
  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.strictEqual(missingFileResponse.status, 400);
  assert.strictEqual((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

  const formData = new FormData();
  formData.append('file', new Blob(['conteudo'], { type: 'application/octet-stream' }), 'arquivo.bin');
  const unsupportedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  assert.strictEqual(unsupportedResponse.status, 415);
  assert.strictEqual((await unsupportedResponse.json()).error.code, 'UNSUPPORTED_FILE_TYPE');
});

test('retorna 400 para multipart malformado', async () => {
  const malformedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=broken' },
    body: '--broken\r\nContent-Disposition: form-data; name="file"; filename="notas.txt"\r\nContent-Type: text/plain\r\n\r\nconteudo',
  });

  assert.strictEqual(malformedResponse.status, 400);
  assert.strictEqual((await malformedResponse.json()).error.code, 'INVALID_MULTIPART');
});

test('rejeita arquivos acima de 10 MiB e downloads inexistentes', async () => {
  const formData = new FormData();
  const oversizedContent = new Uint8Array(10 * 1024 * 1024 + 1);
  formData.append('file', new Blob([oversizedContent], { type: 'text/plain' }), 'grande.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  assert.strictEqual(uploadResponse.status, 413);
  assert.strictEqual((await uploadResponse.json()).error.code, 'FILE_TOO_LARGE');

  const downloadResponse = await fetch(`${baseUrl}/documents/inexistente/download`);
  assert.strictEqual(downloadResponse.status, 404);
  assert.strictEqual((await downloadResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('retorna UPLOAD_FAILED quando não consegue criar o diretório de armazenamento', async () => {
  fs.rmSync(storageDirectory, { recursive: true, force: true });
  fs.writeFileSync(storageDirectory, 'bloqueio');

  try {
    const formData = new FormData();
    formData.append('file', new Blob(['conteudo'], { type: 'text/plain' }), 'notas.txt');
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    assert.strictEqual(response.status, 500);
    const payload = await response.json();
    assert.strictEqual(payload.error.code, 'UPLOAD_FAILED');
    assert.strictEqual(payload.error.message, 'Ocorreu uma falha interna.');
  } finally {
    fs.rmSync(storageDirectory, { force: true });
    fs.mkdirSync(storageDirectory, { recursive: true });
  }
});

test('rejeita identificadores de download que não sejam UUIDs', async () => {
  const response = await fetch(`${baseUrl}/documents/${encodeURIComponent('../etc/passwd')}/download`);

  assert.strictEqual(response.status, 404);
  assert.strictEqual((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});

test('rejeita chave de armazenamento fora do formato UUID', async () => {
  await assert.rejects(
    documentFileRepository.openReadStream('../etc/passwd'),
    /Chave de armazenamento inválida\./
  );
});
