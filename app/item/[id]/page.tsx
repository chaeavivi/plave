import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { isNaverConfigured, searchLowestPrice } from "@/lib/naver";
import { toAffiliateLink } from "@/lib/affiliate";
import LikeButton from "@/components/LikeButton";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await prisma.item.findUnique({ where: { id: params.id } });
  if (!item) notFound();

  // 구매 링크 (제휴 키가 있으면 제휴 링크로 자동 변환)
  const { href: buyHref, isAffiliate } = await toAffiliateLink(item.url);

  // 최저가: 네이버 키가 있을 때만 상품명으로 조회
  const lowest = isNaverConfigured()
    ? await searchLowestPrice(item.title, 5)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
        ← 목록으로
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl text-gray-300">
              🛍️
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {categoryLabel(item.category)}
            {item.sourceSite ? ` · ${item.sourceSite}` : ""}
          </span>
          <h1 className="text-xl font-bold leading-snug">{item.title}</h1>
          <p className="text-2xl font-bold text-brand">
            {formatPrice(item.price, item.currency)}
          </p>

          {item.description && (
            <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
              {item.description}
            </p>
          )}

          <div className="mt-1 flex items-center gap-3">
            <LikeButton itemId={item.id} initialLikes={item.likes} />
            <span className="text-xs text-gray-400">by {item.authorName}</span>
          </div>

          <a
            href={buyHref}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-2 block rounded-xl bg-brand py-3 text-center text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            구매하러 가기 →
          </a>
          {isAffiliate && (
            <p className="text-center text-[11px] text-gray-400">
              * 제휴 링크를 통해 일정 수수료를 받을 수 있어요.
            </p>
          )}
        </div>
      </div>

      {/* 최저가 비교 섹션 (네이버 쇼핑 API 키가 있을 때만 표시) */}
      {isNaverConfigured() && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">🔎 다른 곳 최저가</h2>
          {lowest.length === 0 ? (
            <p className="text-sm text-gray-400">
              비슷한 상품의 최저가 정보를 찾지 못했어요.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {lowest.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-3 p-3 transition hover:bg-gray-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-400">{s.mallName}</p>
                    </div>
                    <span className="shrink-0 font-bold text-brand">
                      {formatPrice(s.lprice)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
