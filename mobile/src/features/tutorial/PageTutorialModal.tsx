import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";
import {
  getNativeTutorialSteps,
  type PageTutorialId,
} from "./page-tutorial-steps";

type Props = {
  tutorialId: PageTutorialId;
  open: boolean;
  onClose: () => void;
};

/** Tour guiado por tela — espelho do `PageTutorial` do site (sem spotlight DOM). */
export function PageTutorialModal({ tutorialId, open, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const steps = getNativeTutorialSteps(tutorialId);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open, tutorialId]);

  if (!open) return null;

  const step = steps[stepIndex];
  if (!step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Fechar tutorial"
        />

        <View
          style={[
            styles.card,
            {
              marginTop: Math.max(insets.top, 24) + 24,
              marginBottom: Math.max(insets.bottom, 24) + 16,
            },
          ]}
          accessibilityRole="summary"
          accessibilityLabel={`Tutorial: ${step.title}`}
        >
          <Text style={styles.stepCount}>
            {stepIndex + 1} / {steps.length}
            <Text style={styles.stepCountMuted}> · app</Text>
          </Text>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.btnOutline}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Text style={styles.btnOutlineLabel}>Fechar</Text>
            </Pressable>

            <View style={styles.nav}>
              {!isFirst ? (
                <Pressable
                  style={styles.btnOutline}
                  onPress={() => setStepIndex((value) => value - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Anterior"
                >
                  <Icon name="chevron-left" size={14} color={brand.text} />
                  <Text style={styles.btnOutlineLabel}>Anterior</Text>
                </Pressable>
              ) : null}

              {!isLast ? (
                <Pressable
                  style={styles.btnGold}
                  onPress={() => setStepIndex((value) => value + 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Próximo"
                >
                  <Text style={styles.btnGoldLabel}>Próximo</Text>
                  <Icon name="chevron-right" size={14} color={brand.textInverse} />
                </Pressable>
              ) : (
                <Pressable
                  style={styles.btnGold}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Concluir"
                >
                  <Text style={styles.btnGoldLabel}>Concluir</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 8, 20, 0.72)",
  },
  card: {
    zIndex: 2,
    backgroundColor: brand.bgElevated,
    borderRadius: brand.radiusLg,
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    padding: 20,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center",
    gap: 10,
  },
  stepCount: {
    fontSize: 12,
    fontFamily: brand.fontBodyMed,
    fontWeight: "500",
    color: brand.gold200,
    letterSpacing: 0.4,
  },
  stepCountMuted: {
    color: brand.textMuted,
  },
  title: {
    fontSize: 20,
    fontFamily: brand.fontDisplay,
    fontWeight: "700",
    color: brand.text,
  },
  body: {
    fontSize: 15,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 22,
  },
  actions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: brand.radiusSm,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  btnOutlineLabel: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.text,
  },
  btnGold: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: brand.radiusSm,
    backgroundColor: brand.gold,
  },
  btnGoldLabel: {
    fontSize: 13,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textInverse,
  },
});
