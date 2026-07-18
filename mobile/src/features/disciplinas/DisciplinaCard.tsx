import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SubjectListItem } from "@acme/api-contracts";
import { gradeRiskLabel } from "../../lib/safe-text";
import { brand } from "../../theme/brand";
import { cardStyles, formatGrade } from "../../ui/cards";

type Props = {
  item: SubjectListItem;
  onPress: () => void;
};

export function DisciplinaCard({ item, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        pressed && styles.pressed,
        { borderLeftColor: item.color, borderLeftWidth: 3 },
      ]}
      onPress={onPress}
    >
      <View style={cardStyles.row}>
        <Text style={[cardStyles.cardTitle, { flex: 1 }]}>
          {item.displayName || item.name}
        </Text>
        <Text style={styles.grade}>{formatGrade(item.grade, item.gradeMax)}</Text>
      </View>
      <Text style={cardStyles.cardMeta}>
        {item.shortLabel || item.code}
        {item.ch != null ? ` · ${item.ch}h` : ""}
      </Text>
      {(item.schedule || item.room) && (
        <Text style={cardStyles.cardMeta}>
          {[item.schedule, item.room ? `Sala ${item.room}` : null]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      )}
      <Text style={cardStyles.cardMeta}>
        {gradeRiskLabel(item.gradeRisk)} · Faltas {item.absences}/
        {item.maxAbsences}
        {item.tasks > 0 ? ` · ${item.tasks} tarefa(s)` : ""}
      </Text>
      {item.professor ? (
        <Text style={cardStyles.cardMeta}>Prof. {item.professor}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  grade: {
    fontSize: 16,
    fontWeight: "800",
    color: brand.gold,
  },
});
