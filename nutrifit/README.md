# NutriFit+

Plataforma de saúde de alta performance, futurista e gamificada.

## 🚀 Setup Rápido

### 1. Variáveis de Ambiente

Crie `.env.local` na raiz com:

```env
# Supabase (Auth)
NEXT_PUBLIC_SUPABASE_URL="sua_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_key"
SUPABASE_SERVICE_ROLE_KEY="sua_service_key"

# PostgreSQL (Railway ou outro)
DATABASE_URL="postgresql://user:pass@host:port/dbname"
DB_SSL="true"

# Google Gemini API
GEMINI_API_KEY="sua_key"
GEMINI_MODEL="gemini-3-flash-preview"

# Perfect Pay (Pagamentos PIX)
PERFECT_PAY_API_TOKEN="seu_token_jwt"
```

### 2. Importar Schema para PostgreSQL

```bash
npm run db:import
```

### 3. Rodar

```bash
npm install
npm run dev
```

## 📦 Scripts

- `npm run dev` - Servidor de desenvolvimento
- `npm run db:import` - Importar schema para PostgreSQL (Railway)
- `npm run export:sql` - Exportar dados do Supabase para SQL

## 🎯 Stack

- **Frontend:** Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco:** PostgreSQL (Railway)
- **Auth:** Supabase Auth
- **IA:** Google Gemini (Chat, Dietas, Body Scan)
- **Pagamentos:** Perfect Pay (PIX)

---

**Desenvolvido com ❤️**

