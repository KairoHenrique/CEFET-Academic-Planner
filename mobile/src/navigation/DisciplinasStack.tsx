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
        headerStyle: { backgroundColor: brand.blue },
        headerTintColor: brand.white,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: brand.surface },
      }}
    >
      <Stack.Screen
        name="DisciplinasList"
        component={DisciplinasScreen}
        options={{ title: "Matérias" }}
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
