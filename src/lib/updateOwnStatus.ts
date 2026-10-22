import type { Book } from "./schema/book";

export async function updateOwnStatus(book: Book, isOwned: boolean) {
  const res = await fetch("/api/user-books", {
    method: "PATCH",
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
    throw new Error(error.error ?? "Failed to update book status");
  }

  return res.json();
}
