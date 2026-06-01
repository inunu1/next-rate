"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type ActionToastMessages = Record<string, string>;

export function useActionToast(
  lastAction: string | null,
  messages: ActionToastMessages
) {
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!lastAction) return;

    const message = messagesRef.current[lastAction];
    if (!message) return;

    if (lastAction.includes("error")) {
      toast.error(message);
      return;
    }

    toast.success(message);
  }, [lastAction]);
}
