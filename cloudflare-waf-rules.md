# Regras Recomendadas de WAF e Rate Limiting (Cloudflare)

Estas regras devem ser configuradas no painel de controle do Cloudflare (WAF -> Rate Limiting) para garantir a segurança da versão **1.1.0** e blindar contra ataques e abuso.

## Regra 1: Rate Limiting para Login e Cadastro (Prevenção de Brute Force)
- **Nome:** `Rate Limit - Auth Endpoints`
- **Condição (If):**
  - URI Path `contains` `/api/auth/`
- **Ação:** `Block`
- **Rate Limit:** 
  - `5` requests
  - Por `1 minute`
- **Critério de Agrupamento:**
  - Pelo `IP` do cliente.

## Regra 2: Rate Limiting para Sincronização SIGAA (Prevenção de Sobrecarga e Abuso de Fila)
- **Nome:** `Rate Limit - Sigaa Sync`
- **Condição (If):**
  - URI Path `equals` `/api/sync/queue`
  - HTTP Method `equals` `POST`
- **Ação:** `Block` (ou `Managed Challenge`)
- **Rate Limit:** 
  - `3` requests
  - Por `5 minutes`
- **Critério de Agrupamento:**
  - Pelo `IP` do cliente.

## Regra 3: Bloqueio de Tráfego não nativo em Endpoints Privados
- **Nome:** `Block - Missing User Agent`
- **Condição (If):**
  - URI Path `contains` `/api/sync/`
  - User Agent `does not contain` `ACME-HUB`
  - User Agent `does not contain` `Mozilla` (para debuggers padrão se necessário)
- **Ação:** `Managed Challenge` (CAPTCHA Invisível)

## Configuração de Variáveis de Ambiente para o R2 (Versão 1.1.1)
Para habilitarmos o envio de tarefas (Uploads), as seguintes variáveis deverão ser registradas de forma secreta nos *Environment Variables* da Cloudflare Pages / Workers:
- `AWS_ACCESS_KEY_ID`: [Sua chave S3 do R2]
- `AWS_SECRET_ACCESS_KEY`: [Seu segredo S3 do R2]
- `R2_BUCKET_NAME`: `acme-hub-uploads`
- `R2_ENDPOINT`: `https://[sua-conta].r2.cloudflarestorage.com`
