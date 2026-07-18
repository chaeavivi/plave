import Link from "next/link";
import ItemForm from "@/components/ItemForm";

export const metadata = {
  title: "추천템 등록 — 추천템",
};

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
          ← 목록으로
        </Link>
        <h1 className="mt-1 text-2xl font-bold">추천템 등록</h1>
        <p className="text-sm text-gray-500">
          상품 링크를 붙여넣고 <b>가져오기</b>를 누르면 정보가 자동으로 채워져요.
        </p>
      </div>
      <ItemForm />
    </div>
  );
}
