import { NextRequest, NextResponse } from "next/server";
import { scrapeProduct } from "@/lib/scrape";

export const dynamic = "force-dynamic";

// POST /api/scrape  { url }  ->  { title, imageUrl, price, sourceSite }
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "올바른 링크를 입력해 주세요." },
      { status: 400 }
    );
  }

  const result = await scrapeProduct(url);
  return NextResponse.json(result);
}
