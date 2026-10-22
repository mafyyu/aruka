import z from "zod";
import { BookSchema } from "./schema/book";
import { apiFetch } from "./apiFetch";

type Book = z.infer<typeof BookSchema>;

export async function addBook(book: Book) {
  return apiFetch(
    "/api/items",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(book),
    },
    "Failed to add book",
  );
}
