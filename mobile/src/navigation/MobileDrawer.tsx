import { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navLinks } from "../config/navigation";
import { logoutLocal } from "../auth/logout";
import { brand } from "../theme/brand";
import { Icon } from "../ui/Icon";
import {
  MOTION_MED_MS,
  goldRipple,
  pressableOpacityStyle,
} from "../ui/pressableStyles";
import type { RootStackParamList } from "./types";

const DRAWER_WIDTH = 320;

type Props = {
  open: boolean;
  activeRoute: keyof RootStackParamList | string;
  onClose: () => void;
  onNavigate: (route: keyof RootStackParamList) => void;
  onStartTutorial: () => void;
  onCheckUpdates: () => void;
};

/** Drawer direito F28 — slide + links do site + tutorial + logout. */
export function MobileDrawer({
  open,
  activeRoute,
  onClose,
  onNavigate,
  onStartTutorial,
  onCheckUpdates,
}: Props) {
  const insets = useSafeAreaInsets();
  const panelX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!open) {
      panelX.setValue(DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      return;
    }
    panelX.setValue(DRAWER_WIDTH);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(panelX, {
        toValue: 0,
        duration: MOTION_MED_MS,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: MOTION_MED_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, panelX, backdropOpacity]);

  async function onLogout() {
    onClose();
    await logoutLocal();
  }

  function linkPress(route: keyof RootStackParamList) {
    onNavigate(route);
    onClose();
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="box-none"
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Fechar menu"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX: panelX }],
            },
          ]}
        >
          <Text style={styles.drawerTitle}>Menu</Text>
          {navLinks.map((link) => {
            const active =
              link.route === "Dashboard"
                ? activeRoute === "Dashboard"
                : activeRoute === link.route ||
                  (link.route === "Disciplinas" &&
                    activeRoute === "DisciplinaDetail");
            return (
              <Pressable
                key={link.route}
                style={({ pressed }) =>
                  pressableOpacityStyle(pressed, [
                    styles.link,
                    active && styles.linkActive,
                  ])
                }
                android_ripple={goldRipple}
                onPress={() => linkPress(link.route)}
              >
                <Icon
                  name={link.icon}
                  size={18}
                  color={active ? brand.gold : brand.textSecondary}
                />
                <Text
                  style={[styles.linkLabel, active && styles.linkLabelActive]}
                >
                  {link.label}
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.sep} />

          <Pressable
            style={({ pressed }) => pressableOpacityStyle(pressed, styles.link)}
            android_ripple={goldRipple}
            onPress={() => {
              onClose();
              onStartTutorial();
            }}
            accessibilityRole="button"
            accessibilityLabel="Abrir tutorial desta tela"
          >
            <Icon name="help-circle" size={18} color={brand.textSecondary} />
            <Text style={styles.linkLabel}>Tutorial</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => pressableOpacityStyle(pressed, styles.link)}
            android_ripple={goldRipple}
            onPress={() => {
              onClose();
              onCheckUpdates();
            }}
            accessibilityRole="button"
            accessibilityLabel="Verificar atualizações do app"
          >
            <Icon name="download" size={18} color={brand.textSecondary} />
            <Text style={styles.linkLabel}>Atualizações</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) =>
              pressableOpacityStyle(pressed, styles.logout)
            }
            android_ripple={goldRipple}
            onPress={() => void onLogout()}
          >
            <Icon name="logout" size={18} color={brand.danger} />
            <Text style={styles.logoutLabel}>Sair</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  drawer: {
    width: "78%",
    maxWidth: DRAWER_WIDTH,
    backgroundColor: brand.bgSecondary,
    borderLeftWidth: 1,
    borderLeftColor: brand.border,
    paddingHorizontal: 12,
    zIndex: 2,
  },
  drawerTitle: {
    fontSize: 11,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: brand.radiusSm,
  },
  linkActive: {
    backgroundColor: "rgba(232,198,106,0.12)",
  },
  linkLabel: {
    fontSize: 15,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.text,
  },
  linkLabelActive: {
    color: brand.gold200,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
  sep: {
    height: 1,
    backgroundColor: brand.borderMuted,
    marginVertical: 12,
    marginHorizontal: 8,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  logoutLabel: {
    fontSize: 15,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.danger,
  },
});
