import { NextResponse } from "next/server";
import z from "zod";
import { IsbnSchema } from "@/lib/schema/book";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";

type LibraryStatus = "not_in_library" | "in_library" | "owned";

// user_booksに存在するか確認するAPI
export const GET = apiHandler({
  query: z.object({ isbn: IsbnSchema }),
  handle: async ({ supabase, userId, query }) => {
    const { data, error } = await supabase
      .from("user_books")
      .select("is_owned")
      .eq("isbn", query.isbn)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new ApiError(500, "DB error", error);

    let status: LibraryStatus;
    if (!data) {
      status = "not_in_library";
    } else if (data.is_owned) {
      status = "owned";
    } else {
      status = "in_library";
    }

    return NextResponse.json({ status });
  },
});
