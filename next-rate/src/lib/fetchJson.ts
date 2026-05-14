export async function parseApiResponse<T>(res: Response): Promise<T> {
  const json = await res.json();

  if (!res.ok || json?.ok === false) {
    const errorMessage = json?.error ?? "通信エラーが発生しました";
    throw new Error(errorMessage);
  }

  return json.data as T;
}
