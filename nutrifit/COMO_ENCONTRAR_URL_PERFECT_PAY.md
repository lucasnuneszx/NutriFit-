# 🔍 Como Encontrar a URL Correta da API Perfect Pay

## ⚠️ Problema Atual

A URL `https://api.perfectpay.com.br/v1` **não existe** (erro DNS).

## 📋 Passo a Passo para Encontrar a URL Correta

### 1. Acesse o Painel da Perfect Pay

1. Faça login em: `https://app.perfectpay.com.br`
2. No menu lateral, clique em **"Ferramentas"**
3. Clique em **"API"**

### 2. Na Página de API, Procure Por:

- **URL Base da API**
- **Endpoint Base**
- **Base URL**
- **Documentação da API**
- **Exemplos de Integração**

### 3. Possíveis URLs (Verifique Qual é a Correta):

A URL pode estar em um destes formatos:

```
https://api.perfectpay.com/api/v1
https://api.perfectpay.com/v1
https://perfectpay.com.br/api/v1
https://api.perfectpay.com.br/api/v1
https://sandbox.perfectpay.com.br/v1  (para testes)
```

### 4. Como Identificar a URL Correta:

#### Opção A: Na Documentação
- Procure por exemplos de código
- Procure por "curl" ou "fetch" examples
- A URL geralmente aparece assim:
  ```bash
  curl -X POST https://URL_AQUI/payments/pix
  ```

#### Opção B: No Painel de API
- Procure por "Configuração"
- Procure por "Endpoints"
- Procure por "Base URL"

#### Opção C: Contato com Suporte
- Use o chat "Fale conosco" no canto inferior direito
- Pergunte: "Qual é a URL base da API para criar pagamentos PIX?"

### 5. Teste a URL Manualmente

Depois de encontrar a URL, teste no navegador:

```
https://URL_QUE_VOCÊ_ENCONTROU/payments/pix
```

Se aparecer um erro de autenticação (401/403), a URL está correta!
Se aparecer erro DNS ou 404, a URL está errada.

## 🔧 Como Configurar no Railway

### 1. Após Encontrar a URL Correta:

1. Acesse Railway Dashboard
2. Vá em: Seu Serviço → **Variables**
3. Adicione ou edite:
   ```env
   PERFECT_PAY_BASE_URL=https://URL_CORRETA_AQUI
   ```
   
   **Exemplo:**
   ```env
   PERFECT_PAY_BASE_URL=https://api.perfectpay.com/api/v1
   ```

### 2. Faça um Novo Deploy

Após configurar a variável, o Railway fará um novo deploy automaticamente.

### 3. Teste Novamente

Acesse o checkout e tente gerar o QR Code PIX novamente.

## 🧪 Teste Manual com cURL

Você pode testar a API diretamente com o token que você tem:

```bash
curl -X POST https://URL_QUE_VOCÊ_ENCONTROU/payments/pix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "amount": 3999,
    "description": "Teste NutriFit",
    "customer": {
      "name": "Teste",
      "email": "teste@teste.com"
    },
    "expires_in": 30
  }'
```

**Se funcionar:** A URL está correta! Configure no Railway.
**Se não funcionar:** Verifique o token ou a URL.

## 📝 Checklist

- [ ] Acessei o painel da Perfect Pay
- [ ] Cliquei em "Ferramentas" → "API"
- [ ] Encontrei a URL base da API
- [ ] Testei a URL manualmente
- [ ] Configurei `PERFECT_PAY_BASE_URL` no Railway
- [ ] Fiz um novo deploy
- [ ] Testei o checkout novamente

## 🆘 Se Não Encontrar

1. **Use o chat "Fale conosco"** no painel da Perfect Pay
2. **Pergunte:** "Qual é a URL base da API para criar pagamentos PIX via REST?"
3. **Ou pergunte:** "Preciso da URL do endpoint para criar pagamentos PIX"

## 📞 Informações Úteis

- **Painel:** https://app.perfectpay.com.br
- **Seção:** Ferramentas → API
- **Token:** Já configurado no Railway como `PERFECT_PAY_API_TOKEN`

