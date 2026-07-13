import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as userService from "@/services/user.service";

const router = Router();

router.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await userService.getUsers();
      res.json({ data: users, meta: { total: users.length } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
