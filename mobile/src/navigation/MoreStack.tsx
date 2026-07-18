import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { IntegralizacaoScreen } from "../screens/IntegralizacaoScreen";
import { MapaScreen } from "../screens/MapaScreen";
import { MoreHomeScreen } from "../screens/MoreHomeScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { PlanosScreen } from "../screens/PlanosScreen";
import { SimuladorScreen } from "../screens/SimuladorScreen";
import { brand } from "../theme/brand";
import type { MoreStackParamList } from "./types";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: brand.blue },
        headerTintColor: brand.white,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: brand.surface },
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
        name="Perfil"
        component={PerfilScreen}
        options={{ title: "Perfil" }}
      />
    </Stack.Navigator>
  );
}
