/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 외부 상품 이미지를 어떤 도메인에서든 표시할 수 있게 허용
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
