# Plano de Implementação: PWA (Progressive Web App)

Este plano descreve as etapas para transformar a Landpage em um PWA instalável, utilizando tecnologias modernas compatíveis com Next.js 15+ e React 19.

## Overview
O objetivo é aumentar o engajamento do usuário permitindo que a Landpage seja instalada como um aplicativo nativo (móbile e desktop) e funcione de forma resiliente em conexões lentas.

## User Review Required

> [!NOTE]
> **Decisões Tomadas:**
> 1. **Escopo:** Funcionalidades básicas (instalação e manifesto). [CONFIRMADO]
> 2. **Ícones:** Gerar ícones temporários. [CONFIRMADO]
> 3. **Tecnologia:** Uso do `serwist`. [CONFIRMADO]

## Proposed Changes

### PWA Foundation

#### [NEW] [manifest.json](file:///c:/Users/leiloespb/Desktop/Landpage/public/manifest.json)
Configuração de identidade do PWA (cores, nome, ícones, modo de exibição).

#### [NEW] [icons](file:///c:/Users/leiloespb/Desktop/Landpage/public/icons/)
Geração de ativos visuais para diferentes plataformas.

#### [MODIFY] [next.config.ts](file:///c:/Users/leiloespb/Desktop/Landpage/next.config.ts)
Integração com plugin de PWA (`serwist` ou similar).

#### [MODIFY] [layout.tsx](file:///c:/Users/leiloespb/Desktop/Landpage/src/app/layout.tsx)
Inclusão de meta tags para PWA e registro do Service Worker.

## Tech Stack
- **Library:** `serwist` (ou `@serwist/next`)
- **Manifest:** Web App Manifest standard
- **Service Worker:** Automatic generation via plugin

## Task Breakdown

| Task ID | Name | Agent | Skills | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
|---------|------|-------|--------|----------|--------------|-------------------------|
| PWA-1 | Setup Dependencies | `backend-specialist` | `clean-code` | P0 | - | In: `package.json` → Out: dependencies installed → Verify: `npm list` |
| PWA-2 | Manifest & Icons | `frontend-specialist` | `frontend-design` | P1 | PWA-1 | In: Design tokens → Out: `manifest.json`, icon assets → Verify: Browser manifest tab |
| PWA-3 | Next.js Config | `backend-specialist` | `nodejs-best-practices` | P1 | PWA-1 | In: `next.config.ts` → Out: Plugin configured → Verify: `npm run build` |
| PWA-4 | Layout Integration | `frontend-specialist` | `frontend-design` | P2 | PWA-2, PWA-3 | In: `layout.tsx` → Out: Meta tags added → Verify: Inspect head elements |
| PWA-5 | SW Registration | `backend-specialist` | `clean-code` | P2 | PWA-3 | In: `layout.tsx` / `public/sw.js` → Out: SW registered → Verify: Application tab > Service Workers |

## Verification Plan

### Automated Tests
- `npm run build`: Verificar se o build do Next.js gera os assets do service worker corretamente.
- Lighthouse Audit: Executar audit de PWA.

### Manual Verification
- Instalação: Testar o prompt "Adicionar à tela inicial" no Chrome/Safari.
- Offline Mode: Ativar o modo offline no DevTools e verificar se o shell do app carrega.
