import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "추천템 — 사용자 추천 아이템 모음",
  description:
    "사용자들이 서로 추천하는 제품을 링크로 등록하고 카테고리별로 공유하는 페이지",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold text-brand">
              🛍️ 추천템
            </Link>
            <Link
              href="/new"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              + 추천템 등록
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-xs text-gray-400">
          링크만 붙여넣으면 이미지·가격이 자동으로 채워져요.
        </footer>
      </body>
    </html>
  );
}
