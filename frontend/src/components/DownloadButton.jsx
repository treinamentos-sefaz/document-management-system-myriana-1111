export default function DownloadButton({ document, downloading, onDownload }) {
  return (
    <button
      className="download-button"
      type="button"
      onClick={() => onDownload(document)}
      disabled={downloading}
      aria-label={`Baixar ${document.originalName}`}
    >
      {downloading ? 'Baixando...' : 'Baixar'}
      {!downloading && <span aria-hidden="true">↓</span>}
    </button>
  );
}