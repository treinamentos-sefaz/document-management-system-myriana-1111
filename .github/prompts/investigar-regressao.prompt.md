---
name: investigar-regressao
description: "Investiga uma regressão do DMS com testes e evidências, sem modificar arquivos."
argument-hint: "Descreva o comportamento observado e o resultado esperado"
agent: dms-qa
---

# Investigar regressão no DMS

Investigue o cenário informado: `${input:cenario:descreva o comportamento observado e o resultado esperado}`.

Compare o resultado relatado com a especificação em `docs/specs` e com o comportamento implementado. Encontre o teste mais próximo, execute primeiro a validação específica disponível e, se necessário, rode `npm test --prefix backend` para o backend.

Não edite arquivos nem amplie o escopo para refatorações. Apresente passos de reprodução, resultado atual e esperado, evidências dos testes, arquivos relevantes e lacunas de validação. Diferencie claramente uma regressão reproduzida de uma hipótese ainda não confirmada.