import { parseApiResponse } from "./fetchJson";

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  return parseApiResponse<T>(response);
}

export async function runApiAction<T>(
  action: () => Promise<T>,
  setLastAction: (value: string | null) => void,
  successAction: string | null,
  errorAction: string
): Promise<T | undefined> {
  try {
    const result = await action();
    if (successAction) {
      setLastAction(successAction);
    }
    return result;
  } catch {
    setLastAction(errorAction);
    return undefined;
  }
}
