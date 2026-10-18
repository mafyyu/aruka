import { NextResponse } from "next/server";
import z from "zod";
import { IsbnSchema, UserBookSchema } from "@/lib/schema/book";
import { apiHandler } from "@/lib/api/handler";
import { ApiError, throwDbError } from "@/lib/api/errors";

// isbnを受け取ってuser-booksに含まれる場合、その書籍データを返すAPI
export const GET = apiHandler({
  params: z.object({ isbn: IsbnSchema }),
  handle: async ({ supabase, userId, params }) => {
    const { data, error } = await supabase
      .from("user_books")
      .select(
        `
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
      `,
      )
      .eq("user_id", userId)
      .eq("isbn", params.isbn)
      .maybeSingle();

    if (error) throwDbError(error, "Failed to fetch user books");

    if (!data || !data.books) {
      throw new ApiError(404, "Book not found");
    }

    const parsedResult = UserBookSchema.safeParse({
      isOwned: data.is_owned ? "owned" : "in_library",
      book: data.books,
    });
    if (!parsedResult.success) {
      throw new ApiError(500, "Invalid user book data", parsedResult.error);
    }

    return NextResponse.json(parsedResult.data);
  },
});
