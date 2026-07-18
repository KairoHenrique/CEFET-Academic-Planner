import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { DisciplinaGrupoDto, SubjectDetail } from "@acme/api-contracts";
import { ApiClientError } from "../../../auth/api";
import { patchAppearance } from "../../../api/mutations";
import { gradeRiskLabel } from "../../../lib/safe-text";
import { brand } from "../../../theme/brand";
import { cardStyles, formatGrade } from "../../../ui/cards";

type Props = {
  code: string;
  subject: SubjectDetail;
  grupo: DisciplinaGrupoDto;
  catalogOnly?: boolean;
  onChanged: () => void;
};

export function SubjectInfoTab({
  code,
  subject,
  grupo,
  catalogOnly,
  onChanged,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(subject.nickname ?? "");
  const [room, setRoom] = useState(subject.room ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setBusy(true);
    setError(null);
    try {
      await patchAppearance(code, {
        apelido: nickname.trim() || null,
        sala: room.trim() || null,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Falha ao salvar aparência."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {catalogOnly ? (
        <View style={cardStyles.card}>
          <Text style={cardStyles.cardMeta}>
            Perfil do PPC — disciplina ainda não matriculada neste semestre.
            Notas, faltas e tarefas ficam disponíveis ao cursar.
          </Text>
        </View>
      ) : null}

      <View
        style={[
          cardStyles.card,
          { borderLeftColor: subject.color, borderLeftWidth: 3 },
        ]}
      >
        <Text style={cardStyles.cardTitle}>{subject.displayName}</Text>
        <Text style={cardStyles.cardMeta}>
          {subject.shortLabel || subject.code}
          {subject.ch != null ? ` · ${subject.ch}h` : ""}
        </Text>
        <Text style={cardStyles.cardMeta}>
          Nota {formatGrade(subject.grade, subject.gradeMax)} (mín.{" "}
          {subject.passingGrade}) · {gradeRiskLabel(subject.gradeRisk)}
        </Text>
        {subject.professor ? (
          <Text style={cardStyles.cardMeta}>Prof. {subject.professor}</Text>
        ) : null}
        {subject.schedule ? (
          <Text style={cardStyles.cardMeta}>{subject.schedule}</Text>
        ) : null}
        {subject.room ? (
          <Text style={cardStyles.cardMeta}>Sala {subject.room}</Text>
        ) : null}

        <Pressable
          style={styles.editBtn}
          onPress={() => setEditing((v) => !v)}
        >
          <Text style={styles.editText}>
            {editing ? "Cancelar edição" : "Editar aparência"}
          </Text>
        </Pressable>
      </View>

      {editing ? (
        <View style={cardStyles.card}>
          <TextInput
            style={styles.input}
            placeholder="Apelido"
            placeholderTextColor={brand.textMuted}
            value={nickname}
            onChangeText={setNickname}
          />
          <TextInput
            style={styles.input}
            placeholder="Sala"
            placeholderTextColor={brand.textMuted}
            value={room}
            onChangeText={setRoom}
          />
          <Pressable
            style={[styles.saveBtn, busy && styles.disabled]}
            onPress={() => void onSave()}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={brand.text} />
            ) : (
              <Text style={styles.saveText}>Salvar</Text>
            )}
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : null}

      {subject.ementa ? (
        <>
          <Text style={cardStyles.sectionTitle}>Ementa</Text>
          <View style={cardStyles.card}>
            <Text style={cardStyles.cardMeta}>{subject.ementa}</Text>
          </View>
        </>
      ) : null}

      {grupo.membros.length > 0 ? (
        <>
          <Text style={cardStyles.sectionTitle}>
            Grupo{grupo.nome ? ` · ${grupo.nome}` : ""}
          </Text>
          <View style={cardStyles.card}>
            {grupo.membros.map((m, i) => (
              <Text
                key={`${m.matricula ?? m.nome}-${i}`}
                style={cardStyles.cardMeta}
              >
                {m.nome}
                {m.matricula ? ` · ${m.matricula}` : ""}
              </Text>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  editBtn: { marginTop: 10 },
  editText: { color: brand.gold, fontWeight: "700", fontSize: 13 },
  input: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: brand.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: brand.text, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  error: { color: brand.danger, marginTop: 8, fontWeight: "600" },
});
