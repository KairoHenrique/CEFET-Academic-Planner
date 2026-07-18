import type { NavigatorScreenParams } from "@react-navigation/native";

export type DisciplinasStackParamList = {
  DisciplinasList: undefined;
  DisciplinaDetail: { code: string; name?: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Mapa: undefined;
  Integralizacao: undefined;
  Simulador: undefined;
  Planos: undefined;
  Notificacoes: undefined;
  Sync: undefined;
  Perfil: undefined;
};

export type MainTabsParamList = {
  Inicio: undefined;
  Agenda: undefined;
  Materias: NavigatorScreenParams<DisciplinasStackParamList>;
  Mais: NavigatorScreenParams<MoreStackParamList>;
};
