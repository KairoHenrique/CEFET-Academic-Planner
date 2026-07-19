import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import { SoftToast } from "./SoftToast";
import { UpdateAvailableModal } from "./UpdateAvailableModal";
import { useAppUpdateCheck } from "./useAppUpdateCheck";

type UpdateCheckContextValue = {
  checkManually: () => void;
};

const UpdateCheckContext = createContext<UpdateCheckContextValue>({
  checkManually: () => undefined,
});

export function useUpdateCheck(): UpdateCheckContextValue {
  return useContext(UpdateCheckContext);
}

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const {
    prompt,
    toast,
    dismissToast,
    checkManually: runCheck,
    handleChoice,
  } = useAppUpdateCheck({ autoCheck: true });

  const checkManually = useCallback(() => {
    void runCheck();
  }, [runCheck]);

  const value = useMemo(() => ({ checkManually }), [checkManually]);

  return (
    <UpdateCheckContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {prompt ? (
          <UpdateAvailableModal
            open
            localVersion={prompt.localVersion}
            remoteVersion={prompt.remoteVersion}
            apkUrl={prompt.apkUrl}
            notes={prompt.notes}
            onChoice={(choice) => void handleChoice(choice)}
          />
        ) : null}
        <SoftToast
          open={Boolean(toast)}
          kicker={toast?.kicker ?? ""}
          message={toast?.message ?? null}
          tone={toast?.tone ?? "ok"}
          onDismiss={dismissToast}
        />
      </View>
    </UpdateCheckContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
