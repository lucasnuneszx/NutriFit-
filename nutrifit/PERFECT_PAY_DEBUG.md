# Debug Perfect Pay - Erro de Conexão

## Problema
Erro "Erro de conexão com a API" ao tentar gerar QR Code PIX.

## Possíveis Causas

### 1. URL da API Incorreta
A URL padrão é: `https://api.perfectpay.com.br/v1`

**Verificar:**
- Acesse o painel da Perfect Pay
- Vá em: Documentação → API → Endpoints
- Confirme se a URL base está correta

### 2. Token Inválido ou Expirado
**Verificar:**
- No Railway Dashboard → Variables
- Confirme que `PERFECT_PAY_API_TOKEN` está configurado
- Verifique se o token não expirou no painel da Perfect Pay
- Gere um novo token se necessário

### 3. Problemas de Rede/CORS
**Verificar:**
- Os logs no Railway devem mostrar:
  - `[Perfect Pay] Criando pagamento PIX:` com a URL
  - `[Perfect Pay] Erro ao criar pagamento:` com detalhes do erro

### 4. Formato do Token
O token deve ser um JWT válido. Verifique no painel da Perfect Pay se:
- O token está no formato correto
- Não há espaços extras no início/fim
- O token não foi cortado ao copiar

## Como Verificar os Logs

1. Acesse Railway Dashboard
2. Vá em: Seu Serviço → Deployments → Logs
3. Procure por:
   - `[Perfect Pay] Criando pagamento PIX:`
   - `[Perfect Pay] Erro ao criar pagamento:`
   - `[Payment API] Perfect Pay cliente criado`

## Teste Manual da API

Você pode testar a API diretamente com curl:

```bash
curl -X POST https://api.perfectpay.com.br/v1/payments/pix \
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

Se funcionar, o problema está na aplicação. Se não funcionar, o problema está no token ou na URL.

## Próximos Passos

1. Verifique os logs no Railway após tentar gerar o QR Code
2. Copie os logs e me envie para análise
3. Teste a API manualmente com curl
4. Verifique se a URL da API está correta na documentação da Perfect Pay

