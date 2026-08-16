import { useCallback, useState } from "react";

export type ManagementTab = "search" | "register";

export function useManagementState<T extends ManagementTab = ManagementTab>(initialTab: T = "search" as T) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<T>(initialTab);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const initialize = useCallback(() => {
    setMounted(true);
  }, []);

  const runAction = useCallback(async <R>(
    action: () => Promise<R>,
    successAction: string,
    errorAction: string = successAction.replace("-success", "-error")
  ) => {
    try {
      const result = await action();
      setLastAction(successAction);
      return result;
    } catch {
      setLastAction(errorAction);
      return undefined;
    }
  }, []);

  return {
    mounted,
    setMounted,
    activeTab,
    setActiveTab,
    lastAction,
    setLastAction,
    initialize,
    runAction,
  };
}
