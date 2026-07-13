import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validate } from "@/middleware/validate";
import {
  createTicketSchema,
  updateTicketSchema,
  changeStatusSchema,
  ticketQuerySchema,
} from "@/validators/ticket.validator";
import * as ticketService from "@/services/ticket.service";
import type { TicketStatus } from "@/generated/prisma/client";

const router = Router();

router.get(
  "/",
  validate(ticketQuerySchema, "query"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status } = req.query as {
        search?: string;
        status?: TicketStatus;
      };
      const tickets = await ticketService.getTickets(search, status);
      res.json({ data: tickets, meta: { total: tickets.length } });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  validate(createTicketSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ticket = await ticketService.createTicket(req.body);
      res.status(201).json({ data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const ticket = await ticketService.getTicketById(id);
      res.json({ data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  validate(updateTicketSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const ticket = await ticketService.updateTicket(id, req.body);
      res.json({ data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id/status",
  validate(changeStatusSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const ticket = await ticketService.changeStatus(id, req.body.status);
      res.json({ data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
