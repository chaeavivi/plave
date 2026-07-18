import { NextRequest, NextResponse } from "next/server";
import { isNaverConfigured, searchLowestPrice } from "@/lib/naver";

// GET /api/lowest-price?query=상품명
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") ?? "").trim();

  if (!isNaverConfigured()) {
    return NextResponse.json({ enabled: false, items: [] });
  }
  if (!query) {
    return NextResponse.json({ enabled: true, items: [] });
  }

  const items = await searchLowestPrice(query);
  return NextResponse.json({ enabled: true, items });
}
