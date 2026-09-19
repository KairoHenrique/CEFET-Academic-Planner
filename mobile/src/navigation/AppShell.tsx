import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { InteractionManager, StyleSheet, View } from "react-native";
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
import { useOnSyncComplete } from "../sync/useOnSyncComplete";
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
import { SimuladorScreen } from "../screens/SimuladorScreen";
import { F28Navbar } from "./F28Navbar";
import { fetchNotifications } from "../cache/fetchers";
import { mergeMobileNotificationItems } from "../features/notifications/merge-mobile-notification-items";
import { MobileDrawer } from "./MobileDrawer";
import type { RootStackParamList } from "./types";
import {
  PageTutorialModal,
  TutorialProvider,
  useTutorial,
} from "../features/tutorial";
import { AppUpdateProvider } from "../features/updates";
import { useAdsBootstrap } from "../ads/useAdsBootstrap";
import { maybeShowPostSyncInterstitial } from "../ads/AdMobController";

const Stack = createNativeStackNavigator<RootStackParamList>();

function ShellChrome({ children }: { children: ReactNode }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { startTutorialForRoute } = useTutorial();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  useAdsBootstrap();

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications();
      if (res?.data) {
        const items = mergeMobileNotificationItems(res.data);
        const unread = items.length;
        setUnreadCount(unread);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void loadNotifications();
    });
    return () => task.cancel();
  }, [loadNotifications]);

  useOnSyncComplete(() => {
    void loadNotifications();
    void maybeShowPostSyncInterstitial();
  });
  const sync = useMobileSync();
  const initials = useAvatarInitials();
  const activeRoute = useNavigationState((state) => {
    const route = state?.routes[state.index ?? 0];
    return (route?.name as keyof RootStackParamList) ?? "Dashboard";
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
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
    });
    return () => task.cancel();
  }, []);

  function handleSyncPress() {
    void startManualLiteSync();
  }

  function handleStartTutorial() {
    // Fecha o drawer antes — no Android dois Modals juntos travam o foco.
    setDrawerOpen(false);
    setTimeout(() => {
      startTutorialForRoute(String(activeRoute));
    }, 280);
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
        unreadCount={unreadCount}
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
        onStartTutorial={handleStartTutorial}
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

function TutorialHost() {
  const { open, tutorialId, closeTutorial } = useTutorial();
  return (
    <PageTutorialModal
      tutorialId={tutorialId}
      open={open}
      onClose={closeTutorial}
    />
  );
}

/** Stack F28 — mesmas rotas do site; casca navbar+drawer. */
export function AppShell() {
  // Consome navegação pós-auth (hoje sempre null — app gratuito).
  consumePostAuthNavigation();

  return (
    <TutorialProvider>
      <AppUpdateProvider>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: brand.bg },
            /** Telas irmãs: fade. Detalhe/overlay: slide (abaixo). */
            animation: "fade",
            animationDuration: 220,
          }}
        >
          <Stack.Screen name="Dashboard" component={withShell(DashboardScreen)} />
          <Stack.Screen name="Calendario" component={withShell(CalendarScreen)} />
          <Stack.Screen
            name="Disciplinas"
            component={withShell(DisciplinasScreen)}
          />
          <Stack.Screen
            name="DisciplinaDetail"
            component={withShell(DisciplinaDetailScreen)}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen name="Mapa" component={withShell(MapaScreen)} />
          <Stack.Screen
            name="Integralizacao"
            component={withShell(IntegralizacaoScreen)}
          />
          <Stack.Screen name="Simulador" component={withShell(SimuladorScreen)} />
          <Stack.Screen
            name="Notificacoes"
            component={withShell(NotificationsScreen)}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Perfil"
            component={withShell(PerfilScreen)}
            options={{ animation: "slide_from_right" }}
          />
        </Stack.Navigator>
        <TutorialHost />
      </AppUpdateProvider>
    </TutorialProvider>
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
