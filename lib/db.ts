import { PrismaClient } from "@prisma/client";

// 개발 중 hot-reload 시 PrismaClient 인스턴스가 여러 개 생성되는 것을 방지
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
