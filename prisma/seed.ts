import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 첫 화면이 비어 보이지 않도록 예시 추천템 몇 개 삽입
const samples = [
  {
    title: "스탠리 퀜처 텀블러 1.18L",
    description: "하루 물 2L 챌린지 성공하게 해준 텀블러. 보냉 최고예요.",
    url: "https://www.coupang.com/",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600",
    price: 55000,
    category: "living",
    sourceSite: "쿠팡",
    authorName: "물마시는곰",
    likes: 12,
  },
  {
    title: "무선 기계식 키보드 (적축)",
    description: "타건감 좋고 배터리 오래가요. 재택근무 필수템.",
    url: "https://shopping.naver.com/",
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
    price: 89000,
    category: "electronics",
    sourceSite: "네이버 쇼핑",
    authorName: "키보드러버",
    likes: 8,
  },
  {
    title: "수분 진정 토너패드 70매",
    description: "환절기 피부 뒤집어질 때 이거 쓰면 진정돼요.",
    url: "https://www.oliveyoung.co.kr/",
    imageUrl:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600",
    price: 19900,
    category: "beauty",
    sourceSite: "올리브영",
    authorName: "피부고민",
    likes: 20,
  },
];

async function main() {
  const count = await prisma.item.count();
  if (count > 0) {
    console.log(`이미 ${count}개 항목이 있어 시드를 건너뜁니다.`);
    return;
  }
  await prisma.item.createMany({ data: samples });
  console.log(`${samples.length}개 예시 추천템을 추가했습니다.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
