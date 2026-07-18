import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Text } from "react-native";
import { CalendarScreen } from "../screens/CalendarScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { brand } from "../theme/brand";
import { DisciplinasStack } from "./DisciplinasStack";
import { MoreStack } from "./MoreStack";
import type { MainTabsParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TAB_ICONS: Record<keyof MainTabsParamList, string> = {
  Inicio: "⌂",
  Agenda: "▦",
  Materias: "☰",
  Mais: "⋯",
};

/** Tab bar no estilo glass + gold active do navbar/drawer F28. */
export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: brand.gold200,
        tabBarInactiveTintColor: brand.textMuted,
        tabBarStyle: {
          backgroundColor: brand.glass,
          borderTopColor: brand.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: brand.fontBodyBold,
          fontWeight: "700",
        },
        tabBarIcon: ({ color, focused }) => (
          <Text
            style={[
              styles.icon,
              { color },
              focused && styles.iconActive,
            ]}
          >
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DashboardScreen}
        options={{ title: "Início" }}
      />
      <Tab.Screen
        name="Agenda"
        component={CalendarScreen}
        options={{ title: "Agenda" }}
      />
      <Tab.Screen
        name="Materias"
        component={DisciplinasStack}
        options={{ title: "Matérias" }}
      />
      <Tab.Screen
        name="Mais"
        component={MoreStack}
        options={{ title: "Mais" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 18,
    fontWeight: "700",
  },
  iconActive: {
    backgroundColor: "rgba(232,198,106,0.12)",
    overflow: "hidden",
  },
});
