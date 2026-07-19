import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";
import { goldRipple, pressableOpacityStyle } from "../../ui/pressableStyles";

export type UpdatePromptChoice = "download" | "later" | "dismiss";

type Props = {
  open: boolean;
  localVersion: string;
  remoteVersion: string;
  apkUrl: string;
  notes?: string;
  onChoice: (choice: UpdatePromptChoice) => void;
};

/** Popup de atualização — baixar / lembrar depois / não lembrar desta. */
export function UpdateAvailableModal({
  open,
  localVersion,
  remoteVersion,
  apkUrl,
  notes,
  onChoice,
}: Props) {
  async function onDownload() {
    try {
      await Linking.openURL(apkUrl);
    } catch {
      /* sem browser / sem intent */
    }
    onChoice("download");
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onChoice("later")}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <View style={styles.iconWrap}>
            <Icon name="download" size={22} color={brand.gold} />
          </View>
          <Text style={styles.title}>Nova versão disponível</Text>
          <Text style={styles.body}>
            Você está na {localVersion}. A versão {remoteVersion} já pode ser
            baixada pelo próprio app.
          </Text>
          {notes ? <Text style={styles.notes}>{notes}</Text> : null}

          <Pressable
            style={({ pressed }) =>
              pressableOpacityStyle(pressed, styles.primaryBtn)
            }
            android_ripple={goldRipple}
            onPress={() => void onDownload()}
            accessibilityRole="button"
            accessibilityLabel="Baixar agora"
          >
            <Icon name="download" size={16} color="#1a1408" />
            <Text style={styles.primaryLabel}>Baixar agora</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) =>
              pressableOpacityStyle(pressed, styles.secondaryBtn)
            }
            android_ripple={goldRipple}
            onPress={() => onChoice("later")}
            accessibilityRole="button"
            accessibilityLabel="Me lembre mais tarde"
          >
            <Text style={styles.secondaryLabel}>Me lembre mais tarde</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) =>
              pressableOpacityStyle(pressed, styles.ghostBtn)
            }
            onPress={() => onChoice("dismiss")}
            accessibilityRole="button"
            accessibilityLabel="Não me lembrar desta atualização"
          >
            <Text style={styles.ghostLabel}>
              Não me lembrar desta atualização
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,8,20,0.72)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: brand.radiusXl,
    borderWidth: 1,
    borderColor: brand.borderGold,
    backgroundColor: brand.bgElevated,
    padding: 20,
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(232,198,106,0.14)",
    borderWidth: 1,
    borderColor: brand.border,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    color: brand.text,
  },
  body: {
    fontSize: 14,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 20,
  },
  notes: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 17,
    marginBottom: 4,
  },
  primaryBtn: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryLabel: {
    fontSize: 15,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#1a1408",
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryLabel: {
    fontSize: 14,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.gold200,
  },
  ghostBtn: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  ghostLabel: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    textAlign: "center",
  },
});
