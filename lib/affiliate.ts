// 제휴(수익) 링크 변환 레이어.
// 파트너스 키가 없으면 원본 링크를 그대로 반환하고,
// 키를 .env 에 넣으면 자동으로 제휴 링크로 전환된다.

export function isCoupangPartnersConfigured(): boolean {
  return Boolean(
    process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY
  );
}

function isCoupangUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith("coupang.com");
  } catch {
    return false;
  }
}

/**
 * 상품 링크를 (가능하면) 제휴 링크로 변환한다.
 *
 * 현재는 키가 없어 그대로 반환한다. 쿠팡 파트너스 승인 후
 * COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY 를 설정하면 이 함수에서
 * 파트너스 딥링크 생성 API(HMAC 서명)를 호출하도록 확장하면 된다.
 * (딥링크 API: POST /v2/providers/affiliate_open_api/apis/openapi/v1/deeplink)
 */
export async function toAffiliateLink(url: string): Promise<{
  href: string;
  isAffiliate: boolean;
}> {
  if (isCoupangUrl(url) && isCoupangPartnersConfigured()) {
    // TODO: 쿠팡 파트너스 딥링크 API 연동 (HMAC 서명 필요)
    // 승인/키 확보 전까지는 원본 링크로 폴백한다.
    return { href: url, isAffiliate: false };
  }
  return { href: url, isAffiliate: false };
}

// 제휴 링크를 통한 구매임을 사용자에게 고지할지 여부
export function hasAnyAffiliate(): boolean {
  return isCoupangPartnersConfigured();
}
