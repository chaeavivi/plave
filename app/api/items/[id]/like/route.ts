import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/items/[id]/like  (좋아요 +1)
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.update({
      where: { id: params.id },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });
    return NextResponse.json({ likes: item.likes });
  } catch {
    return NextResponse.json(
      { error: "존재하지 않는 항목입니다." },
      { status: 404 }
    );
  }
}
