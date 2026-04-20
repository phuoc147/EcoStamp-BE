import type { NextFunction, Request, Response } from "express";
import { sendError } from "../common/http/response";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 404, "Not Found", "NOT_FOUND");
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof HttpError) {
    sendError(res, err.statusCode, err.message, "HTTP_ERROR");
    return;
  }

  console.error("Unhandled error:", err);
  sendError(res, 500, "Internal Server Error", "INTERNAL_SERVER_ERROR");
};
