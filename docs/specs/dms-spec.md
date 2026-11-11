# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para enviar, listar e baixar documentos armazenados no filesystem local, com metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Enviar um documento por requisição.
- Listar todos os documentos registrados, do mais recente ao mais antigo.
- Baixar um documento pelo identificador.
- Associar os documentos ao usuário de demonstração `demo-user`.
- Exibir no frontend o fluxo de envio, listagem e download usando a API do backend.

### Fora do escopo

- Autenticação, autorização e isolamento de documentos por usuário.
- Armazenamento em banco de dados, nuvem ou provedor externo.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Upload múltiplo e paginação da listagem.
- Persistência durável dos metadados após reiniciar o backend.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento. | Um arquivo válido enviado no campo `file` é gravado localmente e retorna `201` com seus metadados públicos. |
| RF-02 | O usuário pode listar os documentos registrados. | A API retorna `200` e todos os metadados públicos, ordenados por data de envio decrescente; sem documentos, retorna uma lista vazia. |
| RF-03 | O usuário pode baixar um documento pelo identificador. | Um identificador existente retorna o conteúdo binário como anexo; um identificador inexistente retorna `404`. |
| RF-04 | O sistema valida o arquivo recebido. | A requisição exige exatamente um arquivo, de formato permitido, com tamanho máximo de 10 MiB; arquivos inválidos não são registrados. |
| RF-05 | Cada documento recebe metadados gerados pelo sistema. | O identificador é UUID, a data é gerada pelo backend e o dono é `demo-user`; o cliente não define esses valores. |
| RF-06 | A listagem é global nesta fase. | Todos os documentos registrados aparecem na mesma listagem, sem filtro por dono. |
| RF-07 | O sistema trata falha ao registrar metadados após gravar o arquivo. | O backend tenta remover o arquivo recém-gravado e retorna erro; não deve anunciar sucesso. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são gravados exclusivamente no filesystem local em `backend/storage`, usando `multer` com `diskStorage`. |
| RNF-02 | O limite de tamanho inicial é 10 MiB (10 × 1024 × 1024 bytes) por arquivo. |
| RNF-03 | Os formatos iniciais permitidos são PDF, DOCX, TXT, PNG e JPEG. A validação deve considerar extensão e tipo MIME declarados, ambos tratados como entrada não confiável. |
| RNF-04 | Os metadados ficam em memória. Reiniciar o processo limpa o registro de documentos; arquivos locais remanescentes podem ficar órfãos e não são listáveis nem baixáveis pela API. |
| RNF-05 | Nomes físicos são gerados pelo sistema e não derivados diretamente do nome recebido. O caminho/chave interna de armazenamento nunca é exposto pela API. |
| RNF-06 | Configurações operacionais, como a porta HTTP, são fornecidas por variáveis de ambiente conforme 12-Factor App. O diretório de armazenamento permanece local e conforme a restrição do projeto. |
| RNF-07 | Falhas HTTP são tratadas na fronteira da API, sem retornar stack traces, caminhos locais ou detalhes internos ao cliente. Mensagens destinadas ao usuário são em português. |
| RNF-08 | O backend usa Node.js e Express em CommonJS; o frontend usa React e Vite em JavaScript, sem TypeScript nesta fase. |
| RNF-09 | Os testes do backend usam o runner nativo `node:test`. |

## 5. Modelo de dados

Os metadados públicos representam um documento. `storageKey` é dado exclusivamente interno do repositório e não deve ser enviado ao cliente.

| Campo | Tipo | Visibilidade | Descrição |
| --- | --- | --- | --- |
| `id` | string (UUID) | Público | Identificador único gerado pelo backend. |
| `originalName` | string | Público | Nome original fornecido no upload, usado para apresentação e download. |
| `mimeType` | string | Público | Tipo MIME validado e associado ao arquivo. |
| `size` | number (inteiro) | Público | Tamanho do arquivo em bytes. |
| `uploadedAt` | string (ISO 8601) | Público | Data e hora do upload geradas pelo backend em UTC. |
| `owner` | string | Público | Identificador fixo `demo-user` nesta fase. |
| `storageKey` | string | Interno | Nome gerado para localizar o arquivo dentro de `backend/storage`; nunca é um caminho fornecido pelo cliente. |

Não há entidade persistente de usuário nesta fase. O dono fixo é uma convenção de demonstração, não uma identidade autenticada.

## 6. Contratos de API

### Convenções

- O backend expõe as rotas sem prefixo: `/upload` e `/documents...`.
- No desenvolvimento, o frontend chama as mesmas rotas sob `/api` (por exemplo, `/api/documents`); o proxy do Vite remove `/api` antes de encaminhar ao backend.
- As respostas JSON usam `application/json; charset=utf-8`.
- Erros usam o formato `{ "error": { "code": "...", "message": "..." } }`. `code` é estável para tratamento pelo cliente; `message` é uma mensagem segura em português.
- O nome original é usado somente como metadado e sugestão de nome no download. Nunca deve determinar o caminho físico.

### `POST /upload`

Envia um arquivo e cria os metadados correspondentes.

**Entrada**

