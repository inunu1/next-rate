"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export type ActionToastMessages = Record<string, string>;

export function useActionToast(
  lastAction: string | null,
  messages: ActionToastMessages
) {
  useEffect(() => {
    if (!lastAction) return;

    const message = messages[lastAction];
    if (!message) return;

    if (lastAction.includes("error")) {
      toast.error(message);
      return;
    }

    toast.success(message);
  }, [lastAction, JSON.stringify(messages)]);
}
