import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";
import { submitTaskStyles as styles } from "./submit-task-panel.styles";

type Props = {
  comment: string;
  fileName: string | null;
  fileSize: number | null;
  busy: boolean;
  error: string | null;
  onCommentChange: (value: string) => void;
  onPickFile: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubmitTaskForm({
  comment,
  fileName,
  fileSize,
  busy,
  error,
  onCommentChange,
  onPickFile,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <>
      <Text style={styles.hint}>
        Escolha o arquivo e, se quiser, deixe um comentário para o professor.
      </Text>

      <Text style={styles.label}>Arquivo da entrega</Text>
      <Pressable
        style={[styles.dropzone, fileName ? styles.dropzoneFilled : null]}
        onPress={onPickFile}
        disabled={busy}
      >
        <View style={styles.dropRow}>
          <Icon name="plus" size={14} color={brand.gold200} />
          <Text style={styles.dropName} numberOfLines={1}>
            {fileName ?? "Escolher arquivo"}
          </Text>
        </View>
        <Text style={styles.dropHint}>
          {fileName && fileSize != null
            ? formatFileSize(fileSize)
            : "PDF, código ou documento · até 10 MB"}
        </Text>
      </Pressable>

      <Text style={styles.label}>
        Comentário ao professor
        <Text style={styles.optional}> opcional</Text>
      </Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Visível no SIGAA"
        placeholderTextColor={brand.textMuted}
        value={comment}
        onChangeText={onCommentChange}
        multiline
        textAlignVertical="top"
        editable={!busy}
        maxLength={8000}
      />

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.btnOutline} onPress={onCancel} disabled={busy}>
          <Text style={styles.btnOutlineText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[
            styles.btnGold,
            styles.actionGold,
            (busy || !fileName) && styles.disabled,
          ]}
          disabled={busy || !fileName}
          onPress={onSubmit}
        >
          {busy ? (
            <ActivityIndicator color={brand.bg} />
          ) : (
            <>
              <Icon name="check" size={14} color={brand.bg} />
              <Text style={styles.btnGoldText}>Enviar tarefa</Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );
}
