# QA Expo Go — Bloco 8 · M15

Checklist manual no **Android + Expo Go (SDK 54)** · critério: screenshot ≈ site F28 (≤768).

## Setup
- [ ] `mobile/.env` com `EXPO_PUBLIC_API_BASE_URL`
- [ ] `npx expo start -c` e abrir no Expo Go
- [ ] Mesma Wi‑Fi (ou tunnel)

## Sessão (M3–M4)
- [ ] Login CPF/senha cloud
- [ ] Sem assinatura válida → paywall
- [ ] Com trial/pago → **navbar ACME HUB** (não bottom tabs)
- [ ] Fechar app e reabrir → continua logado
- [ ] Sair (drawer ou Perfil) → limpa sessão

## Cache (M5)
- [ ] Abrir Dashboard com rede → dados
- [ ] Modo avião → cache hint ou erro amigável

## Push (M6)
- [ ] Aceitar permissão de notificação
- [ ] Após sync cloud, push “dados atualizados” (se token ok)

## Casca F28
- [ ] Navbar: sino · sync · avatar · hamburger
- [ ] Drawer: Dashboard · Calendário · Disciplinas · Mapa · Integralização · Montar Grade · Planos · Sair
- [ ] **Sem** bottom tabs · **sem** WebView

## Telas (M7–M14) — lado a lado com site
- [ ] **Dashboard** — ordem: stats → tarefas → CH → grade → matérias
- [ ] **Calendário** — mês / grade / eventos / datas
- [ ] **Disciplinas** — lista + detalhe
- [ ] **Mapa** — grade + grafo nativo
- [ ] **Integralização** — CH
- [ ] **Montar Grade** — simulador
- [ ] **Planos** — PIX / gift
- [ ] **Perfil / Sync / Sino** — via navbar

## Regressão
- [ ] `cd mobile && npm run typecheck`
- [ ] Sem crash ao navegar pelo drawer
