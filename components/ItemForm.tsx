"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";

export default function ItemForm() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [sourceSite, setSourceSite] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");

  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchNote, setFetchNote] = useState<string | null>(null);

  async function handleFetch() {
    setError(null);
    setFetchNote(null);
    if (!url.trim()) {
      setError("먼저 상품 링크를 붙여넣어 주세요.");
      return;
    }
    setFetching(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "정보를 가져오지 못했어요.");
        return;
      }
      if (data.title) setTitle(data.title);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.price) setPrice(String(data.price));
      if (data.sourceSite) setSourceSite(data.sourceSite);

      if (!data.title && !data.imageUrl && !data.price) {
        setFetchNote(
          "자동으로 정보를 가져오지 못했어요. 아래 항목을 직접 입력해 주세요."
        );
      } else {
        setFetchNote("가져왔어요! 내용을 확인하고 필요하면 수정하세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          imageUrl: imageUrl.trim() || null,
          price: price ? Number(price.replace(/[^0-9]/g, "")) : null,
          sourceSite: sourceSite.trim() || null,
          category,
          description: description.trim() || null,
          authorName: authorName.trim() || "익명",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했어요.");
        return;
      }
      router.push(`/item/${data.item.id}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 링크 입력 + 가져오기 */}
      <div>
        <label className="mb-1 block text-sm font-semibold">상품 링크</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="쿠팡·네이버 등 상품 페이지 링크를 붙여넣으세요"
            className={inputCls}
            required
          />
          <button
            type="button"
            onClick={handleFetch}
            disabled={fetching}
            className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            {fetching ? "가져오는 중…" : "가져오기"}
          </button>
        </div>
        {fetchNote && (
          <p className="mt-1 text-xs text-gray-500">{fetchNote}</p>
        )}
      </div>

      {/* 미리보기 이미지 */}
      {imageUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="미리보기"
            className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
          />
          <span className="text-xs text-gray-400">이미지 미리보기</span>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-semibold">제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="상품명"
          className={inputCls}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-semibold">가격(원)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 12900"
            inputMode="numeric"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">이미지 URL</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="자동 또는 직접 입력"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">카테고리</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                category === c.slug
                  ? "border-brand bg-brand text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">
          추천 이유 (선택)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="왜 이 제품을 추천하나요?"
          rows={3}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold">닉네임</label>
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="익명"
          maxLength={30}
          className={inputCls}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {submitting ? "등록 중…" : "추천템 등록하기"}
      </button>
    </form>
  );
}
