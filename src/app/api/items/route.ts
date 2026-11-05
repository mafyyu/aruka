import { NextResponse } from "next/server";
import { BookSchema } from "@/lib/schema/book";
import { apiHandler } from "@/lib/api/handler";
import { throwDbError } from "@/lib/api/errors";

export const POST = apiHandler({
  body: BookSchema,
  handle: async ({ supabase, body: book }) => {
    // supabaseに保存
    const { data, error } = await supabase
      .from("books")
      .upsert(
        {
          isbn: book.isbn,
          title: book.title,
          titleKana: book.titleKana,
          author: book.author,
          publisherName: book.publisherName,
          image: book.image,
          caption: book.caption,
          salesDate: book.salesDate,
        },
        { onConflict: "isbn" },
      )
      .select()
      .single();

    if (error) throwDbError(error, "Failed to insert book");

    return NextResponse.json({ book: data }, { status: 201 });
  },
});
