import { prisma } from "@/db";
import type { Ticket, TicketStatus, Priority } from "@/generated/prisma/client";

export type TicketWithRelations = Ticket & {
  createdBy: { id: string; name: string; email: string };
  assignedTo: { id: string; name: string; email: string } | null;
};

export interface FindAllTicketsOptions {
  search?: string;
  status?: TicketStatus;
}

export interface CreateTicketData {
  title: string;
  description?: string;
  priority: Priority;
  createdById: string;
  assignedToId?: string;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  priority?: Priority;
  assignedToId?: string | null;
}

const userSelect = { id: true, name: true, email: true } as const;

export async function findAllTickets(
  opts: FindAllTicketsOptions = {}
): Promise<TicketWithRelations[]> {
  return prisma.ticket.findMany({
    where: {
      ...(opts.status && { status: opts.status }),
      ...(opts.search && {
        OR: [
          { title: { contains: opts.search, mode: "insensitive" } },
          { description: { contains: opts.search, mode: "insensitive" } },
        ],
      }),
    },
    include: { createdBy: { select: userSelect }, assignedTo: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });
}

export async function findTicketById(
  id: string
): Promise<TicketWithRelations | null> {
  return prisma.ticket.findUnique({
    where: { id },
    include: { createdBy: { select: userSelect }, assignedTo: { select: userSelect } },
  });
}

export async function createTicket(
  data: CreateTicketData
): Promise<TicketWithRelations> {
  return prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      createdById: data.createdById,
      assignedToId: data.assignedToId,
    },
    include: { createdBy: { select: userSelect }, assignedTo: { select: userSelect } },
  });
}

export async function updateTicket(
  id: string,
  data: UpdateTicketData
): Promise<TicketWithRelations> {
  return prisma.ticket.update({
    where: { id },
    data,
    include: { createdBy: { select: userSelect }, assignedTo: { select: userSelect } },
  });
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus
): Promise<TicketWithRelations> {
  return prisma.ticket.update({
    where: { id },
    data: { status },
    include: { createdBy: { select: userSelect }, assignedTo: { select: userSelect } },
  });
}
