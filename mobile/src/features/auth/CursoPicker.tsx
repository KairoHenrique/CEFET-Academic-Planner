import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AuthCursoOption } from "@acme/api-contracts";
import { brand } from "../../theme/brand";

type Props = {
  cursos: readonly AuthCursoOption[];
  value: string;
  onChange: (cursoId: string) => void;
  disabled?: boolean;
};

export function CursoPicker({ cursos, value, onChange, disabled }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Curso</Text>
      <View style={styles.list}>
        {cursos.map((curso) => {
          const active = curso.id === value;
          return (
            <Pressable
              key={curso.id}
              style={[styles.option, active && styles.optionActive]}
              disabled={disabled}
              onPress={() => onChange(curso.id)}
            >
              <Text
                style={[styles.optionText, active && styles.optionTextActive]}
              >
                {curso.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        Define qual PPC será usado no mapa e na integralização.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: 12,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.textSecondary,
  },
  list: { gap: 6 },
  option: {
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  optionActive: {
    borderColor: brand.gold,
    backgroundColor: "rgba(212,168,67,0.16)",
  },
  optionText: {
    fontSize: 13,
    fontFamily: brand.fontBody,
    color: brand.textSecondary,
  },
  optionTextActive: {
    color: brand.gold200,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    fontFamily: brand.fontBody,
    color: brand.textMuted,
    lineHeight: 16,
  },
});
