# Como Verificar Credenciais SyncPay

## ❌ Erro: "invalid_client"

Este erro significa que o **Client ID** ou **Client Secret** estão incorretos ou não foram configurados no Railway.

## ✅ Credenciais Corretas:

```
Client ID: 796a8a8d-3ff4-4b71-8005-46c7e39f443d
Client Secret: 6f7bd038-b399-4e97-8bae-a07908751c04
```

## 🔧 Como Configurar no Railway:

1. **Acesse o Railway Dashboard:**
   - Vá para: https://railway.app/
   - Selecione seu projeto → Seu serviço

2. **Vá em "Variables":**
   - Clique na aba "Variables" no menu lateral

3. **Adicione ou atualize estas variáveis:**

   ```env
   SYNC_PAY_CLIENT_ID=796a8a8d-3ff4-4b71-8005-46c7e39f443d
   SYNC_PAY_CLIENT_SECRET=6f7bd038-b399-4e97-8bae-a07908751c04
   SYNC_PAY_BASE_URL=https://api.syncpayments.com.br
   ```

4. **Verifique:**
   - ✅ Não há espaços antes ou depois dos valores
   - ✅ Os valores estão exatamente como acima
   - ✅ Não há aspas nos valores
   - ✅ Todas as 3 variáveis estão configuradas

5. **Aguarde o deploy:**
   - Após salvar, o Railway fará um novo deploy automaticamente
   - Aguarde 2-3 minutos

## 🔍 Como Verificar se Está Configurado:

1. **No Railway Dashboard:**
   - Vá em "Variables"
   - Procure por `SYNC_PAY_CLIENT_ID` e `SYNC_PAY_CLIENT_SECRET`
   - Verifique se os valores estão corretos

2. **Nos Logs do Railway:**
   - Vá em "Deployments" → Último deploy → "Logs"
   - Procure por mensagens que começam com `[Sync Pay]`
   - Se aparecer "❌ SYNC_PAY_CLIENT_ID e SYNC_PAY_CLIENT_SECRET são obrigatórios", as variáveis não estão configuradas
   - Se aparecer "✅ URL configurada", as variáveis estão configuradas

## ⚠️ Problemas Comuns:

1. **Variáveis não configuradas:**
   - Certifique-se de adicionar TODAS as 3 variáveis
   - Não apenas o Client ID ou apenas o Secret

2. **Valores com espaços:**
   - ❌ ERRADO: `SYNC_PAY_CLIENT_ID= 796a8a8d-3ff4-4b71-8005-46c7e39f443d `
   - ✅ CORRETO: `SYNC_PAY_CLIENT_ID=796a8a8d-3ff4-4b71-8005-46c7e39f443d`

3. **Valores com aspas:**
   - ❌ ERRADO: `SYNC_PAY_CLIENT_ID="796a8a8d-3ff4-4b71-8005-46c7e39f443d"`
   - ✅ CORRETO: `SYNC_PAY_CLIENT_ID=796a8a8d-3ff4-4b71-8005-46c7e39f443d`

4. **Deploy não atualizado:**
   - Após configurar as variáveis, aguarde alguns minutos
   - O Railway precisa fazer um novo deploy para aplicar as mudanças

## 📞 Se Ainda Não Funcionar:

1. Verifique os logs do Railway para ver mensagens de erro mais detalhadas
2. Confirme que as credenciais estão corretas no painel da SyncPay
3. Tente criar uma nova chave API na SyncPay se necessário

