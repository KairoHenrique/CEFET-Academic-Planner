import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { AcademicTask } from "@acme/api-contracts";
import { submitTarefaToSigaa } from "../../api/mutations";
import { ApiClientError } from "../../auth/api";
import { brand } from "../../theme/brand";

type Props = {
  task: AcademicTask;
  onSubmitted?: () => void;
};

export function SubmitTaskPanel({ task, onSubmitted }: Props) {
  const [comment, setComment] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!task.submittable || task.done) return null;

  async function pickFile() {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.name ?? "arquivo");
      setFileMime(asset.mimeType ?? null);
    } catch {
      Alert.alert("Arquivo", "Não foi possível selecionar o arquivo.");
    }
  }

  async function onSubmit() {
    if (!fileUri || !fileName) {
      Alert.alert("Arquivo obrigatório", "Escolha o arquivo da entrega.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("comment", comment);
      form.append("file", {
        uri: fileUri,
        name: fileName,
        type: fileMime ?? "application/octet-stream",
      } as unknown as Blob);
      await submitTarefaToSigaa(task.id, form);
      Alert.alert(
        "Envio iniciado",
        "O robô está enviando sua tarefa no SIGAA. Aguarde alguns instantes e sincronize."
      );
      onSubmitted?.();
    } catch (err) {
      Alert.alert(
        "Falha no envio",
        err instanceof ApiClientError
          ? err.message
          : "Não foi possível enviar a tarefa."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Enviar no SIGAA</Text>
      <Text style={styles.hint}>
        Escolha o arquivo e opcionalmente comente (como na tela do SIGAA).
      </Text>

      <Pressable style={styles.outlineBtn} onPress={() => void pickFile()}>
        <Text style={styles.outlineBtnText}>
          {fileName ? `Arquivo: ${fileName}` : "Escolher arquivo"}
        </Text>
      </Pressable>

      <Text style={styles.label}>Comentários para o professor</Text>
      <TextInput
        style={styles.input}
        placeholder="Opcional — visível no SIGAA"
        placeholderTextColor={brand.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.submitBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={() => void onSubmit()}
      >
        {busy ? (
          <ActivityIndicator color={brand.bg} />
        ) : (
          <Text style={styles.submitText}>Enviar tarefa</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 20,
    padding: 14,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.borderGold,
    backgroundColor: "rgba(232,198,106,0.08)",
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    color: brand.gold200,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: brand.textSecondary,
    fontFamily: brand.fontBody,
  },
  label: {
    fontSize: 12,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    color: brand.textMuted,
    marginTop: 4,
  },
  input: {
    minHeight: 88,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    color: brand.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: brand.fontBody,
    fontSize: 14,
  },
  outlineBtn: {
    minHeight: 44,
    borderRadius: brand.radiusMd,
    borderWidth: 1,
    borderColor: brand.borderEmphasis,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
  },
  outlineBtnText: {
    color: brand.gold200,
    fontFamily: brand.fontBodySemi,
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
  submitBtn: {
    minHeight: 46,
    borderRadius: brand.radiusMd,
    backgroundColor: brand.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: brand.bg,
    fontFamily: brand.fontBodyBold,
    fontWeight: "700",
    fontSize: 14,
  },
  disabled: { opacity: 0.6 },
});
