import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand } from "../theme/brand";
import { Icon } from "../ui/Icon";

type Props = {
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onOpenNotifications: () => void;
  onOpenSync: () => void;
  onOpenProfile: () => void;
  onPressBrand: () => void;
  unreadCount?: number;
  syncing?: boolean;
  /** Iniciais do aluno (site: KM) — nunca "Eu". */
  initials?: string;
};

/** Navbar F28 — logo real + ACME HUB + sino · sync · avatar · hamburger. */
export function F28Navbar({
  drawerOpen,
  onToggleDrawer,
  onOpenNotifications,
  onOpenSync,
  onOpenProfile,
  onPressBrand,
  unreadCount = 0,
  syncing = false,
  initials = "??",
}: Props) {
  const insets = useSafeAreaInsets();
  const avatarLabel = initials.trim() || "??";

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.inner}>
        <Pressable
          onPress={onPressBrand}
          style={styles.brand}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="ACME HUB — Dashboard"
        >
          <Image
            source={require("../../assets/logo_v2.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text style={styles.brandText}>ACME HUB</Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={onOpenNotifications}
            style={styles.iconBtn}
            accessibilityLabel="Notificações"
            hitSlop={6}
          >
            <Icon name="bell" size={18} color={brand.gold} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            onPress={onOpenSync}
            style={[styles.iconBtn, syncing && styles.iconBtnBusy]}
            accessibilityLabel={
              syncing ? "Sincronizando SIGAA" : "Sync SIGAA"
            }
            accessibilityState={{ busy: syncing, disabled: syncing }}
            disabled={syncing}
            hitSlop={6}
          >
            <Icon name="sync" size={18} color={brand.gold} />
          </Pressable>

          <Pressable
            onPress={onOpenProfile}
            style={styles.avatarBtn}
            accessibilityLabel={`Perfil ${avatarLabel}`}
            hitSlop={6}
          >
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </Pressable>

          <Pressable
            onPress={onToggleDrawer}
            style={styles.iconBtn}
            accessibilityLabel={drawerOpen ? "Fechar menu" : "Abrir menu"}
            hitSlop={6}
          >
            <Icon
              name={drawerOpen ? "close" : "menu"}
              size={18}
              color={brand.gold}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "rgba(0,16,32,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    zIndex: 20,
  },
  inner: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  logo: {
    width: 36,
    height: 36,
  },
  brandText: {
    fontFamily: brand.fontDisplay,
    fontWeight: "800",
    fontSize: 15,
    color: brand.text,
    letterSpacing: 0.4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: brand.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconBtnBusy: {
    opacity: 0.55,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: brand.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.white,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,88,168,0.45)",
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  avatarText: {
    fontSize: 11,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
});
