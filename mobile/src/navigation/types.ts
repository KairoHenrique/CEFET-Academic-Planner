export type RootStackParamList = {
  Dashboard: undefined;
  Calendario: undefined;
  Disciplinas: undefined;
  DisciplinaDetail: { code: string; name?: string };
  Mapa: undefined;
  Integralizacao: undefined;
  Simulador: undefined;
  Planos: { flow?: string; paywall?: boolean } | undefined;
  PlanosPix: { paymentId: string; paywall?: boolean };
  Notificacoes: undefined;
  Sync: undefined;
  Perfil: undefined;
};
