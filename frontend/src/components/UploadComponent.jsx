import { useRef, useState } from 'react';

const maximumFileSize = 10 * 1024 * 1024;
const acceptedFormats = '.pdf,.docx,.txt,.png,.jpg,.jpeg';

export default function UploadComponent({ onUpload, uploading, error, successMessage }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const fileInput = useRef(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setValidationError('');

    if (file?.size > maximumFileSize) {
      setSelectedFile(null);
      setValidationError('O arquivo excede o limite de 10 MiB.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setValidationError('Selecione um arquivo para enviar.');
      return;
    }

    const uploaded = await onUpload(selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      setValidationError('');
      fileInput.current.value = '';
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker">
        <input
          ref={fileInput}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileChange}
          disabled={uploading}
          aria-describedby="file-guidance"
        />
        <span className="picker-symbol" aria-hidden="true">↑</span>
        <span className="picker-copy">
          <strong>{selectedFile ? selectedFile.name : 'Escolha um documento'}</strong>
          <span id="file-guidance">PDF, DOCX, TXT, PNG ou JPEG · até 10 MiB</span>
        </span>
        <span className="picker-action">Selecionar</span>
      </label>

      {validationError && <p className="form-message error-message" role="alert">{validationError}</p>}
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {successMessage && <p className="form-message success-message" role="status">{successMessage}</p>}

      <button className="primary-button" type="submit" disabled={uploading || !selectedFile}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
        {!uploading && <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}