# Stock Guardian — Workspace

## Overview

pnpm workspace monorepo using TypeScript. Main artifact is Stock Guardian, a PWA for perishable product expiration control.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24 / TypeScript 5.9
- **Frontend**: React 18 + Vite + Tailwind CSS (artifacts/stock-guardian)
- **State**: React Context (StoreContext, AuthContext)
- **Routing**: wouter (path-based)
- **UI lib**: shadcn/ui components, lucide-react icons
- **Notifications**: sonner toast
- **PWA**: manifest.json + sw.js (v2) + Netlify _redirects

## Artifact: Stock Guardian (`artifacts/stock-guardian`)

### Features
- **Dashboard** — KPIs, urgency alerts, sync source badge, server config toggle (admin)
- **Produtos** — Product catalog with expiration status, inline editing
- **Reposição** — Stock replenishment with barcode scanner (Camera/Foto/Manual), FIFO checking, photo upload
- **Promoções** — AI-powered promotion suggestions for near-expiry lots (urgente/baixa/leve/normal)
- **Eficiência** — User efficiency ranking, FIFO error tracking, recent activity
- **Relatórios** — 3 tabs: Análise Financeira, Perdas e Riscos, Relatório Detalhado with CSV export
- **Usuários** — User management with role-based permissions modal, localStorage persistence
- **Auditoria** — System logs + replenishment audit with 2 tabs, CSV export, FIFO error highlighting
- **Configuração Servidor** — Admin panel to configure JM Scan server (IP, porta, senha) with real connection test

### Auth & Roles
| Email | Senha | Role |
|---|---|---|
| admin@stockguardian.com | admin123 | Admin |
| carlos@stockguardian.com | carlos123 | Operador |
| fernanda@stockguardian.com | fernanda123 | Viewer |

### Server Integration
- Default: mock/simulated data
- Real: supports any REST API returning products (JM Scan or compatible)
- Auto-probes 6+ endpoints: /api/produtos, /produtos, /api/products, /products, /api/estoque, /estoque
- Config stored in localStorage (`sg_server_config`)
- Sync source (servidor/mock) shown as badge on Dashboard

### localStorage Keys
- `sg_lots` — received lots
- `sg_reposicoes` — replenishment records
- `sg_notifications` — notifications
- `sg_last_sync` — last sync timestamp
- `sg_last_sync_source` — "servidor" or "mock"
- `sg_server_config` — server connection settings
- `sg_users_state` — users list
- `sg_theme` — dark/light theme

### Design
- Navy `#0A1F44` sidebar, Gold `#C9A14A` primary, `#F5F7FA` background
- Mobile-responsive: hamburger menu on mobile (lg breakpoint)
- Footer + Sidebar: "powered by Shark_Tech"

## Key Commands

- `pnpm --filter @workspace/stock-guardian run dev` — run the app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — build all packages
