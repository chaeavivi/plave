import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

// GET /api/items?category=beauty&sort=recent|popular
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "recent";

  const where =
    category && isValidCategory(category) ? { category } : undefined;

  const orderBy =
    sort === "popular"
      ? [{ likes: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const items = await prisma.item.findMany({ where, orderBy });
  return NextResponse.json({ items });
}

// POST /api/items  (추천템 등록)
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const url = String(body.url ?? "").trim();
  const category = String(body.category ?? "").trim();
  const authorName = String(body.authorName ?? "").trim() || "익명";
  const description = body.description
    ? String(body.description).trim().slice(0, 2000)
    : null;
  const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
  const sourceSite = body.sourceSite ? String(body.sourceSite).trim() : null;
  const priceNum = Number(body.price);
  const price =
    Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : null;

  if (!title) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }
  try {
    // 유효한 URL인지 확인
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "올바른 상품 링크를 입력해 주세요." },
      { status: 400 }
    );
  }
  if (!isValidCategory(category)) {
    return NextResponse.json(
      { error: "카테고리를 선택해 주세요." },
      { status: 400 }
    );
  }

  const item = await prisma.item.create({
    data: {
      title: title.slice(0, 200),
      url,
      category,
      authorName: authorName.slice(0, 30),
      description,
      imageUrl,
      sourceSite,
      price,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
