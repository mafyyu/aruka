import BookDetail from "@/components/BookDetail";
import BodyScrollLock from "@/components/BodyScrollLock";
import CloseHeader from "@/components/CloseHeader";
import type { UserBook } from "@/lib/schema/book";
import { cookies } from "next/headers";
import styles from "./page.module.css";

export default async function BookDetails({
  params,
}: {
  params: Promise<{ isbn: string }>;
}) {
  const cookieStore = await cookies();
  const { isbn } = await params;
  let userData: UserBook | null = null;
  let errorMessage: string | null = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/user-books/${isbn}`,
      {
        headers: {
          Cookie: cookieStore.toString(),
        },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      errorMessage = `API Error: ${res.status}`;
    } else {
      userData = await res.json();
    }
  } catch (e) {
    errorMessage = "本の詳細情報の取得に失敗しました";
    console.log(e);
  }

  return (
    <div className={styles.shell}>
      <BodyScrollLock />
      <header className={styles.header}>
        <CloseHeader href="/library" />
      </header>
      <div className={styles.scroller}>
        {errorMessage ? (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        ) : null}
        {userData && <BookDetail userBook={userData}></BookDetail>}
      </div>
    </div>
  );
}
