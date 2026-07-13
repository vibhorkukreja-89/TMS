import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { config } from "@/config";

function createPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (config.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
