import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { brand } from "../theme/brand";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Modal de detalhe — paridade com `Modal` + ActivityDetail do site. */
export function DetailModal({ visible, title, onClose, children }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sheet: {
    backgroundColor: brand.bgSecondary,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 16,
    maxHeight: "88%",
  },
  title: {
    fontSize: 17,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.text,
    marginBottom: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  footer: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: brand.borderMuted,
    paddingTop: 8,
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  closeBtnText: {
    color: brand.textMuted,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
});
