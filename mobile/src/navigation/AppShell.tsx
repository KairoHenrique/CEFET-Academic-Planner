import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import {
  useNavigation,
  useNavigationState,
} from "@react-navigation/native";
import { getPerfil } from "../auth/api";
import { consumePostAuthNavigation } from "../auth/post-auth-nav";
import { setAvatarFromNome, setAvatarInitials } from "../perfil/avatar-store";
import { useAvatarInitials } from "../perfil/useAvatarInitials";
import { startManualLiteSync } from "../sync/manual-lite-sync";
import { useMobileSync } from "../sync/useMobileSync";
import { brand } from "../theme/brand";
import { SyncProgressOverlay } from "../ui/SyncProgressOverlay";
import { CalendarScreen } from "../screens/CalendarScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DisciplinaDetailScreen } from "../screens/DisciplinaDetailScreen";
import { DisciplinasScreen } from "../screens/DisciplinasScreen";
import { IntegralizacaoScreen } from "../screens/IntegralizacaoScreen";
import { MapaScreen } from "../screens/MapaScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { PlanosScreen } from "../screens/PlanosScreen";
import { PlanosPixScreen } from "../screens/PlanosPixScreen";
import { SimuladorScreen } from "../screens/SimuladorScreen";
import { F28Navbar } from "./F28Navbar";
import { MobileDrawer } from "./MobileDrawer";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

function ShellChrome({ children }: { children: ReactNode }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sync = useMobileSync();
  const initials = useAvatarInitials();
  const activeRoute = useNavigationState((state) => {
    const route = state?.routes[state.index ?? 0];
    return (route?.name as keyof RootStackParamList) ?? "Dashboard";
  });

  useEffect(() => {
    void (async () => {
      try {
        const perfil = await getPerfil();
        if (perfil.profile?.initials) {
          await setAvatarInitials(perfil.profile.initials);
        } else if (perfil.profile?.nome) {
          await setAvatarFromNome(perfil.profile.nome);
        }
      } catch {
        /* offline / sem sync — mantém cache */
      }
    })();
  }, []);

  function handleSyncPress() {
    void startManualLiteSync();
  }

  return (
    <View style={styles.shell}>
      <F28Navbar
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
        onOpenNotifications={() => navigation.navigate("Notificacoes")}
        onOpenSync={handleSyncPress}
        onOpenProfile={() => navigation.navigate("Perfil")}
        onPressBrand={() => navigation.navigate("Dashboard")}
        syncing={sync.syncing}
        initials={initials}
      />
      <SyncProgressOverlay />
      <View style={styles.content}>{children}</View>
      <MobileDrawer
        open={drawerOpen}
        activeRoute={activeRoute}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(route) => {
          if (route === "Sync") {
            handleSyncPress();
            setDrawerOpen(false);
            return;
          }
          navigation.navigate(route as never);
        }}
      />
    </View>
  );
}

function withShell(Screen: ComponentType<object>) {
  return function ShelledScreen(props: object) {
    return (
      <ShellChrome>
        <Screen {...props} />
      </ShellChrome>
    );
  };
}

/** Stack F28 — mesmas rotas do site; casca navbar+drawer. */
export function AppShell() {
  const pending = consumePostAuthNavigation();
  const initialRouteName =
    pending?.name === "Planos" ? "Planos" : "Dashboard";
  const planosInitialParams =
    pending?.name === "Planos"
      ? (pending.params as RootStackParamList["Planos"])
      : undefined;

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: brand.bg },
        animation: "fade",
      }}
    >
      <Stack.Screen name="Dashboard" component={withShell(DashboardScreen)} />
      <Stack.Screen name="Calendario" component={withShell(CalendarScreen)} />
      <Stack.Screen name="Disciplinas" component={withShell(DisciplinasScreen)} />
      <Stack.Screen
        name="DisciplinaDetail"
        component={withShell(DisciplinaDetailScreen)}
      />
      <Stack.Screen name="Mapa" component={withShell(MapaScreen)} />
      <Stack.Screen
        name="Integralizacao"
        component={withShell(IntegralizacaoScreen)}
      />
      <Stack.Screen name="Simulador" component={withShell(SimuladorScreen)} />
      <Stack.Screen
        name="Planos"
        component={withShell(PlanosScreen)}
        initialParams={planosInitialParams}
      />
      <Stack.Screen name="PlanosPix" component={withShell(PlanosPixScreen)} />
      <Stack.Screen
        name="Notificacoes"
        component={withShell(NotificationsScreen)}
      />
      <Stack.Screen name="Perfil" component={withShell(PerfilScreen)} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: brand.bg,
  },
  content: {
    flex: 1,
  },
});
