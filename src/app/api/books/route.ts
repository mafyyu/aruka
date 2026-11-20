import { NextResponse } from "next/server";
import { bodySchema, BookResponseSchema } from "@/lib/schema/book";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";

export const POST = apiHandler({
  body: bodySchema,
  handle: async ({ body }) => {
    const { isbn } = body;

    const baseUrl = process.env.RAKUTEN_API_BASE_URL;
    if (!baseUrl) {
      throw new ApiError(500, "RAKUTEN_API_BASE_URL is not configured");
    }

    let res: Response;
    try {
      res = await fetch(`${baseUrl}&isbn=${isbn}`);
    } catch (error) {
      throw new ApiError(
        502,
        "Unexpected error while fetching Rakuten API",
        error,
      );
    }
    if (!res.ok) {
      throw new ApiError(
        502,
        "Failed to fetch data from Rakuten API",
        `Rakuten API responded with ${res.status}`,
      );
    }

    const data = await res.json().catch((error) => {
      throw new ApiError(502, "Invalid book API response", error);
    });
    const parsedResponse = BookResponseSchema.safeParse(data);
    if (!parsedResponse.success) {
      throw new ApiError(
        502,
        "Invalid book API response",
        parsedResponse.error,
      );
    }

    return NextResponse.json(parsedResponse.data, { status: 200 });
  },
});
