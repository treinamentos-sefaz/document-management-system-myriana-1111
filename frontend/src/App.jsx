import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setLoadError('');

    listDocuments()
      .then((items) => {
        if (isCurrent) {
          setDocuments(items);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshToken]);

  async function handleUpload(file) {
    setUploadError('');
    setUploadSuccess('');
    setIsUploading(true);

    try {
      await uploadDocument(file);
      setUploadSuccess('Documento enviado.');
      setRefreshToken((token) => token + 1);
      return true;
    } catch (error) {
      setUploadError(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setDownloadError('');

    try {
      await downloadDocument(document);
    } catch (error) {
      setDownloadError(error.message);
    } finally {
      setDownloadingId('');
    }
  }

  function refreshDocuments() {
    setRefreshToken((token) => token + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">Pasta local</span>
        </a>
        <div className="account-indicator">
          <span className="account-dot" aria-hidden="true" />
          <span>demo-user</span>
        </div>
      </header>

      <main className="workspace" id="inicio">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">DOCUMENT MANAGEMENT SYSTEM</p>
            <h1 id="page-title">Documentos</h1>
            <p className="page-subtitle">Arquivos da pasta compartilhada</p>
          </div>
          <div className="document-count" aria-live="polite">
            <span className="count-number">{documents.length.toString().padStart(2, '0')}</span>
            <span className="count-label">{documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
          </div>
        </section>

        <div className="content-grid">
          <section className="upload-section" aria-labelledby="upload-title">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-title">Adicionar arquivo</h2>
            </div>
            <UploadComponent
              onUpload={handleUpload}
              uploading={isUploading}
              error={uploadError}
              successMessage={uploadSuccess}
            />
          </section>

          <section className="documents-section" aria-labelledby="documents-title">
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              error={loadError}
              downloadError={downloadError}
              downloadingId={downloadingId}
              onRefresh={refreshDocuments}
              onDownload={handleDownload}
            />
          </section>
        </div>
      </main>
      <footer className="app-footer">
        <span>Armazenamento local</span>
        <span className="footer-separator" aria-hidden="true">/</span>
        <span>Metadados desta sessão</span>
      </footer>
    </div>
  );
}