import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

type Target = "body" | "query" | "params";

/**
 * Express 5 exposes `req.query` / `req.params` as getter-only properties.
 * Replacing them via assignment throws:
 *   TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
 * Redefine the property instead so handlers still read `req.query` / `req.params`.
 */
function assignValidated(
  req: Request,
  target: Target,
  data: unknown
): void {
  if (target === "body") {
    req.body = data;
    return;
  }

  Object.defineProperty(req, target, {
    value: data,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
      });
      return;
    }
    assignValidated(req, target, result.data);
    next();
  };
}
