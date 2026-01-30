# 🔍 Resolver Erro 404 - Perfect Pay API

## ⚠️ Problema

**Erro 404: Not Found** ao tentar criar pagamento PIX.

Isso significa que:
- ✅ A URL base está correta: `https://app.perfectpay.com.br/api`
- ❌ O endpoint está incorreto ou não existe

## 📋 Endpoints Testados (Não Funcionaram)

- ❌ `/api/payments/pix` - 404
- ❌ `/api/checkout` - 404

## 🔍 Como Encontrar o Endpoint Correto

### 1. Acesse a Documentação

Acesse: `https://support.perfectpay.com.br/doc/perfect-pay/perfectpay-api/conhecendo-a-api`

### 2. Procure Por:

Na documentação, procure por:
- **"Criar pagamento"**
- **"PIX"**
- **"QR Code"**
- **"Checkout"**
- **"Transações"**
- **Lista de endpoints**

### 3. Possíveis Endpoints (Verifique Qual é o Correto):

```
/api/transactions
/api/transactions/pix
/api/payment
/api/payment/create
/api/checkout/create
/api/orders
/api/orders/pix
/api/v1/checkout
/api/v1/payments
```

### 4. Verifique os Logs no Railway

Após tentar gerar o QR Code, verifique os logs no Railway:
- Railway Dashboard → Seu Serviço → Deployments → Logs
- Procure por: `[Perfect Pay] Erro na resposta:`
- Isso mostrará a URL completa que está sendo usada

### 5. Teste Manual com cURL

Você pode testar diferentes endpoints manualmente:

```bash
# Teste 1: /api/transactions
curl -X POST https://app.perfectpay.com.br/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "amount": 3999,
    "description": "Teste",
    "customer": {
      "name": "Teste",
      "email": "teste@teste.com"
    },
    "payment_method": "pix"
  }'

# Teste 2: /api/payment
curl -X POST https://app.perfectpay.com.br/api/payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "amount": 3999,
    "description": "Teste",
    "customer": {
      "name": "Teste",
      "email": "teste@teste.com"
    },
    "payment_method": "pix"
  }'
```

## 🔧 Após Encontrar o Endpoint Correto

1. Atualize o arquivo `nutrifit/src/lib/perfect-pay.ts`
2. Na linha onde está:
   ```typescript
   const url = `${this.baseUrl}/checkout`;
   ```
3. Altere para o endpoint correto, por exemplo:
   ```typescript
   const url = `${this.baseUrl}/transactions`;
   ```

## 📞 Contato com Suporte

Se não encontrar na documentação:
1. Use o chat "Fale conosco" no painel da Perfect Pay
2. Pergunte: "Qual é o endpoint da API REST para criar pagamentos PIX?"
3. Ou pergunte: "Como criar um pagamento PIX via API REST?"

## 📝 Checklist

- [ ] Acessei a documentação da Perfect Pay
- [ ] Procurei por "PIX" ou "pagamento"
- [ ] Encontrei o endpoint correto
- [ ] Testei manualmente com curl
- [ ] Atualizei o código
- [ ] Testei novamente no checkout

