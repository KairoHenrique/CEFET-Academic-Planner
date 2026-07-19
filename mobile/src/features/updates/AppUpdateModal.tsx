import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

export type UpdatePromptChoice = "download" | "later" | "dismiss";

type Props = {
  prompt: {
    localVersion: string;
    remoteVersion: string;
    apkUrl: string;
    notes?: string;
  } | null;
  status: {
    kicker: string;
    message: string;
    tone: "ok" | "info" | "warn";
  } | null;
  onChoice: (choice: UpdatePromptChoice) => void;
  onDismissStatus: () => void;
};

export function AppUpdateModal({ prompt, status, onChoice, onDismissStatus }: Props) {
  const [downloading, setDownloading] = useState(false);
  const open = Boolean(prompt || status);
  
  // Animation value for the glow effect
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          })
        ])
      ).start();
    }
  }, [open, pulseAnim]);

  if (!open) return null;

  async function onDownload() {
    if (!prompt) return;
    setDownloading(true);
    try {
      await Linking.openURL(prompt.apkUrl);
    } catch {
      // ignora
    }
    setDownloading(false);
    onChoice("download");
  }

  let toneColor: string = brand.gold;
  let title = "ATUALIZAÇÕES";
  let body = "";
  
  if (prompt) {
    toneColor = brand.gold;
    title = "ATUALIZAÇÃO DISPONÍVEL";
  } else if (status) {
    toneColor = status.tone === "ok" ? "#3FB950" : (status.tone === "warn" ? "#D29922" : "#58A6FF");
    title = status.kicker.toUpperCase();
    body = status.message;
  }

  // hex to rgba helper
  const hexToRgba = (hex: string, alpha: number) => {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const borderColor = hexToRgba(toneColor, 0.6);
  const bgColor = hexToRgba(toneColor, 0.08);
  const glowColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [hexToRgba(toneColor, 0.15), hexToRgba(toneColor, 0.4)]
  });

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => prompt ? onChoice("later") : onDismissStatus()}
      statusBarTranslucent
    >
      <BlurView intensity={30} tint="dark" style={styles.backdrop}>
        <Animated.View style={[styles.cardWrapper, { shadowColor: toneColor, shadowOpacity: pulseAnim, elevation: 20 }]}>
          <LinearGradient
            colors={["rgba(20,25,32,0.98)", "rgba(10,14,20,0.98)"]}
            style={[styles.card, { borderColor }]}
          >
            {/* Linha brilhante no topo */}
            <LinearGradient
              colors={[hexToRgba(toneColor, 0.1), toneColor, hexToRgba(toneColor, 0.1)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topGlow}
            />

            <View style={styles.head}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Icon name={prompt ? "star" : (status?.tone === "ok" ? "check" : "bell")} size={16} color={toneColor} />
                <Text style={[styles.title, { color: toneColor }]}>{title}</Text>
              </View>
              <Pressable onPress={() => prompt ? onChoice("later") : onDismissStatus()} hitSlop={12} accessibilityLabel="Fechar">
                <View style={styles.closeBtn}>
                  <Icon name="close" size={14} color={brand.textMuted} />
                </View>
              </Pressable>
            </View>
            
            {prompt ? (
              <View style={styles.contentWrap}>
                <Text style={styles.body}>
                  Você está na versão <Text style={styles.bold}>{prompt.localVersion}</Text>. A versão <Text style={styles.bold}>{prompt.remoteVersion}</Text> já pode ser baixada.
                </Text>
                {prompt.notes ? <Text style={styles.notes}>{prompt.notes}</Text> : null}
                
                <Pressable
                  style={[styles.btn, { backgroundColor: toneColor }]}
                  onPress={() => void onDownload()}
                  disabled={downloading}
                >
                  <LinearGradient
                    colors={[hexToRgba("#ffffff", 0.3), "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {downloading ? (
                    <ActivityIndicator color="#1a1408" size="small" />
                  ) : (
                    <>
                      <Icon name="download" size={16} color="#1a1408" />
                      <Text style={styles.btnText}>BAIXAR AGORA</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.contentWrap}>
                 <Text style={styles.body}>{body}</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  cardWrapper: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
    overflow: "hidden",
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: brand.fontBodyBold,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 6,
    borderRadius: 20,
  },
  contentWrap: {
    gap: 16,
  },
  body: {
    fontSize: 14,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
  notes: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 18,
    fontStyle: "italic",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },
  btnText: {
    fontSize: 14,
    fontFamily: brand.fontBodyBold,
    fontWeight: "800",
    color: "#1a1408",
    letterSpacing: 0.5,
  },
});
