import { z } from "zod";

const Priority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const TicketStatus = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: Priority,
  createdById: z.string().min(1, "createdById is required"),
  assignedToId: z.string().optional(),
});

export const updateTicketSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().nullable().optional(),
    priority: Priority.optional(),
    assignedToId: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const changeStatusSchema = z.object({
  status: TicketStatus,
});

export const ticketQuerySchema = z.object({
  search: z.string().optional(),
  status: TicketStatus.optional(),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
export type UpdateTicketDto = z.infer<typeof updateTicketSchema>;
export type ChangeStatusDto = z.infer<typeof changeStatusSchema>;
export type TicketQueryDto = z.infer<typeof ticketQuerySchema>;
