"use client";

import { useState } from "react";

export default function LikeButton({
  itemId,
  initialLikes,
}: {
  itemId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleLike() {
    if (pending) return;
    setPending(true);
    // 낙관적 업데이트
    setLikes((n) => n + 1);
    setLiked(true);
    try {
      const res = await fetch(`/api/items/${itemId}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok && typeof data.likes === "number") {
        setLikes(data.likes);
      }
    } catch {
      // 실패 시 롤백
      setLikes((n) => n - 1);
      setLiked(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={pending}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        liked
          ? "border-brand bg-brand/10 text-brand"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
      }`}
    >
      ❤️ 추천 {likes}
    </button>
  );
}
