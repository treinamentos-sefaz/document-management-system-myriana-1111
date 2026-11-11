const apiPrefix = '/api';

async function getErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function fetchJson(endpoint, options) {
  let response;

  try {
    response = await fetch(`${apiPrefix}${endpoint}`, options);
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const payload = await fetchJson('/upload', {
    method: 'POST',
    body: formData,
  });

  return payload.document;
}

export async function listDocuments() {
  const payload = await fetchJson('/documents');
  return payload.documents;
}

export async function downloadDocument(documentMetadata) {
  let response;

  try {
    response = await fetch(
      `${apiPrefix}/documents/${encodeURIComponent(documentMetadata.id)}/download`
    );
  } catch {
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const fileBlob = await response.blob();
  const downloadUrl = URL.createObjectURL(fileBlob);
  const link = window.document.createElement('a');
  link.href = downloadUrl;
  link.download = documentMetadata.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}