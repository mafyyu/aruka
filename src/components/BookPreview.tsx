import type { Book } from "@/lib/schema/book";
import Image from "next/image";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    margin: "auto",
  },
  imgContainer: {
    width: "100%",
    maxWidth: "120px",
    margin: "auto",
  },
  cover: {
    width: "100%",
    filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.50))",
    marginTop: "20%",
  },
  contents: {
    display: "flex",
    flexDirection: "column",
    marginTop: "20px",
    gap: "10px",
  },
  title: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },
  author: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "normal",
  },
} as const;

export default function BookPreview({ book }: { book: Book }) {
  return (
    <>
      <div style={styles.container}>
        <div style={styles.imgContainer}>
          {book.image && (
            <Image
              style={styles.cover}
              src={book.image}
              alt={book.title ? `${book.title} の表紙` : "書籍の表紙"}
              width={120}
              height={180}
              sizes="120px"
            />
          )}
        </div>
        <div style={styles.contents}>
          <h3 style={styles.title}>{book.title}</h3>
          <h4 style={styles.author}>{book.author}</h4>
          <h4 style={styles.author}>ISBN-{book.isbn}</h4>
        </div>
      </div>
    </>
  );
}
