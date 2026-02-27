# Dashboard de Leilões

Dashboard de leilões desenvolvido com Next.js 15, Tailwind CSS e Shadcn/UI.

## Funcionalidades

- **Listagem de Leilões**: Visualização em cards responsivos.
- **Busca Client-side**: Filtragem instantânea por título, código e comitente.
- **Abas**: Alternância entre leilões de "Hoje" e "Abertos".
- **Detalhes**: Dialog com informações completas (Abas de Visão Geral, Datas, Comitentes, etc).
- **Tipagem Forte**: TypeScript com interfaces baseadas na API real.

## Como Rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   Crie um arquivo `.env.local` na raiz com:
   ```env
   API_BASE_URL=https://api.suporteleiloes.com.br
   API_USER=seu_usuario
   API_PASS=sua_senha
   ```

3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:3000`.

## Estrutura do Projeto

- `src/app`: Páginas e Route Handlers (API Proxy).
- `src/components/leilao`: Componentes específicos de negócio (Card, Dialog).
- `src/components/ui`: Componentes reutilizáveis (Shadcn).
- `src/services`: Lógica de API e Autenticação.
- `src/types`: Definições TypeScript.
- `src/utils`: Helpers (formatação de data, imagens).
