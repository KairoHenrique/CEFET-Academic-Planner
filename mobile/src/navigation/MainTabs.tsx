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

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: brand.gold,
        tabBarInactiveTintColor: brand.textMuted,
        tabBarStyle: {
          backgroundColor: brand.bgSecondary,
          borderTopColor: brand.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color }) => (
          <Text style={[styles.icon, { color }]}>{TAB_ICONS[route.name]}</Text>
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
        options={{ title: "Calendário" }}
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
    fontSize: 20,
    fontWeight: "700",
  },
});
