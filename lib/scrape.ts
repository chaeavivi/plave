import * as cheerio from "cheerio";

export interface ScrapeResult {
  title: string | null;
  imageUrl: string | null;
  price: number | null;
  sourceSite: string | null;
  url: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 문자열에서 숫자(가격)만 추출. "12,900원" -> 12900
function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0 || n > 100_000_000) return null;
  return n;
}

function absoluteUrl(src: string | undefined, base: string): string | null {
  if (!src) return null;
  try {
    return new URL(src, base).toString();
  } catch {
    return null;
  }
}

function hostLabel(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const map: Record<string, string> = {
      "coupang.com": "쿠팡",
      "smartstore.naver.com": "네이버 스마트스토어",
      "shopping.naver.com": "네이버 쇼핑",
      "brand.naver.com": "네이버 브랜드스토어",
      "gmarket.co.kr": "G마켓",
      "11st.co.kr": "11번가",
      "auction.co.kr": "옥션",
      "oliveyoung.co.kr": "올리브영",
    };
    for (const key of Object.keys(map)) {
      if (host === key || host.endsWith("." + key)) return map[key];
    }
    return host;
  } catch {
    return null;
  }
}

/**
 * 상품 링크 HTML을 받아 og 태그 / 메타 정보 기반으로 제목·이미지·가격을 추출한다.
 * 실패해도 가능한 만큼 부분 결과를 반환하고, 사용자는 수동 입력으로 보완할 수 있다.
 */
export async function scrapeProduct(url: string): Promise<ScrapeResult> {
  const empty: ScrapeResult = {
    title: null,
    imageUrl: null,
    price: null,
    sourceSite: hostLabel(url),
    url,
  };

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return empty;
    html = await res.text();
  } catch {
    return empty;
  }

  const $ = cheerio.load(html);

  const meta = (names: string[]): string | undefined => {
    for (const name of names) {
      const byProp = $(`meta[property="${name}"]`).attr("content");
      if (byProp) return byProp;
      const byName = $(`meta[name="${name}"]`).attr("content");
      if (byName) return byName;
      const byItemprop = $(`meta[itemprop="${name}"]`).attr("content");
      if (byItemprop) return byItemprop;
    }
    return undefined;
  };

  const title =
    meta(["og:title", "twitter:title"]) ||
    $("title").first().text().trim() ||
    null;

  const rawImage = meta(["og:image", "twitter:image", "twitter:image:src"]);
  const imageUrl = absoluteUrl(rawImage, url);

  // 가격: 여러 표준 메타 태그 순서대로 시도
  const priceRaw =
    meta([
      "product:price:amount",
      "og:price:amount",
      "price",
      "product:sale_price:amount",
    ]) || undefined;

  let price = parsePrice(priceRaw);

  // 메타에 없으면 JSON-LD 구조화 데이터에서 시도
  if (price === null) {
    $('script[type="application/ld+json"]').each((_, el) => {
      if (price !== null) return;
      try {
        const data = JSON.parse($(el).contents().text());
        const nodes = Array.isArray(data) ? data : [data];
        for (const node of nodes) {
          const offers = node?.offers;
          const offer = Array.isArray(offers) ? offers[0] : offers;
          const p = parsePrice(offer?.price ?? offer?.lowPrice);
          if (p !== null) {
            price = p;
            break;
          }
        }
      } catch {
        // ignore malformed JSON-LD
      }
    });
  }

  return {
    title: title ? title.slice(0, 200) : null,
    imageUrl,
    price,
    sourceSite: hostLabel(url),
    url,
  };
}
