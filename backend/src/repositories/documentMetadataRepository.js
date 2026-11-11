const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findAll() {
  return [...documents.values()].sort((first, second) => {
    const dateDifference = Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt);
    return dateDifference || first.id.localeCompare(second.id);
  });
}

function findById(id) {
  return documents.get(id) || null;
}

module.exports = {
  save,
  findAll,
  findById,
};