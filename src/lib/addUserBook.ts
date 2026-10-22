import type { Book } from "./schema/book";

export async function addUserBook(book: Book, isOwned: boolean) {
  const res = await fetch("/api/user-books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isbn: book.isbn,
      isOwned: isOwned,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error ?? "Failed to add book");
  }

  return res.json();
}
