# 📚 URL da Documentação Perfect Pay

## 🔗 Link da Documentação

A documentação oficial da API Perfect Pay está em:

**https://support.perfectpay.com.br/doc/perfect-pay/perfectpay-api/conhecendo-a-api**

## 📋 Próximos Passos

### 1. Acesse a Documentação

Clique no link acima ou copie e cole no navegador:
```
https://support.perfectpay.com.br/doc/perfect-pay/perfectpay-api/conhecendo-a-api
```

### 2. Procure Por:

Na documentação, procure por:
- **URL Base da API**
- **Base URL**
- **Endpoint Base**
- **API Endpoint**
- **Exemplos de requisição**

### 3. Possíveis URLs (Verifique na Documentação):

A URL pode estar em um destes formatos:

```
https://api.perfectpay.com/api/v1
https://api.perfectpay.com/v1
https://perfectpay.com.br/api/v1
https://api.perfectpay.com.br/api/v1
https://sandbox.perfectpay.com.br/v1  (para testes)
```

### 4. Exemplo de Onde Procurar:

Na documentação, procure por exemplos como:

```bash
curl -X POST https://URL_BASE/payments/pix
```

ou

```javascript
fetch('https://URL_BASE/payments/pix', {
  method: 'POST',
  ...
})
```

A URL que aparece nesses exemplos é a URL base correta!

## 🔧 Após Encontrar a URL

### Configure no Railway:

1. Acesse Railway Dashboard
2. Vá em: Seu Serviço → **Variables**
3. Adicione ou edite:
   ```env
   PERFECT_PAY_BASE_URL=https://URL_QUE_VOCÊ_ENCONTROU
   ```

### Exemplo:

Se na documentação aparecer:
```
https://api.perfectpay.com/api/v1/payments/pix
```

Então a URL base é:
```
https://api.perfectpay.com/api/v1
```

Configure assim no Railway:
```env
PERFECT_PAY_BASE_URL=https://api.perfectpay.com/api/v1
```

## ⚠️ Importante

- A URL base **NÃO** deve incluir `/payments/pix`
- Apenas a parte base, como `https://api.perfectpay.com/api/v1`
- O código já adiciona `/payments/pix` automaticamente

## 🧪 Teste

Depois de configurar, teste no checkout. Se ainda der erro, verifique os logs no Railway para ver a URL completa que está sendo usada.

