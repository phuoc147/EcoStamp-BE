import type { Response } from "express";
import type { ApiErrorResponse, ApiSuccessResponse } from "../dto/api-response";

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  data: T,
  message?: string,
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown,
): Response<ApiErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details,
    },
  });
};
