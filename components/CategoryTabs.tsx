import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function CategoryTabs({
  active,
  sort,
}: {
  active?: string;
  sort?: string;
}) {
  const sortParam = sort ? `&sort=${sort}` : "";
  const tabs = [{ slug: "", label: "전체", emoji: "✨" }, ...CATEGORIES];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const isActive = (active ?? "") === t.slug;
        const href = t.slug
          ? `/?category=${t.slug}${sortParam}`
          : sort
            ? `/?sort=${sort}`
            : "/";
        return (
          <Link
            key={t.slug || "all"}
            href={href}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              isActive
                ? "border-brand bg-brand text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            <span className="mr-1">{t.emoji}</span>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
