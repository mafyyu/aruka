import z from "zod";
import { BookSchema } from "./schema/book";
import { apiFetch } from "./apiFetch";

type Book = z.infer<typeof BookSchema>;

export async function addUserBook(book: Book, isOwned: boolean) {
  return apiFetch(
    "/api/user-books",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isbn: book.isbn,
        isOwned: isOwned,
      }),
    },
    "Failed to add book",
  );
}
