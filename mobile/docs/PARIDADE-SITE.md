# Paridade Site ↔ App Android (Bloco 8)

Inventário cruzado jul/2026. **Meta:** toda função do aluno no site v1.0 no Expo.
**Fora de escopo aluno:** `/dev` (operador).

| Módulo site | Funções | App |
|---|---|---|
| Login `/login` | Entrar | ✅ |
| Login | Criar conta | ✅ link → site `/login` (cadastro completo) |
| Shell | Sync SIGAA | ✅ Mais → Sync |
| Shell | Sino / notificações | ✅ Mais → Notificações |
| Dashboard | Stats, tarefas, CH, grade, matérias | ✅ |
| Dashboard | Toggle tarefa done | ✅ Concluir |
| Disciplinas lista | Busca + filtros | ✅ |
| Disciplina detalhe | Info / Notas / Faltas / Tarefas | ✅ |
| Disciplina | CRUD notas, faltas, tarefas, aparência | ✅ |
| Calendário | Grade / Eventos / Datas | ✅ |
| Calendário | Criar / toggle / apagar evento | ✅ |
| Mapa | Grade períodos | ✅ |
| Mapa | Grafo pré/co | ✅ lista arestas (touch) |
| Integralização | Resumo categorias | ✅ |
| Integralização | Lançar horas manuais | ✅ |
| Simulador | Lista turmas | ✅ |
| Simulador | Seleção + choques + salvar/apagar | ✅ |
| Planos / PIX / gift | Checkout nativo | ✅ |
| Perfil | Prefs notif + contato + sync info | ✅ |
| Push register | Fora Expo Go | ✅ |
| Legal | Termos / privacidade | ✅ links no Perfil |
| Dev `/dev` | Operador | ➖ N/A aluno |

## Navegação app
`Início · Agenda · Matérias · Mais` → Notificações, Sync, Mapa, Integralização, Simulador, Planos, Perfil

## Diferenças UX (intencionais)
- Bottom tabs em vez de drawer F28 (só posição dos módulos)
- **Visual = F28** (tokens, Outfit/Inter, cards, page-header, chips)
- Grafo do mapa = lista de arestas (não react-flow)
- Cadastro de conta = web (formulário legal/referral/gift)
- Simulador sem drag-and-drop visual da grade (seleção + API de choques)
