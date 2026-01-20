# 🚀 Guia de Setup do Supabase - NutriFit+

## ✅ Passo 1: Obter as Chaves do Supabase

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Você verá:
   - **Project URL**: `https://icrqzxuaajuxseszdinz.supabase.co` (exemplo)
   - **anon public key**: `eyJhbGc...` (chave longa)
   - **service_role key**: `eyJhbGc...` (chave longa) ⚠️ **MANTENHA SECRETA**

## ✅ Passo 2: Configurar .env.local

1. Na raiz do projeto `nutrifit/`, crie o arquivo `.env.local`
2. Copie o conteúdo de `env.local.example` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL="https://icrqzxuaajuxseszdinz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_anon_key_aqui"
SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"

OPENAI_API_KEY="sua_openai_key_aqui"
OPENAI_VISION_MODEL="gpt-4o"
```

**Importante:** Substitua pelos valores reais do seu projeto!

## ✅ Passo 3: Executar Scripts SQL

No Supabase, vá em **SQL Editor** e execute os scripts **NA ORDEM**:

### 1. Schema Base
- Abra o arquivo `supabase/schema.sql`
- Cole todo o conteúdo no SQL Editor
- Clique em **Run** (ou F5)

### 2. Storage (Bucket para imagens)
- Abra `supabase/storage.sql`
- Cole e execute

### 3. Workouts (Treinos)
- Abra `supabase/workouts.sql`
- Cole e execute

### 4. Activity (Atividades)
- Abra `supabase/activity.sql`
- Cole e execute

### 5. Session Details (Detalhes de sessão)
- Abra `supabase/session-details.sql`
- Cole e execute

### 6. Diet (Dieta)
- Abra `supabase/diet.sql`
- Cole e execute

### 7. Admin Migration (Campos de admin)
- Abra `supabase/admin-migration.sql`
- Cole e execute

### 8. Financial (Financeiro)
- Abra `supabase/financial.sql`
- Cole e execute

## ✅ Passo 4: Verificar se Funcionou

1. No Supabase, vá em **Table Editor**
2. Você deve ver as tabelas:
   - `profiles`
   - `biometrics`
   - `logs`
   - `workout_plans`
   - `workout_items`
   - `workout_sessions`
   - `workout_session_items`
   - `workout_sets`
   - `diet_plans`
   - `transactions`

3. Vá em **Storage** → deve ter um bucket chamado `food`

## ✅ Passo 5: Reiniciar o Servidor

1. Pare o servidor (Ctrl+C no terminal)
2. Execute novamente:
   ```bash
   npm run dev
   ```

## ✅ Passo 6: Testar

1. Acesse `http://localhost:3000`
2. Teste criar uma conta
3. Acesse `/admin/login` com senha `nutriadm3005`
4. Tente criar um usuário pelo painel admin

## 🎉 Pronto!

Seu projeto está configurado e pronto para uso!

---

**Problemas comuns:**

- **Erro 500 ao criar usuário**: Verifique se `SUPABASE_SERVICE_ROLE_KEY` está no `.env.local`
- **Tabelas não aparecem**: Verifique se executou todos os scripts SQL na ordem
- **Erro de RLS**: Os scripts já configuram as policies, mas verifique se executou todos
