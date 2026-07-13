import { NotFoundError } from "@/errors";
import * as commentRepo from "@/repositories/comment.repository";
import * as ticketRepo from "@/repositories/ticket.repository";
import * as userRepo from "@/repositories/user.repository";
import type { CommentWithAuthor } from "@/repositories/comment.repository";

export interface AddCommentInput {
  ticketId: string;
  message: string;
  createdById: string;
}

export async function addComment(
  input: AddCommentInput
): Promise<CommentWithAuthor> {
  const ticket = await ticketRepo.findTicketById(input.ticketId);
  if (!ticket) throw new NotFoundError("Ticket", input.ticketId);

  const author = await userRepo.findUserById(input.createdById);
  if (!author) throw new NotFoundError("User", input.createdById);

  return commentRepo.createComment(input);
}

export async function getCommentsByTicket(
  ticketId: string
): Promise<CommentWithAuthor[]> {
  const ticket = await ticketRepo.findTicketById(ticketId);
  if (!ticket) throw new NotFoundError("Ticket", ticketId);

  return commentRepo.findCommentsByTicketId(ticketId);
}
