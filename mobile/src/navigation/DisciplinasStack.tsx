import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DisciplinaDetailScreen } from "../screens/DisciplinaDetailScreen";
import { DisciplinasScreen } from "../screens/DisciplinasScreen";
import { brand } from "../theme/brand";
import type { DisciplinasStackParamList } from "./types";

const Stack = createNativeStackNavigator<DisciplinasStackParamList>();

export function DisciplinasStack() {
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
        name="DisciplinasList"
        component={DisciplinasScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DisciplinaDetail"
        component={DisciplinaDetailScreen}
        options={({ route }) => ({
          title: route.params.name ?? route.params.code,
        })}
      />
    </Stack.Navigator>
  );
}
