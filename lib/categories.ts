// 추천템 카테고리 정의 (아이콘은 이모지로 간단하게)
export const CATEGORIES = [
  { slug: "fashion", label: "패션", emoji: "👕" },
  { slug: "beauty", label: "뷰티", emoji: "💄" },
  { slug: "electronics", label: "전자기기", emoji: "🔌" },
  { slug: "living", label: "생활/주방", emoji: "🍳" },
  { slug: "food", label: "식품", emoji: "🍎" },
  { slug: "hobby", label: "취미/문구", emoji: "🎨" },
  { slug: "etc", label: "기타", emoji: "📦" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string | null | undefined) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(slug: string | null | undefined): string {
  return getCategory(slug)?.label ?? "기타";
}

export function isValidCategory(slug: string): slug is CategorySlug {
  return CATEGORY_SLUGS.includes(slug as CategorySlug);
}
