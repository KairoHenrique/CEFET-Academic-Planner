import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TurmaOfertadaCourse } from "./types";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

type Props = {
  course: TurmaOfertadaCourse;
  shortLabel: string;
  horario: string | null;
  onDismiss: () => void;
};

/** Espelho F28 de `EnrollmentSelectionFloat`. */
export function EnrollmentSelectionFloat({
  course,
  shortLabel,
  horario,
  onDismiss,
}: Props) {
  return (
    <View style={styles.shell}>
      <View style={[styles.accent, { backgroundColor: course.color }]} />
      <Pressable
        style={styles.close}
        onPress={onDismiss}
        accessibilityLabel="Desmarcar turma selecionada"
        hitSlop={8}
      >
        <Icon name="close" size={14} color={brand.textMuted} />
      </Pressable>
      <View style={styles.body}>
        <View style={styles.head}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Alocando</Text>
          </View>
          <Text style={[styles.short, { color: course.color }]}>
            {shortLabel}
          </Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {course.name}
        </Text>
        {horario ? (
          <Text style={styles.horario} numberOfLines={2}>
            {horario}
          </Text>
        ) : (
          <Text style={styles.horario}>
            Toque em um horário destacado na grade
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "relative",
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.bgElevated,
    marginBottom: brand.space3,
    overflow: "hidden",
  },
  accent: {
    width: 4,
  },
  close: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    padding: 12,
    paddingRight: 36,
    gap: 4,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: brand.radiusSm,
    backgroundColor: "rgba(212,168,67,0.16)",
    borderWidth: 1,
    borderColor: "rgba(212,168,67,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  short: {
    fontSize: 14,
    fontFamily: brand.fontDisplayExtra,
    fontWeight: "800",
  },
  name: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  horario: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
  },
});