- `Content-Type: multipart/form-data`.
- Um único campo de arquivo obrigatório, chamado `file`.
- Formatos aceitos: PDF (`.pdf`, `application/pdf`), DOCX (`.docx`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`), TXT (`.txt`, `text/plain`), PNG (`.png`, `image/png`) e JPEG (`.jpg` ou `.jpeg`, `image/jpeg`). Extensão e MIME declarado devem corresponder a um formato permitido.
- Tamanho máximo: 10 MiB. O limite é inclusivo.
- `id`, `uploadedAt`, `owner` e nome físico são gerados pelo servidor; não são parâmetros de entrada.

**Sucesso**

- `201 Created`
- Corpo:

```json
{
  "document": {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "mimeType": "application/pdf",
    "size": 12345,
    "uploadedAt": "2026-11-11T12:00:00.000Z",
    "owner": "demo-user"
  }
}
```

**Erros**

| Status | Código | Quando |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Campo `file` ausente, vazio ou requisição multipart inválida. |
| `413` | `FILE_TOO_LARGE` | Arquivo acima de 10 MiB. |
| `415` | `UNSUPPORTED_FILE_TYPE` | Extensão ou tipo MIME não permitido/incompatível. |
| `500` | `UPLOAD_FAILED` | Falha ao gravar arquivo ou registrar metadados. O arquivo gravado deve ser removido se o registro falhar. |

### `GET /documents`

Lista todos os documentos registrados em memória, sem filtro por dono e sem paginação. A ordem é `uploadedAt` decrescente; em empate, usar `id` crescente para manter ordenação determinística.

**Sucesso**

- `200 OK`
- Corpo:

```json
{
  "documents": [
    {
      "id": "uuid",
      "originalName": "relatorio.pdf",
      "mimeType": "application/pdf",
      "size": 12345,
      "uploadedAt": "2026-11-11T12:00:00.000Z",
      "owner": "demo-user"
    }
  ]
}
```

Quando não houver documentos, `documents` é `[]`. A resposta nunca inclui `storageKey`.

**Erros**

| Status | Código | Quando |
| --- | --- | --- |
| `500` | `LIST_FAILED` | Falha inesperada ao consultar os metadados. |

### `GET /documents/:id/download`

Retorna o conteúdo binário do documento identificado por `id`.

**Sucesso**

- `200 OK` com bytes do arquivo.
- `Content-Type` corresponde ao `mimeType` registrado.
- `Content-Disposition: attachment` inclui o nome original como nome sugerido, codificado de forma segura para cabeçalho HTTP.
- `Content-Length` corresponde ao tamanho registrado quando disponível.

**Erros**

| Status | Código | Quando |
| --- | --- | --- |
| `404` | `DOCUMENT_NOT_FOUND` | ID não registrado ou arquivo local correspondente não encontrado. |
| `500` | `DOWNLOAD_FAILED` | Falha de leitura diferente de arquivo inexistente. |

Nenhuma resposta de erro deve conter o caminho físico do arquivo.

## 7. Decisões arquiteturais

### Backend

Manter Clean Architecture simples dentro de `backend/src`, com dependências direcionadas para dentro:

`routes -> controllers -> services -> repositories`

- `routes/`: registra endpoints e middleware de entrada, incluindo a configuração de `multer` com `diskStorage`; delega ao controller.
- `controllers/`: valida a forma básica da requisição, invoca serviços e traduz resultados/erros para HTTP.
- `services/`: concentra as regras de upload, validação, criação de metadados, ordenação e download; coordena a compensação de falha entre arquivo e metadados.
- `repositories/`: encapsula o registro de metadados em memória e o acesso ao arquivo local. Não conhece Express nem constrói respostas HTTP.

Os metadados permanecem em memória e os arquivos em `backend/storage`; não adicionar banco de dados nem armazenamento remoto.

### Frontend

- Usar componentes funcionais React e a organização existente em `components/`, `pages/` e `services/`.
- Centralizar chamadas `fetch` à API na camada de serviços do frontend.
- Usar o prefixo `/api` no desenvolvimento, conforme proxy já configurado no Vite.
- Apresentar estados de carregamento, sucesso, lista vazia e erro para upload, listagem e download.
- Exibir mensagens ao usuário em português e não presumir autenticação ou seleção real de usuário.

### Convenções

- Símbolos de código em inglês; mensagens ao usuário em português.
- Manter funções pequenas, tratar erros nos limites e preferir dependências já existentes.
- Não quebrar a rota de saúde existente.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Esta especificação não inclui a implementação dos arquivos de backend ou frontend.

1. Preparar configuração local de armazenamento, limites de upload e middleware `multer` com `diskStorage` em `backend/storage`, usando nomes físicos gerados pelo sistema.
2. Implementar o repositório local de arquivos e o repositório em memória para metadados, incluindo remoção compensatória se o cadastro falhar.
3. Implementar serviços e rotas de upload, listagem e download conforme os contratos, com tradução uniforme de erros e testes backend usando `node:test`.
4. Implementar a interface React para enviar, listar e baixar documentos, consumindo a API pelo prefixo `/api` e exibindo estados de sucesso, vazio e erro.
5. Validar os fluxos ponta a ponta e os limites: formatos aceitos/rejeitados, tamanho máximo, lista vazia/ordenada, download existente/inexistente, falhas de filesystem e comportamento após reinício do backend.