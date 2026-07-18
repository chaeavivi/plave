// 가격을 "12,900원" 형태로 포맷
export function formatPrice(
  price: number | null | undefined,
  currency = "KRW"
): string {
  if (price === null || price === undefined) return "가격 정보 없음";
  if (currency === "KRW") return `${price.toLocaleString("ko-KR")}원`;
  return `${price.toLocaleString()} ${currency}`;
}
