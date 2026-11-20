"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import CloseHeader from "@/components/CloseHeader";
import BookPreview from "@/components/BookPreview";
import Divider from "@/components/Divider";
import OwnedStatusBadge from "@/components/OwnedStatusBadge";
import LibraryActionButton from "@/components/LibraryActionButton";
import styles from "./page.module.css";
import z from "zod";
import { BookSchema } from "@/lib/schema/book";
import { addBook } from "@/lib/addBook";
import { addUserBook } from "@/lib/addUserBook";
import { updateOwnStatus } from "@/lib/updateOwnStatus";
import { toast } from "react-hot-toast";
import { LoadingLottie } from "@/components/LoadingLottie";
import { useBarcodeScanner } from "./useBarcodeScanner";

type Book = z.infer<typeof BookSchema>;
type LibraryStatus = "not_in_library" | "in_library" | "owned";
type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; books: Book[]; libraryStatus: LibraryStatus }
  | { status: "notFound" }
  | { status: "error"; reason: "bookFetch" | "statusFetch" | "network" };

export default function Scan() {
  const router = useRouter();

  const [isbn, setIsbn] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const [result, setResult] = useState<Book[] | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<LibraryStatus>("not_in_library");
  const [fetchState, setFetchState] = useState<FetchState>({
    status: "idle",
  });

  // エラーからtoastを出して元の画面に戻す共通関数
  const handleScanError = (message: string) => {
    toast.error(message, { duration: 5000 });
    setIsScanning(true);
    setFetchState({ status: "idle" });
  };

  // 情報の取得
  const fetchBook = useCallback(async (isbn: string) => {
    setFetchState({ status: "loading" });
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn }),
      });

      if (!res.ok) {
        setFetchState({ status: "error", reason: "bookFetch" });
        handleScanError("本の情報を取得できませんでした。");
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setFetchState({ status: "error", reason: "bookFetch" });
        handleScanError("本の情報を取得できませんでした。");
        return;
      }

      setResult(data);

      if (data.length === 0) {
        setFetchState({ status: "notFound" });
        handleScanError("該当する書籍が見つかりませんでした。");
        return;
      }

      if (data && data.length > 0) {
        const userBooksRes = await fetch(
          `/api/user-books/status?isbn=${data[0].isbn}`,
        );
        if (!userBooksRes.ok) {
          setFetchState({ status: "error", reason: "statusFetch" });
          handleScanError("ライブラリ状態を取得できませんでした。");
          return;
        }

        const resData = await userBooksRes.json();
        setStatus(resData.status);
        setFetchState({
          status: "success",
          books: data,
          libraryStatus: resData.status,
        });
      }
    } catch (error) {
      console.log("fetchbook error", error);
      setFetchState({ status: "error", reason: "network" });
      handleScanError("通信に失敗しました。");
    }
  }, []);

  const handleBarcodeDetect = useCallback(
    (detectedIsbn: string) => {
      setIsbn(detectedIsbn);
      setIsScanning(false);
      fetchBook(detectedIsbn);
    },
    [fetchBook],
  );

  const { videoRef, cameraReady, setCameraReady } = useBarcodeScanner({
    enabled: isScanning,
    onDetect: handleBarcodeDetect,
  });

  // dbに追加する処理
  const handleAdd = async (isOwned: boolean) => {
    setIsSaving(true);
    if (!result) {
      setIsSaving(false);
      return;
    }
    try {
      await addBook(result[0]);
      await addUserBook(result[0], isOwned);
      toast.success("ライブラリに追加しました。");
      router.push("/library");
    } catch {
      toast.error("ライブラリへの追加に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // 購入済みに変更する
  const handleUpdate = async () => {
    if (!result) {
      return;
    }
    try {
      await updateOwnStatus(result[0], true);
      toast.success("購入済みに変更しました。");
      router.push("/library");
    } catch (error) {
      console.error("Failed to update book status:", error);
      toast.error("ステータスの変更に失敗しました。");
    }
  };

  return (
    <>
      <header className={styles.header}>
        <CloseHeader href="/library" />
      </header>
      <main>
        {isScanning && (
          <div>
            <div className={styles.scanner}>
              <video
                ref={videoRef}
                className={styles.video}
                playsInline
                muted
                autoPlay
                onLoadedMetadata={() => {
                  setCameraReady(true);
                }}
              />
              {cameraReady && <div className={styles.scanLine}></div>}
            </div>

            <h3 className={styles.faildScan}>読み取れない場合</h3>
            <div className={styles.container}>
              <input
                className={styles.input}
                type="tel"
                inputMode="numeric"
                name="isbn"
                id="isbn"
                maxLength={13}
                required
                placeholder="9784123456789"
                pattern="^[\x00-\x7F]+$"
                title="本の裏表紙にある「9から始まる13桁の数字（ISBN）」を入力してください"
                onChange={(e) => {
                  setIsbn(e.target.value.replace(/[^0-9]/g, ""));
                }}
              />
              <button
                className={styles.searchButton}
                type="button"
                disabled={isbn.length != 13 || !isScanning}
                onClick={() => {
                  setIsScanning(false);
                  fetchBook(isbn);
                }}
              >
                検索
              </button>
            </div>
          </div>
        )}
        {fetchState.status === "loading" && <LoadingLottie />}
        {!isScanning && result && fetchState.status === "success" && (
          <div className={styles.mainContainer}>
            <Divider text="スキャン結果"></Divider>
            <BookPreview book={result}></BookPreview>
            <OwnedStatusBadge status={status}></OwnedStatusBadge>
            <LibraryActionButton
              status={status}
              onAddOwned={
                status == "not_in_library" ? () => handleAdd(true) : undefined
              }
              onAddNotOwned={
                status == "not_in_library" ? () => handleAdd(false) : undefined
              }
              onChangeOwned={status == "in_library" ? handleUpdate : undefined}
              disabled={isSaving}
            ></LibraryActionButton>
            <button
              className={styles.rescan}
              onClick={() => {
                setIsScanning(true);
              }}
            >
              もう一度スキャン
            </button>
            <div className={styles.credit}>
              <a href="https://developers.rakuten.com/" target="_blank">
                Supported by Rakuten Developers
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
