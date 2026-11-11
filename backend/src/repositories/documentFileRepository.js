const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/storage');

function getFilePath(storageKey) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storageKey)) {
    throw new Error('Chave de armazenamento inválida.');
  }

  return path.join(storageDirectory, storageKey);
}

async function read(storageKey) {
  return fs.readFile(getFilePath(storageKey));
}

async function remove(storageKey) {
  try {
    await fs.unlink(getFilePath(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  read,
  remove,
};