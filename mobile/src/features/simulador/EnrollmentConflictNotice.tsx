import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { EnrollmentScheduleConflictNotice } from "./lib/enrollment-schedule-conflict-notice";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";

type Props = {
  notice: EnrollmentScheduleConflictNotice;
  onDismiss: () => void;
};

/** Espelho mobile de `EnrollmentConflictNotice` (site). */
export function EnrollmentConflictNotice({ notice, onDismiss }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, 4800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notice, onDismiss]);

  const primary = notice.conflicts[0];
  const isPartner = notice.kind === "partner";

  return (
    <View style={styles.shell} accessibilityRole="alert">
      <View style={styles.head}>
        <Text style={styles.title}>
          {isPartner ? "Conflito no corequisito" : "Horário em conflito"}
        </Text>
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Fechar">
          <Icon name="close" size={14} color={brand.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.body}>
        <Text style={styles.apelido}>{notice.selectedShortLabel}</Text>
        {" · "}
        {notice.selectedName}
        {isPartner && notice.partnerShortLabel
          ? ` (parceiro ${notice.partnerShortLabel})`
          : ""}
        {primary
          ? ` choca com ${primary.shortLabel} · ${primary.horario}`
          : ""}
        {notice.conflicts.length > 1
          ? ` (+${notice.conflicts.length - 1})`
          : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: 10,
    padding: 12,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: "rgba(248,81,73,0.45)",
    backgroundColor: "rgba(248,81,73,0.14)",
    gap: 6,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: "#FF7B72",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  body: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
    lineHeight: 17,
  },
  apelido: {
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
  },
});
