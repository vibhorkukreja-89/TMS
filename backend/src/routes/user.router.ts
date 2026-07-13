import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as userRepo from "@/repositories/user.repository";

const router = Router();

router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await userRepo.findAllUsers();
      res.json({ data: users, meta: { total: users.length } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
