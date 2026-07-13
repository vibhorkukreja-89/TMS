import { z } from "zod";

export const createCommentSchema = z.object({
  message: z.string().min(1, "Message is required"),
  createdById: z.string().min(1, "createdById is required"),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
