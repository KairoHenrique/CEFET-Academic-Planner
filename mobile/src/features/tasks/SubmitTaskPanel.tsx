import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { AcademicTask } from "@acme/api-contracts";
import { getTaskSubmissionStatus, submitTarefaToSigaa, completeDeviceTaskSubmission } from "../../api/mutations";
import { ApiClientError } from "../../auth/api";
import { submitTarefaOnDevice } from "../../device-sync/submit-tarefa-http";
import { DeviceSyncError } from "../../device-sync/login-sigaa-http";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";
import { SubmitTaskForm } from "./SubmitTaskForm";
import { SubmitTaskResult } from "./SubmitTaskResult";
import { pollTaskSubmissionUntilDone } from "./poll-submission-status";
import { submitTaskStyles as styles } from "./submit-task-panel.styles";

type Props = {
  task: AcademicTask;
  onSubmitted?: () => void;
};

/** Botão + modal — paridade visual com o envio do site. */
export function SubmitTaskPanel({ task, onSubmitted }: Props) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{
    ok: boolean;
    title: string;
    message: string;
  } | null>(null);

  if (task.done || task.manual) return null;

  function close() {
    if (busy) return;
    setOpen(false);
    setError(null);
    setOutcome(null);
    setProcessing(false);
  }

  async function pickFile() {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        setError("Arquivo excede 10 MB (limite do SIGAA).");
        return;
      }
      setFileUri(asset.uri);
      setFileName(asset.name ?? "arquivo");
      setFileMime(asset.mimeType ?? null);
      setFileSize(asset.size ?? null);
      setError(null);
    } catch {
      setError("Não foi possível selecionar o arquivo.");
    }
  }

  async function onSubmit() {
    if (!fileUri || !fileName) {
      setError("Selecione o arquivo da entrega.");
      return;
    }
    setBusy(true);
    setProcessing(true);
    setError(null);
    try {
      const form = new FormData();
      if (comment.trim()) form.append("comment", comment.trim());
      const normalizedUri =
        Platform.OS === "android" && !fileUri.startsWith("file://")
          ? `file://${fileUri}`
          : fileUri;
      form.append("file", {
        uri: normalizedUri,
        name: fileName,
        type: fileMime ?? "application/octet-stream",
      } as unknown as Blob);
      const submitResult = await submitTarefaToSigaa(task.id, form);

      if (submitResult.deviceRequired || submitResult.status === "device_required") {
        try {
          await submitTarefaOnDevice({
            tarefaTitulo: submitResult.tarefaTitulo || task.title,
            sigaaLinkId: submitResult.sigaaLinkId,
            fileUri,
            fileName,
            fileMime,
            comment,
          });
          await completeDeviceTaskSubmission(task.id, {
            submissionId: submitResult.submissionId,
            ok: true,
          });
          setComment("");
          setFileUri(null);
          setFileName(null);
          setOutcome({
            ok: true,
            title: "Tarefa enviada",
            message: "Envio confirmado no SIGAA.",
          });
          onSubmitted?.();
          return;
        } catch (deviceErr) {
          const message =
            deviceErr instanceof DeviceSyncError ||
            deviceErr instanceof ApiClientError
              ? deviceErr.message
              : "Não foi possível enviar a tarefa.";
          await completeDeviceTaskSubmission(task.id, {
            submissionId: submitResult.submissionId,
            ok: false,
            errorMessage: message,
          }).catch(() => undefined);
          setOutcome({
            ok: false,
            title: "Não foi possível enviar",
            message,
          });
          return;
        }
      }

      const poll = await pollTaskSubmissionUntilDone(
        () => getTaskSubmissionStatus(task.id, submitResult.submissionId),
        { dryRun: false }
      );

      setComment("");
      setFileUri(null);
      setFileName(null);

      if (poll.kind === "completed") {
        setOutcome({
          ok: true,
          title: "Tarefa enviada",
          message: poll.message,
        });
        onSubmitted?.();
        return;
      }

      setOutcome({
        ok: false,
        title: "Não foi possível enviar",
        message: poll.message,
      });
    } catch (err) {
      setOutcome({
        ok: false,
        title: "Não foi possível enviar",
        message:
          err instanceof ApiClientError
            ? err.message
            : "Não foi possível enviar a tarefa.",
      });
    } finally {
      setBusy(false);
      setProcessing(false);
    }
  }

  return (
    <>
      <Pressable style={styles.btnGold} onPress={() => setOpen(true)}>
        <Icon name="clipboard" size={14} color={brand.bg} />
        <Text style={styles.btnGoldText}>Enviar tarefa</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.head}>
              <View style={styles.headText}>
                <Text style={styles.title}>Enviar no SIGAA</Text>
                <Text style={styles.aside} numberOfLines={1}>
                  {task.title}
                </Text>
              </View>
              <Pressable
                onPress={close}
                hitSlop={8}
                accessibilityLabel="Fechar"
                style={styles.closeBtn}
              >
                <Icon name="close" size={16} color={brand.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              {!task.submittable ? (
                <Text style={styles.hint}>
                  Esta tarefa ainda não tem vínculo com o portal. Sincronize e
                  abra de novo.
                </Text>
              ) : outcome ? (
                <SubmitTaskResult
                  ok={outcome.ok}
                  title={outcome.title}
                  message={outcome.message}
                  onDismiss={() => {
                    setOutcome(null);
                    close();
                  }}
                  onRetry={
                    outcome.ok
                      ? undefined
                      : () => {
                          setOutcome(null);
                          setError(null);
                        }
                  }
                />
              ) : processing ? (
                <View style={styles.processing} accessibilityRole="text">
                  <ActivityIndicator size="large" color={brand.gold} />
                  <Text style={styles.processingTitle}>Enviando no SIGAA…</Text>
                  <Text style={styles.hint}>
                    Estamos enviando sua tarefa. Isso pode levar alguns
                    segundos — só confirmamos quando o SIGAA receber.
                  </Text>
                </View>
              ) : (
                <SubmitTaskForm
                  comment={comment}
                  fileName={fileName}
                  fileSize={fileSize}
                  busy={busy}
                  error={error}
                  onCommentChange={setComment}
                  onPickFile={() => void pickFile()}
                  onCancel={close}
                  onSubmit={() => void onSubmit()}
                />
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
