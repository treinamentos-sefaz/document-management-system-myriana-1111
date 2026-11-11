import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`;
}

function formatUploadDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getFileExtension(fileName) {
  return fileName.split('.').pop()?.toUpperCase() || 'ARQ';
}

export default function DocumentList({
  documents,
  isLoading,
  error,
  downloadError,
  downloadingIds,
  onRefresh,
  onDownload,
}) {
  return (
    <>
      <div className="list-heading">
        <div className="section-heading">
          <span className="section-index">02</span>
          <h2 id="documents-title">Arquivos disponíveis</h2>
        </div>
        <button className="quiet-button" type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {downloadError && <p className="list-error" role="alert">{downloadError}</p>}

      {isLoading ? (
        <div className="list-state" role="status">Carregando documentos...</div>
      ) : error ? (
        <div className="list-state error-state" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={onRefresh}>Tentar novamente</button>
        </div>
      ) : documents.length === 0 ? (
        <div className="list-state empty-state">
          <span className="empty-mark" aria-hidden="true">—</span>
          <p>Nenhum documento enviado</p>
          <span>Os arquivos adicionados aparecerão aqui.</span>
        </div>
      ) : (
        <ul className="document-list">
          {documents.map((document, index) => (
            <li className="document-row" key={document.id} style={{ '--row-index': index }}>
              <span className="file-type" aria-hidden="true">{getFileExtension(document.originalName)}</span>
              <div className="document-info">
                <strong className="document-name" title={document.originalName}>
                  {document.originalName}
                </strong>
                <span className="document-meta">
                  {formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatUploadDate(document.uploadedAt)}
                </span>
              </div>
              <DownloadButton
                document={document}
                downloading={downloadingIds.has(document.id)}
                onDownload={onDownload}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}