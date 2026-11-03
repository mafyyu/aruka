import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "aruka?",
  description: "「あれ、この本持ってたっけ？」をすぐ確認できる書籍管理アプリ",

  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    title: "aruka?",
    statusBarStyle: "black-translucent",
  },

  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#51A25E",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className={notoSans.className}>
          <Toaster
            containerStyle={{
              top: "max(8px, env(safe-area-inset-top))",
            }}
            toastOptions={{
              style: {
                maxWidth: "min(420px, calc(100% - 32px))",
              },
            }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
