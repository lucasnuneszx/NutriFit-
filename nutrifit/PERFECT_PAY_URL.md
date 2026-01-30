# ⚠️ IMPORTANTE: URL da API Perfect Pay

## Problema Identificado

O domínio `api.perfectpay.com.br` **não existe** (erro DNS: `DNS_PROBE_FINISHED_NXDOMAIN`).

Isso significa que a URL da API está **incorreta**.

## Como Encontrar a URL Correta

### 1. Verificar no Painel da Perfect Pay

1. Acesse o painel da Perfect Pay
2. Vá em: **Documentação** ou **API** ou **Integração**
3. Procure pela **URL Base da API**
4. Pode ser algo como:
   - `https://perfectpay.com.br/api/v1`
   - `https://api.perfectpay.com/api/v1`
   - `https://sandbox.perfectpay.com.br/v1` (para testes)
   - Ou outra URL fornecida pela documentação

### 2. Verificar na Documentação

- Acesse a documentação oficial da Perfect Pay
- Procure pela seção de **API** ou **Endpoints**
- A URL base geralmente está no início da documentação

### 3. Verificar no Token/Configuração

- No painel da Perfect Pay, onde você gerou o token
- Pode haver uma URL de exemplo ou configuração da API

## Como Configurar

Após encontrar a URL correta, adicione no Railway:

```env
PERFECT_PAY_BASE_URL=https://URL_CORRETA_AQUI/v1
```

**Exemplo:**
```env
PERFECT_PAY_BASE_URL=https://api.perfectpay.com/api/v1
```

## URLs Comuns de APIs de Pagamento

Algumas possibilidades (verifique qual é a correta):

- `https://api.perfectpay.com/api/v1`
- `https://api.perfectpay.com/v1`
- `https://perfectpay.com.br/api/v1`
- `https://sandbox.perfectpay.com.br/v1` (ambiente de teste)

## Próximos Passos

1. **Acesse o painel da Perfect Pay**
2. **Encontre a URL correta da API**
3. **Configure `PERFECT_PAY_BASE_URL` no Railway**
4. **Faça um novo deploy**
5. **Teste novamente**

## Contato com Suporte

Se não encontrar a URL na documentação:
- Entre em contato com o suporte da Perfect Pay
- Pergunte: "Qual é a URL base da API para criar pagamentos PIX?"

