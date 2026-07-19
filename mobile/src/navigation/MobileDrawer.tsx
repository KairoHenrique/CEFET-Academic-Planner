import {
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
import type { RootStackParamList } from "./types";

type Props = {
  open: boolean;
  activeRoute: keyof RootStackParamList | string;
  onClose: () => void;
  onNavigate: (route: keyof RootStackParamList) => void;
};

/** Drawer direito F28 — links do site + logout. */
export function MobileDrawer({
  open,
  activeRoute,
  onClose,
  onNavigate,
}: Props) {
  const insets = useSafeAreaInsets();

  async function onLogout() {
    onClose();
    await logoutLocal();
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Fechar menu"
        />
        <View
          style={[
            styles.drawer,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 16),
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
                style={[styles.link, active && styles.linkActive]}
                onPress={() => {
                  onNavigate(link.route);
                  onClose();
                }}
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
            style={styles.link}
            onPress={() => {
              onNavigate("Planos");
              onClose();
            }}
          >
            <Icon name="star" size={18} color={brand.textSecondary} />
            <Text style={styles.linkLabel}>Planos</Text>
          </Pressable>

          <Pressable style={styles.logout} onPress={() => void onLogout()}>
            <Icon name="logout" size={18} color={brand.danger} />
            <Text style={styles.logoutLabel}>Sair</Text>
          </Pressable>
        </View>
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
    maxWidth: 320,
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
