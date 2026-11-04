import type { UserBook } from "@/lib/schema/book";
import OwnedStatusBadge from "./OwnedStatusBadge";
import Image from "next/image";
import Divider from "./Divider";

const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff",
    color: "#171717",
    padding: "8px 16px 24px",
  },
  imgContainer: {
    width: "100%",
    maxWidth: "120px",
    marginTop: "10%",
  },
  cover: {
    width: "100%",
    filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.50))",
    aspectRatio: "2 / 3",
    objectFit: "cover",
  },
  contents: {
    display: "flex",
    flexDirection: "column",
    marginTop: "20px",
    gap: "10px",
    width: "100%",
    maxWidth: "65%",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    width: "100%",
    textAlign: "center" as const,
    fontSize: "25px",
    lineHeight: 1.4,
    overflowWrap: "anywhere" as const,
  },
  author: {
    width: "100%",
    textAlign: "center" as const,
    fontWeight: "normal" as const,
    lineHeight: 1.6,
    overflowWrap: "anywhere" as const,
  },
} as const;

type BookDetailProps = {
  userBook: UserBook;
};

export default function BookDetail({ userBook }: BookDetailProps) {
  const { book, isOwned } = userBook;

  return (
    <div style={styles.container}>
      <div style={styles.imgContainer}>
        {book.image && (
          <Image
            style={styles.cover}
            src={book.image}
            alt={`「${book.title}」の表紙`}
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
        <OwnedStatusBadge status={isOwned}></OwnedStatusBadge>
        <Divider text={"あらすじ"}></Divider>
        <h4 style={styles.author}>{book.caption}</h4>
      </div>
    </div>
  );
}
