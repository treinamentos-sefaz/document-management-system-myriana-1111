const path = require('node:path');

const storageDirectory = process.env.DMS_STORAGE_DIR
  ? path.resolve(process.env.DMS_STORAGE_DIR)
  : path.resolve(__dirname, '../../storage');

module.exports = { storageDirectory };