import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand } from "../theme/brand";
import { Icon } from "../ui/Icon";
import { brandHitSlop, goldRipple, pressableOpacityStyle } from "../ui/pressableStyles";

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
          style={({ pressed }) => pressableOpacityStyle(pressed, styles.brand)}
          android_ripple={goldRipple}
          hitSlop={brandHitSlop}
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
            style={({ pressed }) => pressableOpacityStyle(pressed, styles.iconBtn)}
            android_ripple={goldRipple}
            accessibilityLabel="Notificações"
            hitSlop={brandHitSlop}
          >
            <Icon name="bell" size={18} color={brand.gold} />
            {unreadCount > 0 ? (
              <View style={styles.badge} />
            ) : null}
          </Pressable>

          <Pressable
            onPress={onOpenSync}
            style={({ pressed }) =>
              pressableOpacityStyle(pressed, [
                styles.iconBtn,
                syncing && styles.iconBtnBusy,
              ])
            }
            android_ripple={goldRipple}
            accessibilityLabel={
              syncing ? "Sincronizando SIGAA" : "Sync SIGAA"
            }
            accessibilityState={{ busy: syncing, disabled: syncing }}
            disabled={syncing}
            hitSlop={brandHitSlop}
          >
            <Icon name="sync" size={18} color={brand.gold} />
          </Pressable>

          <Pressable
            onPress={onOpenProfile}
            style={({ pressed }) =>
              pressableOpacityStyle(pressed, styles.avatarBtn)
            }
            android_ripple={goldRipple}
            accessibilityLabel={`Perfil ${avatarLabel}`}
            hitSlop={brandHitSlop}
          >
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </Pressable>

          <Pressable
            onPress={onToggleDrawer}
            style={({ pressed }) => pressableOpacityStyle(pressed, styles.iconBtn)}
            android_ripple={goldRipple}
            accessibilityLabel={drawerOpen ? "Fechar menu" : "Abrir menu"}
            hitSlop={brandHitSlop}
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
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brand.gold,
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
