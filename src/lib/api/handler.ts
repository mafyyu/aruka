import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { createSupabaseClient } from "@/lib/supabase";
import { ApiError } from "./errors";

type Supabase = Awaited<ReturnType<typeof createSupabaseClient>>["supabase"];

type HandlerContext<Body, Params, Query> = {
  request: NextRequest;
  supabase: Supabase;
  userId: string;
  body: Body;
  params: Params;
  query: Query;
};

type RouteContext = { params: Promise<unknown> };

function parseOrThrow<S extends z.ZodType>(
  schema: S,
  value: unknown,
  message: string,
): z.output<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(400, message, parsed.error);
  }
  return parsed.data;
}

// 認証・入力検証・エラー処理を共通化したRoute Handlerを作る
// - body / params / query に zod スキーマを渡すと検証済みの値が handle に渡る
// - handle の中で ApiError を throw すると、ステータスつきのレスポンスになる
// - それ以外の例外は500で返し、詳細はログにだけ出す
export function apiHandler<
  Body extends z.ZodType = z.ZodUndefined,
  Params extends z.ZodType = z.ZodUndefined,
  Query extends z.ZodType = z.ZodUndefined,
>(options: {
  body?: Body;
  params?: Params;
  query?: Query;
  handle: (
    ctx: HandlerContext<z.output<Body>, z.output<Params>, z.output<Query>>,
  ) => Promise<NextResponse>;
}) {
  return async (request: NextRequest, routeContext: RouteContext) => {
    try {
      const { supabase, userId } = await createSupabaseClient();
      if (!userId) {
        throw new ApiError(401, "Unauthorized");
      }

      let body: unknown;
      if (options.body) {
        const json = await request.json().catch(() => {
          throw new ApiError(400, "Invalid JSON body");
        });
        body = parseOrThrow(options.body, json, "Invalid request body");
      }

      let params: unknown;
      if (options.params) {
        params = parseOrThrow(
          options.params,
          await routeContext.params,
          "Invalid path parameter",
        );
      }

      let query: unknown;
      if (options.query) {
        query = parseOrThrow(
          options.query,
          Object.fromEntries(request.nextUrl.searchParams),
          "Invalid query parameter",
        );
      }

      return await options.handle({
        request,
        supabase,
        userId,
        body: body as z.output<Body>,
        params: params as z.output<Params>,
        query: query as z.output<Query>,
      });
    } catch (error) {
      return toErrorResponse(request, error);
    }
  };
}

function toErrorResponse(request: NextRequest, error: unknown) {
  const where = `${request.method} ${request.nextUrl.pathname}`;

  if (error instanceof ApiError) {
    // 4xxはクライアント起因なので、原因がある場合だけログに残す
    if (error.status >= 500) {
      console.error(
        `[api] ${where} ${error.status}: ${error.message}`,
        error.cause,
      );
    } else if (error.cause) {
      console.warn(
        `[api] ${where} ${error.status}: ${error.message}`,
        error.cause,
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  console.error(`[api] ${where} unhandled error`, error);
  return NextResponse.json(
    { error: "Unexpected server error" },
    { status: 500 },
  );
}
