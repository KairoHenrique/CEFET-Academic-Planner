# Plano B48 — Gateway PIX

> **Task:** PLAN **B48** (`docs/TASKS.md`)  
> **Escopo:** escolher gateway v1, variáveis de ambiente e camada adapter reutilizável por **B50** (checkout) e **B51** (webhook).  
> **Referências:** [`SCOPE-CLOUD.md` §3.4–§3.5](../SCOPE-CLOUD.md) · **B47** catálogo planos

---

## 1. Decisão v1 — Mercado Pago

| Critério | Mercado Pago | Asaas | AbacatePay |
|----------|--------------|-------|------------|
| PIX dinâmico + QR | ✅ | ✅ | ✅ |
| Webhook documentado | ✅ | ✅ | ✅ |
| DX / docs em PT | ✅ forte | ✅ | ✅ nichado |
| Taxa PIX (~) | ~0,99% | ~0,99% | competitiva |
| Cartão futuro (v2) | ✅ mesmo gateway | ✅ | ❌ PIX-only |
| Sandbox | ✅ TEST token | ✅ | ✅ |

**Escolha:** **Mercado Pago** como provider **default** em produção.

**Motivos:** adoção ampla no BR, sandbox maduro, path natural para cartão v2 sem segundo provedor, API PIX estável (`POST /v1/payments` + `payment_method_id: pix`).

**Asaas** permanece como **`PIX_GATEWAY=asaas`** (adapter reservado — implementação completa pós-go-live se taxa/ops justificar).

**Mock** (`PIX_GATEWAY=mock`) para dev local e testes — sem credencial externa.

---

## 2. Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `PIX_GATEWAY` | não | `mock` (default local) · `mercadopago` · `asaas` |
| `MERCADOPAGO_ACCESS_TOKEN` | prod MP | Access token produção ou TEST (sandbox) |
| `MERCADOPAGO_WEBHOOK_SECRET` | B51 | Validação de assinatura webhook (task **B51**) |
| `ASAAS_API_KEY` | se `asaas` | Reservado |
| `ASAAS_ENV` | se `asaas` | `sandbox` \| `production` |

**Cloudflare Workers:** definir secrets no dashboard; nunca commitar tokens.

**LGPD:** enviar ao gateway apenas e-mail + CPF necessários ao PIX; não logar QR completo em produção.

---

## 3. Camada de código (`app/src/lib/billing/gateway/`)

```
resolve-pix-gateway-config.ts   → lê env, valida credenciais
get-pix-gateway.ts             → factory por provider
create-pix-charge.ts           → entrada única (B50 consome)
mock-pix-gateway.ts            → QR fake determinístico
mercadopago/                   → client HTTP + parse resposta PIX
asaas/                         → stub (NotImplemented até v2)
```

**API ops (B48):** `GET /api/billing/gateway/status` — retorna provider, `configured`, `sandbox` (sem segredos).

**Fora do B48:** tabelas `payments` (**B49**), `POST /api/billing/checkout` (**B50**), webhook (**B51**).

---

## 4. Fluxo PIX (referência B50+)

```
1. Aluno escolhe plano → B50 cria registro payment (B49) + external_reference
2. createPixCharge({ amountCents, planId, externalReference, payerEmail, payerCpf })
3. Gateway retorna { qrCode, qrCodeBase64?, gatewayPaymentId, expiresAt }
4. UI F32 exibe QR + copia-e-cola
5. Webhook B51 confirma → subscription.active
```

---

## 5. Critérios “B48 ok → B49”

- [x] Decisão documentada (este arquivo)
- [x] Interface `PixGatewayProvider` + mock + Mercado Pago create
- [x] Env map + `GET /api/billing/gateway/status`
- [x] Testes `npm run test:b48`
- [ ] Conta Mercado Pago + token TEST no `.env.local` (operador — manual)
- [ ] Checkout end-to-end (**B50**) e webhook (**B51**)

---

## 6. Como obter credenciais Mercado Pago (passo a passo)

### 6.1 Conta e chaves PIX

1. Crie ou use conta em [mercadopago.com.br](https://www.mercadopago.com.br/).
2. No app Mercado Pago (celular), cadastre sua **chave PIX** — necessário para **receber** pagamentos reais.
3. Complete dados cadastrais / verificação se o painel pedir (para produção).

### 6.2 Aplicação de desenvolvedor

1. Acesse o [Painel de desenvolvedores](https://www.mercadopago.com.br/developers/panel/app).
2. **Criar aplicação** → nome ex.: `ACME HUB` → **Pagamentos online** (checkout/API).
3. Abra a aplicação criada.

### 6.3 Credenciais de **teste** (sandbox — use primeiro)

1. Menu **Credenciais de teste**.
2. Copie o **Access Token** — começa com `TEST-`.
3. No `app/.env.local`:

```env
PIX_GATEWAY=mercadopago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

4. Reinicie `npm run dev`.
5. Confira: `GET http://localhost:3000/api/billing/gateway/status` → `"configured": true`, `"mode": "sandbox"`.

**Pagamentos de teste:** use [usuários de teste](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/accounts) do MP quando **B50** existir.

### 6.4 Credenciais de **produção** (go-live)

1. Mesma aplicação → **Credenciais de produção** → token `APP_USR-...`.
2. Configure como **secret** no Cloudflare Workers — nunca commitar.

### 6.5 Webhook (task **B51**)

1. Painel da aplicação → **Webhooks** → URL pública (ex. `.../api/billing/webhook/mercadopago`).
2. Eventos: **Pagamentos** (`payment`).
3. Secret em `MERCADOPAGO_WEBHOOK_SECRET` (B51).

Docs: [Credenciais](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials) · [PIX API](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/integrate-with-pix) · [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

### 6.6 Checklist rápido

| # | Ação |
|---|------|
| 1 | Conta MP + chave PIX cadastrada |
| 2 | App criada no painel developers |
| 3 | Copiar **Access Token TEST** → `.env.local` |
| 4 | `PIX_GATEWAY=mercadopago` + reiniciar dev server |
| 5 | Status OK em `/api/billing/gateway/status` |
| 6 | **B49–B50** para pagar no app |
