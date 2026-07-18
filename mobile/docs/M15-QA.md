# QA Expo Go — Bloco 8 · M15

Checklist manual no **Android + Expo Go (SDK 54)**.

## Setup
- [ ] `mobile/.env` com `EXPO_PUBLIC_API_BASE_URL`
- [ ] `npx expo start -c` e abrir no Expo Go
- [ ] Mesma Wi‑Fi (ou tunnel)

## Sessão (M3–M4)
- [ ] Login CPF/senha cloud
- [ ] Sem assinatura válida → paywall → “Abrir planos no site”
- [ ] Com trial/pago → tabs
- [ ] Fechar app e reabrir → continua logado
- [ ] Sair (Perfil) → limpa sessão; pede login de novo

## Cache (M5)
- [ ] Abrir Início com rede → dados
- [ ] Modo avião → ainda mostra dados (hint de cache) ou erro amigável

## Push (M6)
- [ ] Aceitar permissão de notificação no login
- [ ] Após sync cloud concluir, chega push “dados atualizados” (se token registrado)

## Telas (M7–M14)
- [ ] **Início** — stats, tarefas, nome do aluno
- [ ] **Agenda** — eventos / datas acadêmicas
- [ ] **Matérias** — lista + detalhe (notas/faltas/tarefas)
- [ ] **Mais → Mapa** — períodos / status
- [ ] **Mais → Integralização** — CH por categoria
- [ ] **Mais → Simulador** — turmas ofertadas (lista)
- [ ] **Mais → Planos** — planos + checkout PIX / gift key
- [ ] **Mais → Perfil** — prefs de notificação + salvar + sair
- [ ] Bottom tabs apenas — **sem** drawer/sidebar

## Regressão
- [ ] Typecheck: `cd mobile && npm run typecheck`
- [ ] Sem crash ao navegar entre todas as tabs
