import z from "zod";
import { IsbnSchema } from "./book";

// ISBNだけを受け取るリクエストbody(/api/books)
export const IsbnBodySchema = z.object({
  isbn: IsbnSchema,
});

// ライブラリへの登録・購入状態の変更で受け取るリクエストbody(/api/user-books)
export const UserBookBodySchema = z.object({
  isbn: IsbnSchema,
  isOwned: z.boolean(),
});
