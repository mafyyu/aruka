import z from "zod";
import { IsbnSchema } from "./book";

// 楽天ブックス書籍検索APIの1件分の生データ
export const RakutenItemSchema = z.object({
  title: z.string(),
  titleKana: z.string(),
  author: z.string(),
  publisherName: z.string(),
  isbn: IsbnSchema,
  largeImageUrl: z.url().optional(),
  itemCaption: z.string(),
  salesDate: z.string(),
});

// 楽天APIのレスポンスを、アプリ内の Book[] に変換する
export const RakutenSearchResponseSchema = z
  .object({
    Items: z.array(
      z.object({
        Item: RakutenItemSchema,
      }),
    ),
  })
  .transform((data) =>
    data.Items.map(({ Item }) => ({
      title: Item.title,
      titleKana: Item.titleKana,
      author: Item.author,
      publisherName: Item.publisherName,
      isbn: Item.isbn,
      image: Item.largeImageUrl ?? null,
      caption: Item.itemCaption,
      salesDate: Item.salesDate,
    })),
  );
