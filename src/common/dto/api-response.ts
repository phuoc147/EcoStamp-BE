import { z } from "zod";

export const apiError = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z
    .object({
      code: z.string().optional(),
      details: z.unknown().optional(),
    })
    .optional(),
});

export const apiSuccess = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    message: z.string().optional(),
    data: data,
    meta: z.record(z.string(), z.unknown()).optional(),
  });

export const apiResponse = <T extends z.ZodTypeAny>(data: T) =>
  z.union([apiSuccess(data), apiError]);

export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = z.infer<typeof apiError>;
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
