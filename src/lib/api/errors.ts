// APIで想定している失敗を表すエラー
// message はレスポンスに返すので、内部情報は含めない。詳細は cause に入れてログにだけ出す
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type DbError = { code?: string; message: string };

// Supabaseのエラーを意味のあるステータスに変換して投げる
// fallbackMessage は想定外のDBエラー(500)のときに返す文言
export function throwDbError(error: DbError, fallbackMessage: string): never {
  // 一意制約違反(すでに登録されている)
  if (error.code === "23505") {
    throw new ApiError(409, "Already exists", error);
  }
  // .single() で対象の行がない
  if (error.code === "PGRST116") {
    throw new ApiError(404, "Not found", error);
  }
  throw new ApiError(500, fallbackMessage, error);
}
