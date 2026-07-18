// 네이버 쇼핑 검색 API 연동 (최저가 조회)
// 키가 없으면 자동으로 비활성 상태가 되어 최저가 섹션이 숨겨진다.

export interface ShoppingItem {
  title: string; // HTML 태그가 제거된 상품명
  link: string;
  image: string;
  lprice: number; // 최저가
  mallName: string;
}

export function isNaverConfigured(): boolean {
  return Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

/**
 * 상품명으로 네이버 쇼핑을 검색해 최저가순 결과를 반환한다.
 * 키가 없거나 오류가 나면 빈 배열을 반환한다.
 */
export async function searchLowestPrice(
  query: string,
  display = 5
): Promise<ShoppingItem[]> {
  if (!isNaverConfigured() || !query.trim()) return [];

  const endpoint = new URL("https://openapi.naver.com/v1/search/shop.json");
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("display", String(display));
  endpoint.searchParams.set("sort", "asc"); // 가격 오름차순 = 최저가 우선

  try {
    const res = await fetch(endpoint.toString(), {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID as string,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET as string,
      },
      // 검색 결과는 캐시해 API 호출 절약 (1시간)
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: any[] };
    return (data.items ?? []).map((it) => ({
      title: stripTags(String(it.title ?? "")),
      link: String(it.link ?? ""),
      image: String(it.image ?? ""),
      lprice: Number(it.lprice ?? 0),
      mallName: String(it.mallName ?? ""),
    }));
  } catch {
    return [];
  }
}
