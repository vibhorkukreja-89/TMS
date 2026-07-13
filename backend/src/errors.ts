export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 422,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ServiceError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class InvalidTransitionError extends ServiceError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition from ${from} to ${to}`,
      "INVALID_TRANSITION",
      422
    );
    this.name = "InvalidTransitionError";
  }
}
