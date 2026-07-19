# Paridade Site ↔ App Android (Bloco 8)

Inventário cruzado jul/2026 · **pivot clone F28**.
**Meta:** o app = mesma UI/funções do site ≤768 (F28), nativo, **sem WebView**.
**Fora de escopo aluno:** `/dev` (operador).

| Módulo site | Funções | App |
|---|---|---|
| Login `/login` | Entrar | ✅ |
| Login | Criar conta | ✅ link → site `/login` |
| Shell F28 | Navbar · hamburger · drawer | ✅ |
| Shell | Sync SIGAA | ✅ ícone sync na navbar |
| Shell | Sino / notificações | ✅ ícone sino na navbar |
| Shell | Perfil | ✅ avatar na navbar |
| Dashboard | Stats → tarefas → CH → grade → matérias | ✅ ordem `DashboardView` |
| Disciplinas | Lista + detalhe | ✅ |
| Calendário | Mês / grade / eventos / datas | ✅ |
| Mapa | Grade + grafo nativo SVG | ✅ sem WebView |
| Integralização | CH categorias | ✅ |
| Simulador | Montar Grade | ✅ |
| Planos / PIX | Checkout | ✅ |
| Perfil | Prefs + logout | ✅ |
| Push | Expo Notifications | ✅ |
| Dev `/dev` | Operador | ➖ N/A aluno |

## Navegação app (= site F28)

Drawer: **Dashboard · Calendário · Disciplinas · Mapa do Curso · Integralização · Montar Grade** (+ Planos · Sair).
Chrome: **sino · sync · avatar · hamburger**.

## Diferenças residuais

- Grafo = SVG nativo (não React Flow) — mesma linguagem visual F28
- Cadastro de conta = web (formulário legal/referral/gift)
- Simulador sem drag-and-drop desktop da grade
