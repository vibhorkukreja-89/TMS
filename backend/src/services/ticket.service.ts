import type { TicketStatus, Priority } from "@/generated/prisma/client";
import { InvalidTransitionError, NotFoundError, ServiceError } from "@/errors";
import * as ticketRepo from "@/repositories/ticket.repository";
import * as userRepo from "@/repositories/user.repository";
import type { TicketWithRelations } from "@/repositories/ticket.repository";

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export interface CreateTicketInput {
  title: string;
  description?: string;
  priority: Priority;
  createdById: string;
  assignedToId?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: Priority;
  assignedToId?: string | null;
}

export async function createTicket(
  input: CreateTicketInput
): Promise<TicketWithRelations> {
  const creator = await userRepo.findUserById(input.createdById);
  if (!creator) {
    throw new NotFoundError("User", input.createdById);
  }

  if (input.assignedToId) {
    const assignee = await userRepo.findUserById(input.assignedToId);
    if (!assignee) {
      throw new ServiceError(
        `Assignee user '${input.assignedToId}' not found`,
        "VALIDATION_ERROR",
        400
      );
    }
  }

  return ticketRepo.createTicket(input);
}

export async function getTickets(
  search?: string,
  status?: TicketStatus
): Promise<TicketWithRelations[]> {
  return ticketRepo.findAllTickets({ search, status });
}

export async function getTicketById(id: string): Promise<TicketWithRelations> {
  const ticket = await ticketRepo.findTicketById(id);
  if (!ticket) throw new NotFoundError("Ticket", id);
  return ticket;
}

export async function updateTicket(
  id: string,
  input: UpdateTicketInput
): Promise<TicketWithRelations> {
  const ticket = await ticketRepo.findTicketById(id);
  if (!ticket) throw new NotFoundError("Ticket", id);

  if (input.assignedToId) {
    const assignee = await userRepo.findUserById(input.assignedToId);
    if (!assignee) {
      throw new ServiceError(
        `Assignee user '${input.assignedToId}' not found`,
        "VALIDATION_ERROR",
        400
      );
    }
  }

  return ticketRepo.updateTicket(id, input);
}

export async function changeStatus(
  id: string,
  newStatus: TicketStatus
): Promise<TicketWithRelations> {
  const ticket = await ticketRepo.findTicketById(id);
  if (!ticket) throw new NotFoundError("Ticket", id);

  const allowed = VALID_TRANSITIONS[ticket.status];
  if (!allowed.includes(newStatus)) {
    throw new InvalidTransitionError(ticket.status, newStatus);
  }

  return ticketRepo.updateTicketStatus(id, newStatus);
}
