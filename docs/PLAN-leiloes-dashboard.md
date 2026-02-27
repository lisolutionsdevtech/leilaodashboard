# Plano de Implementação: Dashboard de Leilões

Este documento define a estratégia para criar o Dashboard de Leilões em Next.js (App Router) + React + TypeScript, com Tailwind CSS e shadcn/ui.

## Contexto e Objetivo

Criar uma tela informativa de leilões que liste itens abertos vindos da API, com funcionalidades de busca, filtros por abas e visualização detalhada em um Dialog.

**Requisitos Chave:**
- Stack: Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui.
- Responsividade: Grid adaptável (mobile 1 col, md 2 col, lg 3-4 cols).
- Estado: Gerenciado em memória (React State) para busca e abas.
- Imagens: Configuração permissiva (remotePatterns curinga).
- Autenticação: Obter token via endpoint `/auth` usando credenciais de variáveis de ambiente.

---

## 1. Configuração do Projeto e Ambiente

### 1.1 Inicialização
- Criar projeto Next.js (se ainda não existir): `npx create-next-app@latest . --typescript --tailwind --eslint`.
- Limpar boilerplate padrão.
- Instalar `lucide-react` (ícones).

### 1.2 Shadcn/UI
- Inicializar shadcn: `npx shadcn-ui@latest init`.
- Adicionar componentes necessários:
  - `button`, `card`, `badge`, `tabs`, `dialog`, `scroll-area`, `skeleton`, `alert`, `input`.

### 1.3 Variáveis de Ambiente e Configuração
- Criar `.env.local`:
  - `API_BASE_URL=https://api.suporteleiloes.com.br`
  - `API_USER=...` (para obterToken)
  - `API_PASS=...` (para obterToken)
- Atualizar `next.config.js`:
  - Adicionar `images.remotePatterns` com hostname `*` (conforme solicitado).

---

## 2. Tipagem e Utilitários

### 2.1 Tipos TypeScript (`src/types/leilao.ts`)
- Definir interfaces baseadas na resposta da API:
  - `ApiDate`, `ImagemLeilao`, `LeilaoResumo`, `LeilaoDetalhe` (se diferir muito, ou usar a mesma com campos opcionais).
  - Tolerância a `null` conforme especificado.

### 2.2 Helpers (`src/utils/leilao.ts`)
- `formatarData(apiDate?: ApiDate): string`: Formatação amigável de data.
- `pegarImagemCapa(leilao: LeilaoResumo): string | null`: Lógica de prioridade (min > thumb > full > fallback).

---

## 3. Camada de Serviço (API & Auth)

### 3.1 Autenticação (`src/services/auth.ts`)
- `obterToken()`:
  - Verificar se há token válido em memória/cache (opcional, para evitar flood de login).
  - Se não, fazer POST em `/auth` (ou endpoint correspondente) com `API_USER` e `API_PASS`.
  - Retornar string `Bearer ${token}`.

### 3.2 Leilões (`src/services/api.ts`)
- `buscarLeiloesAbertos()`:
  - Obter token.
  - GET `/api/leiloes` com params: `page=1&limit=20&sortBy=dataProximoLeilao&descending=false&search=&status=0,1,2,3,4`.
  - Retornar `{ hoje: [], result: [] }`.
- `buscarLeilaoPorId(id: number)`:
  - Obter token.
  - GET `/api/leiloes/[id]`.
  - Retornar detalhes.

---

## 4. Componentes da Interface

### 4.1 UI Cards (`src/components/leilao/LeilaoCard.tsx`)
- Props: `leilao: LeilaoResumo`, `onClick: () => void`.
- Layout:
  - Imagem de capa (com aspect-ratio fixo para consistência).
  - Conteúdo: Título, Badges (Status, Destaque), Info (Data, Lotes, Visitas).
  - Hover effects para interatividade.

### 4.2 Dialog de Detalhes (`src/components/leilao/LeilaoDetalhesDialog.tsx`)
- Estado interno para controle de abas (`Tab` selecionada).
- Fetch data `swr` ou `useEffect` ao abrir (lazy load).
- Exibir `Skeleton` durante carregamento.
- Conteúdo das Abas:
  - **Visão Geral**: Descrição, stats básicos.
  - **Datas**: Lista de datas formatadas.
  - **Comitentes**: Lista com avatares.
  - **Leiloeiro/Classificação**: Informações adicionais.
  - **Estatísticas**: Lances, visitas, lote destaque.

### 4.3 Dashboard (`src/app/page.tsx` ou componente dedicado)
- **Estado**:
  - `busca`: string (input).
  - `abaAtiva`: 'hoje' | 'abertos'.
  - `leiloes`: dados da API.
  - `leilaoSelecionado`: ID ou objeto para o Dialog.
  - `loading`: boolean.
- **Header**: Título, Input de Busca, Botão Atualizar.
- **Filtro Client-side**:
  - Filtrar lista (`hoje` ou `result`) baseado no termo de busca (campos: titulo, codigo, descricao, etc).
- **Listagem**:
  - Grid responsiva iterando sobre os leilões filtrados.
  - Estados vazios ("Nenhum leilão encontrado").
- **Integração**: Dialog renderizado condicionalmente ou sempre presente controlado por `open` state.

---

## 5 plano de Verificação

### 5.1 Testes Manuais
- [ ] Verificar listagem inicial (carregamento e exibição).
- [ ] Testar filtro de busca (deve atualizar a lista instantaneamente).
- [ ] Alternar abas (Hoje/Abertos) e verificar contadores.
- [ ] Abrir Card e verificar carregamento do detalhe (skeleton -> conteúdo).
- [ ] Verificar responsividade em Mobile (375px) e Desktop (1024px+).
- [ ] Validar fallback de imagens quebradas ou inexistentes.

### 5.2 Validação de API
- [ ] Confirmar se o token está sendo gerado/enviado corretamente.
- [ ] Tratar erros de API (ex: token expirado, 500 server error) com Alerts amigáveis.
