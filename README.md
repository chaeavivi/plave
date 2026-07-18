# 추천템 🛍️

사용자들이 서로 **추천 제품(추천템)**을 링크로 등록하고 카테고리별로 공유하는 웹앱입니다.
상품 링크만 붙여넣으면 **이미지·제목·가격이 자동으로** 채워지고, 상세 페이지에서는
(설정 시) 네이버 쇼핑 **최저가 비교**와 쿠팡 **제휴 링크**까지 보여줍니다.

## 주요 기능
- 링크 붙여넣기 → OG 태그/JSON-LD 기반 이미지·제목·가격 **자동 추출** (`lib/scrape.ts`)
- **카테고리**별 필터 + 최신순/추천순 정렬
- 로그인 없이 **닉네임**으로 등록, 좋아요(추천) 기능
- (선택) 네이버 쇼핑 API로 **최저가 비교** (`lib/naver.ts`)
- (선택) 쿠팡 파트너스 **제휴 링크** 자동 전환 (`lib/affiliate.ts`)

## 기술 스택
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite

## 시작하기

```bash
npm install
cp .env.example .env
npx prisma db push        # DB 스키마 생성
npm run db:seed           # (선택) 예시 데이터 추가
npm run dev               # http://localhost:3000
```

## 선택 연동
- **최저가**: [네이버 개발자센터](https://developers.naver.com)에서 앱 등록 후
  `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`를 `.env`에 넣으면 상세 페이지에
  "다른 곳 최저가" 섹션이 자동으로 켜집니다.
- **제휴(수익) 링크**: 쿠팡 파트너스 승인 후 `COUPANG_ACCESS_KEY` /
  `COUPANG_SECRET_KEY`를 넣으면 쿠팡 구매 링크가 제휴 딥링크로 전환되도록
  `lib/affiliate.ts`를 확장할 수 있습니다.

## 배포
Vercel 권장. 배포 시 SQLite 대신 Postgres 등 관리형 DB로 교체하고
`prisma/schema.prisma`의 `provider`와 `DATABASE_URL`을 함께 변경하세요.
