import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { IntegralizacaoScreen } from "../screens/IntegralizacaoScreen";
import { MapaScreen } from "../screens/MapaScreen";
import { MoreHomeScreen } from "../screens/MoreHomeScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { PlanosScreen } from "../screens/PlanosScreen";
import { SimuladorScreen } from "../screens/SimuladorScreen";
import { SyncScreen } from "../screens/SyncScreen";
import { brand } from "../theme/brand";
import type { MoreStackParamList } from "./types";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: brand.bg },
        headerTintColor: brand.gold200,
        headerTitleStyle: {
          fontWeight: "700",
          color: brand.text,
          fontFamily: brand.fontBodyBold,
        },
        contentStyle: { backgroundColor: brand.bg },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="MoreHome"
        component={MoreHomeScreen}
        options={{ title: "Mais" }}
      />
      <Stack.Screen
        name="Mapa"
        component={MapaScreen}
        options={{ title: "Mapa PPC" }}
      />
      <Stack.Screen
        name="Integralizacao"
        component={IntegralizacaoScreen}
        options={{ title: "Integralização" }}
      />
      <Stack.Screen
        name="Simulador"
        component={SimuladorScreen}
        options={{ title: "Simulador" }}
      />
      <Stack.Screen
        name="Planos"
        component={PlanosScreen}
        options={{ title: "Planos" }}
      />
      <Stack.Screen
        name="Notificacoes"
        component={NotificationsScreen}
        options={{ title: "Notificações" }}
      />
      <Stack.Screen
        name="Sync"
        component={SyncScreen}
        options={{ title: "Sync SIGAA" }}
      />
      <Stack.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ title: "Perfil" }}
      />
    </Stack.Navigator>
  );
}
