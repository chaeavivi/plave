import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";

export interface ItemCardData {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  category: string;
  sourceSite: string | null;
  authorName: string;
  likes: number;
  description: string | null;
}

export default function ItemCard({ item }: { item: ItemCardData }) {
  return (
    <Link
      href={`/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {item.imageUrl ? (
          // 외부 이미지 도메인이 다양해 next/image 대신 일반 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">
            🛍️
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
          {categoryLabel(item.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {item.title}
        </h3>
        <p className="text-base font-bold text-brand">
          {formatPrice(item.price, item.currency)}
        </p>
        {item.description && (
          <p className="line-clamp-2 text-xs text-gray-500">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-gray-400">
          <span>by {item.authorName}</span>
          <span>❤️ {item.likes}</span>
        </div>
      </div>
    </Link>
  );
}
