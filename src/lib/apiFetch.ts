export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// res.ok を確認し、JSON以外のレスポンスでもステータスを保ったままエラーにする
export async function apiFetch<T>(
  input: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      typeof body?.error === "string" ? body.error : fallbackMessage;
    throw new ApiError(message, res.status);
  }

  return (await res.json().catch(() => ({}))) as T;
}
