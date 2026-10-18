// Singleton Prisma client to avoid creating too many connections in dev mode.
// In production, a single instance is reused. In development, HMR would
// create a new PrismaClient on every reload, so we cache it on globalThis.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
