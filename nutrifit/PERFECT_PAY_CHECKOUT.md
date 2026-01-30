# 🔍 Perfect Pay - Criar Checkout com PIX

## ⚠️ Informação Importante

A Perfect Pay **não disponibiliza um endpoint público simples POST /pix**. O PIX é gerado através do **checkout**.

## 📋 Como Funciona

1. **Criar Checkout**: Você cria um checkout com os dados do cliente e produto
2. **PIX Gerado**: A Perfect Pay gera o PIX e retorna o QR Code
3. **Webhook**: Quando pago, a Perfect Pay envia um webhook de confirmação

## 🔍 Endpoint de Checkout

O endpoint provavelmente é algo como:
```
POST /api/checkout
POST /api/checkout/create
POST /api/orders
```

## 📝 Estrutura do Payload

O payload para criar checkout pode precisar de campos adicionais:

```json
{
  "amount": 3999,
  "description": "NutriFit+ - Assinatura NutriPlus",
  "customer": {
    "name": "Nome do Cliente",
    "email": "cliente@email.com"
  },
  "payment_method": "pix",
  "product_code": "CODIGO_PRODUTO",  // Pode ser necessário
  "plan_code": "CODIGO_PLANO",       // Pode ser necessário
  "metadata": {
    "user_id": "uuid-do-usuario",
    "plan": "plus"
  }
}
```

## 🔧 Próximos Passos

### 1. Verificar na Documentação

Acesse: `https://support.perfectpay.com.br/doc/perfect-pay/perfectpay-api/conhecendo-a-api`

Procure por:
- **"Criar checkout"**
- **"Criar pedido"**
- **"Checkout API"**
- **"Estrutura do checkout"**

### 2. Verificar Campos Obrigatórios

A documentação deve mostrar:
- Quais campos são obrigatórios
- Estrutura exata do payload
- Endpoint correto

### 3. Configurar Webhook

Após conseguir criar o checkout:
1. Acesse: Painel Perfect Pay → Ferramentas → Postback/Webhook
2. Configure a URL do webhook: `https://seu-dominio.railway.app/api/payment/pix/webhook`
3. Selecione o evento: "Pedido Pago"

## 🧪 Teste Manual

Teste o endpoint de checkout:

```bash
curl -X POST https://app.perfectpay.com.br/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "amount": 3999,
    "description": "Teste NutriFit",
    "customer": {
      "name": "Teste",
      "email": "teste@teste.com"
    },
    "payment_method": "pix"
  }'
```

## 📞 Contato com Suporte

Se não encontrar na documentação:
1. Use o chat "Fale conosco" no painel da Perfect Pay
2. Pergunte: **"Qual é o endpoint da API REST para criar um checkout com pagamento PIX? Preciso da estrutura completa do payload."**

## 📝 Checklist

- [ ] Acessei a documentação da Perfect Pay
- [ ] Procurei por "criar checkout" ou "criar pedido"
- [ ] Encontrei o endpoint POST correto
- [ ] Verifiquei os campos obrigatórios do payload
- [ ] Testei manualmente com curl
- [ ] Atualizei o código
- [ ] Configurei o webhook
- [ ] Testei novamente no checkout

