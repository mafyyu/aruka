import z from "zod";
import { BookSchema } from "./book";

// ライブラリに登録済みの本の状態
export const OwnedStatusSchema = z.enum(["in_library", "owned"]);
export type OwnedStatus = z.infer<typeof OwnedStatusSchema>;

// 未登録を含めた、ある本のライブラリ上の状態
export type LibraryStatus = OwnedStatus | "not_in_library";

export const UserBookSchema = z.object({
  isOwned: OwnedStatusSchema,
  book: BookSchema,
});

export const UserBookListSchema = z.array(UserBookSchema);

export type UserBook = z.infer<typeof UserBookSchema>;

// DBの is_owned(boolean)をアプリ内の状態に変換する
export function toOwnedStatus(isOwned: boolean): OwnedStatus {
  return isOwned ? "owned" : "in_library";
}

// user_books から books を結合して取得するときの select
export const USER_BOOK_SELECT = `
  is_owned,
  books (
    isbn,
    title,
    titleKana,
    author,
    publisherName,
    image,
    caption,
    salesDate
  )
`;
