import { prisma } from "@/db";
import type { Comment } from "@/generated/prisma/client";

export type CommentWithAuthor = Comment & {
  createdBy: { id: string; name: string; email: string };
};

export interface CreateCommentData {
  ticketId: string;
  message: string;
  createdById: string;
}

const userSelect = { id: true, name: true, email: true } as const;

export async function findCommentsByTicketId(
  ticketId: string
): Promise<CommentWithAuthor[]> {
  return prisma.comment.findMany({
    where: { ticketId },
    include: { createdBy: { select: userSelect } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(
  data: CreateCommentData
): Promise<CommentWithAuthor> {
  return prisma.comment.create({
    data,
    include: { createdBy: { select: userSelect } },
  });
}
