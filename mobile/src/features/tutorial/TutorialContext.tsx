import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PageTutorialId } from "./page-tutorial-steps";
import { tutorialIdForRoute } from "./page-tutorial-steps";

type TutorialContextValue = {
  open: boolean;
  tutorialId: PageTutorialId;
  startTutorial: (id?: PageTutorialId) => void;
  startTutorialForRoute: (route: string) => void;
  closeTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tutorialId, setTutorialId] = useState<PageTutorialId>("dashboard");

  const startTutorial = useCallback((id: PageTutorialId = "dashboard") => {
    setTutorialId(id);
    setOpen(true);
  }, []);

  const startTutorialForRoute = useCallback((route: string) => {
    setTutorialId(tutorialIdForRoute(route));
    setOpen(true);
  }, []);

  const closeTutorial = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      open,
      tutorialId,
      startTutorial,
      startTutorialForRoute,
      closeTutorial,
    }),
    [open, tutorialId, startTutorial, startTutorialForRoute, closeTutorial]
  );

  return (
    <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error("useTutorial deve ser usado dentro de TutorialProvider");
  }
  return ctx;
}
