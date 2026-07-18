# App Android nativo (não WebView)

O app Expo é **nativo separado do navegador**:
- Login CPF/senha → API cloud
- Sessão SecureStore
- Telas: Início, Agenda, Matérias, Mais (Mapa, Integralização, Simulador, Planos, Sync, Notificações, Perfil)
- Mesmas APIs do site (`/api/dashboard`, `/api/disciplinas`, …)

**Não** embute o site em WebView. Visual alinhado ao F28; funções via API.
