# Variáveis de Ambiente para Railway

Copie e cole estas variáveis no Railway Dashboard → Seu Serviço → Variables

## 🔐 Obrigatórias

```env
# PostgreSQL (Railway)
DATABASE_URL=postgresql://postgres:SENHA@HOST:PORTA/railway
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

### 1. DATABASE_URL
- No Railway Dashboard → Seu projeto → PostgreSQL
- Clique em "Connect" ou "Variables"
- Copie a `DATABASE_URL` completa
- Exemplo: `postgresql://postgres:abc123@turntable.proxy.rlwy.net:5432/railway`

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

1. Acesse: `https://seu-dominio.railway.app/api/admin/setup-database`
2. Isso criará todas as tabelas necessárias
3. Ou execute o SQL manualmente no Railway PostgreSQL → Query

## ⚠️ Importante:

- **NUNCA** compartilhe essas variáveis publicamente
- **NUNCA** commite o `.env.local` no git
- Use variáveis diferentes para desenvolvimento e produção
- O `JWT_SECRET` deve ser único e seguro em produção

