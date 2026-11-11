const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../config/storage');

function getFilePath(storageKey) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storageKey)) {
    throw new Error('Chave de armazenamento inválida.');
  }

  return path.join(storageDirectory, storageKey);
}

async function openReadStream(storageKey) {
  const stream = fs.createReadStream(getFilePath(storageKey));

  try {
    await new Promise((resolve, reject) => {
      const onOpen = () => {
        stream.off('error', onError);
        resolve();
      };
      const onError = (error) => {
        stream.off('open', onOpen);
        reject(error);
      };

      stream.once('open', onOpen);
      stream.once('error', onError);
    });
    return stream;
  } catch (error) {
    stream.destroy();
    throw error;
  }
}

async function remove(storageKey) {
  try {
    await fsPromises.unlink(getFilePath(storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  openReadStream,
  remove,
};