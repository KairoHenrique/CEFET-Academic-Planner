import { Pressable, Text, View } from "react-native";
import { brand } from "../../theme/brand";
import { Icon } from "../../ui/Icon";
import { submitTaskStyles as styles } from "./submit-task-panel.styles";

type Props = {
  ok: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
};

export function SubmitTaskResult({ ok, title, message, onDismiss, onRetry }: Props) {
  return (
    <View
      style={styles.result}
      accessibilityRole={ok ? "text" : "alert"}
    >
      <View style={[styles.resultIcon, ok ? styles.resultIconOk : styles.resultIconFail]}>
        <Icon
          name={ok ? "check" : "close"}
          size={22}
          color={ok ? brand.success : brand.danger}
        />
      </View>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text style={styles.resultHint}>{message}</Text>
      <View style={styles.actions}>
        {!ok && onRetry ? (
          <Pressable style={styles.btnOutline} onPress={onRetry}>
            <Text style={styles.btnOutlineText}>Tentar de novo</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.btnGold, styles.actionGold]}
          onPress={onDismiss}
        >
          <Icon name="check" size={14} color={brand.bg} />
          <Text style={styles.btnGoldText}>{ok ? "Entendi" : "Fechar"}</Text>
        </Pressable>
      </View>
    </View>
  );
}
