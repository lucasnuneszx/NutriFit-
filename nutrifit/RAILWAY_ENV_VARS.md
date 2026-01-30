# Variáveis de Ambiente para Railway

Copie e cole estas variáveis no Railway Dashboard → Seu Serviço → Variables

## 🔐 Obrigatórias

```env
# PostgreSQL (Railway) - USE A URL PÚBLICA, NÃO A INTERNA!
DATABASE_URL=postgresql://postgres:SENHA@turntable.proxy.rlwy.net:PORTA/railway
DB_SSL=true

# JWT Secret (OBRIGATÓRIO - Gere uma string aleatória segura)
JWT_SECRET=seu-secret-super-seguro-aqui-mude-em-producao-123456789

# Google Gemini API
GEMINI_API_KEY=sua-chave-gemini-aqui
GEMINI_MODEL=gemini-3-flash-preview

# Perfect Pay API (Pagamentos PIX)
PERFECT_PAY_API_TOKEN=seu-token-jwt-perfect-pay-aqui
```

## 📝 Como obter cada variável:

### 1. DATABASE_URL (IMPORTANTE!)
- No Railway Dashboard → Seu projeto → PostgreSQL
- Clique em "Connect" ou "Variables"
- **USE A URL PÚBLICA** (que contém `turntable.proxy.rlwy.net` ou `proxy.rlwy.net`)
- **NÃO USE** a URL interna (`postgres.railway.internal`)
- Exemplo correto: `postgresql://postgres:abc123@turntable.proxy.rlwy.net:5432/railway`
- Exemplo ERRADO: `postgresql://postgres:abc123@postgres.railway.internal:5432/railway`

### 2. JWT_SECRET
- Gere uma string aleatória segura (mínimo 32 caracteres)
- Você pode usar: `openssl rand -base64 32` ou qualquer gerador de senha
- Exemplo: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### 3. GEMINI_API_KEY
- Acesse: https://aistudio.google.com/app/apikey
- Crie uma nova API Key
- Cole aqui

### 4. PERFECT_PAY_API_TOKEN
- Acesse o painel da Perfect Pay
- Vá em: Ferramentas → API → Token
- Copie o token JWT

## 🚀 Após configurar as variáveis:

1. **Acesse a URL para criar tabelas:**
   ```
   https://seu-dominio.railway.app/api/admin/setup-database
   ```

2. **Ou execute o SQL manualmente:**
   - Railway Dashboard → PostgreSQL → Query
   - Copie o conteúdo de `supabase/SCHEMA_COMPLETO.sql`
   - Cole e execute

## ⚠️ IMPORTANTE - DATABASE_URL:

- **USE SEMPRE A URL PÚBLICA** (com `proxy.rlwy.net`)
- A URL interna (`railway.internal`) só funciona dentro da rede do Railway
- Se você estiver acessando de fora (como pelo endpoint), precisa da URL pública

## 🔒 Segurança:

- **NUNCA** compartilhe essas variáveis publicamente
- **NUNCA** commite o `.env.local` no git
- Use variáveis diferentes para desenvolvimento e produção
- O `JWT_SECRET` deve ser único e seguro em produção
