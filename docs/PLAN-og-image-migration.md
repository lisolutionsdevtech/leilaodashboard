# Plano de Migração: Geração de Imagem Server-Side (@vercel/og)

Este plano descreve a migração da lógica de geração de cartazes de leilão do navegador (Client-Side) para o servidor (Edge Functions) utilizando a biblioteca `@vercel/og` (Satori).

## User Review Required

> [!IMPORTANT]
> A renderização no servidor (Satori) exige que todas as fontes customizadas e imagens externas sejam carregadas via `fetch` e convertidas para `ArrayBuffer` ou Base64.
> 
> Fontes a serem baixadas dinamicamente:
> - `Bodoni Moda` (Italic, 900)
> - `Jost` (Regular, Bold, Black)

## Proposed Changes

### [Backend] API Route
#### [NEW] `src/app/api/og/leilao/route.tsx`
- Criar a rota de API que recebe os parâmetros do leilão via Query String.
- Implementar o carregamento de fontes via Google Fonts API dinamicamente.
- Re-implementar o layout do `CartazContent` em `720x982` utilizando apenas as propriedades de CSS suportadas pelo Satori.
- Retornar o `ImageResponse` da Vercel.

### [Frontend] Hook de Compartilhamento
#### [NEW] `src/hooks/useSharePoster.ts`
- Implementar a função que constrói a URL da API com `URLSearchParams`.
- Converter o retorno da API para `Blob` e depois para `File`.
- Integrar com a `Web Share API` (`navigator.share`).
- Adicionar estados de `loading` e `error`.

### [Frontend] Componente de Visualização
#### [MODIFY] `src/components/leilao/CartazLeilaoResumo.tsx`
- Atualizar o botão de compartilhar para utilizar o novo hook `useSharePoster`.
- (Opcional) Manter a pré-visualização em tela, mas remover a dependência do `html2canvas` para a exportação real.

## Verification Plan

### Automated Tests
- Testar a rota de API diretamente no navegador passando parâmetros mockados.
- Verificar o log de erros do Satori se houver CSS não suportado.

### Manual Verification
- Testar o compartilhamento em um iPhone (Safari) e Android (Chrome) para validar a consistência das fontes.
- Validar se o fallback do logo funciona quando a imagem externa falha.
