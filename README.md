
# CISV Manager

Sistema em **React + Firebase + Bootstrap** para gerenciar inscritos e eventos do CISV.

## Rodando localmente
```bash
npm install
cp .env.local.example .env.local   # preencha com as credenciais do Firebase
npm run dev
```

## Deploy na Vercel
1. Faça fork ou suba este repositório ao GitHub.
2. Em **Vercel › New Project**, importe o repo.
3. **Framework Preset**: Vite.
4. **Build Command**: `vite build` (padrão) — **Output Dir**: `dist`.
5. Adicione as variáveis do Firebase em **Settings › Environment Variables** (veja `.env.local.example`).
6. Deploy.

SPA routing já configurado em `vercel.json`.

## Firestore
- Regras: `firestore.rules`
- Indexes: criar conforme solicitado pelo console (sugestões aparecerão).
