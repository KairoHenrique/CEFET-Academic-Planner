import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import { AppUpdateModal } from "./AppUpdateModal";
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
        <AppUpdateModal 
           prompt={prompt} 
           status={toast} 
           onChoice={(choice) => void handleChoice(choice)} 
           onDismissStatus={dismissToast} 
        />
      </View>
    </UpdateCheckContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
