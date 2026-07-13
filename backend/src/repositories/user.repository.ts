import { prisma } from "@/db";
import type { User } from "@/generated/prisma/client";

export async function findAllUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}
