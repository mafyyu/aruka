import { NextRequest, NextResponse } from "next/server";
import { UserBookBodySchema } from "@/lib/schema/request";
import {
  toOwnedStatus,
  USER_BOOK_SELECT,
  UserBookListSchema,
} from "@/lib/schema/userBook";
import { createSupabaseClient } from "@/lib/supabase";

// ユーザが登録した本を全て取得するAPI
export async function GET() {
  const { supabase, userId } = await createSupabaseClient();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("user_books")
      .select(USER_BOOK_SELECT)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to fetch user books" },
        { status: 500 },
      );
    }

    const result = data
      .filter((row) => row.books !== null)
      .map((row) => ({
        isOwned: toOwnedStatus(row.is_owned),
        book: row.books,
      }));

    const parsedResult = UserBookListSchema.safeParse(result);
    if (!parsedResult.success) {
      console.error(parsedResult.error);
      return NextResponse.json(
        { error: "Invalid user books data" },
        { status: 500 },
      );
    }

    return NextResponse.json(parsedResult.data);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}

// user_booksに登録するAPI
export async function POST(request: NextRequest) {
  const { supabase, userId } = await createSupabaseClient();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = UserBookBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid ISBN data" }, { status: 400 });
  }

  const { error } = await supabase.from("user_books").insert({
    isbn: parsedBody.data.isbn,
    user_id: userId,
    is_owned: parsedBody.data.isOwned,
  });
  if (error) {
    return NextResponse.json(
      { error: "Failed to register book" },
      { status: 500 },
    );
  }

  return NextResponse.json({ result: "created" }, { status: 201 });
}

// 購入済みを変更するAPI
export async function PATCH(request: NextRequest) {
  const { supabase, userId } = await createSupabaseClient();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = UserBookBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid ISBN data" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_books")
    .update({
      is_owned: parsedBody.data.isOwned,
    })
    .select("is_owned")
    .eq("user_id", userId)
    .eq("isbn", parsedBody.data.isbn)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update book status" },
      { status: 500 },
    );
  }

  return NextResponse.json({ result: "success update" }, { status: 200 });
}
