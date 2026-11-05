import z from "zod";

export const IsbnSchema = z
  .string()
  .length(13)
  .regex(/^(978|979)\d{10}$/, "Invalid ISBN");

// アプリ内で扱う書籍の形(DBのbooksテーブルと同じ)
export const BookSchema = z.object({
  title: z.string(),
  titleKana: z.string(),
  author: z.string(),
  publisherName: z.string(),
  isbn: IsbnSchema,
  image: z.string().nullable(),
  caption: z.string(),
  salesDate: z.string(),
});

export type Book = z.infer<typeof BookSchema>;
