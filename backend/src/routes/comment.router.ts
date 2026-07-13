import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validate } from "@/middleware/validate";
import { createCommentSchema } from "@/validators/comment.validator";
import * as commentService from "@/services/comment.service";

const router = Router({ mergeParams: true });

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const comments = await commentService.getCommentsByTicket(id);
      res.json({ data: comments, meta: { total: comments.length } });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  validate(createCommentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const comment = await commentService.addComment({
        ticketId: id,
        message: req.body.message,
        createdById: req.body.createdById,
      });
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
