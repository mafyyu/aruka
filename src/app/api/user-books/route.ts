import { NextResponse } from "next/server";
import { IsbnSchema, UserBookResponseSchema } from "@/lib/schema/book";
import { apiHandler } from "@/lib/api/handler";
import { ApiError, throwDbError } from "@/lib/api/errors";
import z from "zod";

// ユーザが登録した本を全て取得するAPI
export const GET = apiHandler({
  handle: async ({ supabase, userId }) => {
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
      .eq("user_id", userId);

    if (error) throwDbError(error, "Failed to fetch user books");

    const result = data
      .filter((row) => row.books !== null)
      .map((row) => ({
        isOwned: row.is_owned ? "owned" : "in_library",
        book: row.books,
      }));

    const parsedResult = UserBookResponseSchema.safeParse(result);
    if (!parsedResult.success) {
      throw new ApiError(500, "Invalid user books data", parsedResult.error);
    }

    return NextResponse.json(parsedResult.data);
  },
});

const bodySchema = z.object({
  isbn: IsbnSchema,
  isOwned: z.boolean(),
});

// user_booksに登録するAPI
export const POST = apiHandler({
  body: bodySchema,
  handle: async ({ supabase, userId, body }) => {
    const { error } = await supabase.from("user_books").insert({
      isbn: body.isbn,
      user_id: userId,
      is_owned: body.isOwned,
    });
    if (error) throwDbError(error, "Failed to register book");

    return NextResponse.json({ result: "created" }, { status: 201 });
  },
});

// 購入済みを変更するAPI
export const PATCH = apiHandler({
  body: bodySchema,
  handle: async ({ supabase, userId, body }) => {
    const { error } = await supabase
      .from("user_books")
      .update({
        is_owned: body.isOwned,
      })
      .select("is_owned")
      .eq("user_id", userId)
      .eq("isbn", body.isbn)
      .single();

    if (error) throwDbError(error, "Failed to update book status");

    return NextResponse.json({ result: "success update" }, { status: 200 });
  },
});
