import Link from "next/link";
import { prisma } from "@/lib/db";
import { isValidCategory } from "@/lib/categories";
import CategoryTabs from "@/components/CategoryTabs";
import ItemCard from "@/components/ItemCard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const category = searchParams.category;
  const sort = searchParams.sort === "popular" ? "popular" : "recent";

  const where =
    category && isValidCategory(category) ? { category } : undefined;
  const orderBy =
    sort === "popular"
      ? [{ likes: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const items = await prisma.item.findMany({ where, orderBy });

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">사용자 추천템 모음</h1>
        <p className="text-sm text-gray-500">
          링크만 붙여넣으면 이미지·가격이 자동으로! 마음에 드는 제품을 추천해
          보세요.
        </p>
      </div>

      <CategoryTabs active={category} sort={sort} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{items.length}개</span>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/${category ? `?category=${category}` : ""}`}
            className={sort === "recent" ? "font-bold text-brand" : "text-gray-500"}
          >
            최신순
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href={`/?${category ? `category=${category}&` : ""}sort=popular`}
            className={
              sort === "popular" ? "font-bold text-brand" : "text-gray-500"
            }
          >
            추천순
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">아직 등록된 추천템이 없어요.</p>
          <Link
            href="/new"
            className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            첫 추천템 등록하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
