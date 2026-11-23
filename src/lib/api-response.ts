import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { stringifySupabaseError, formatRouteError } from "@/lib/api-errors";

export interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
  meta?: Record<string, unknown>;
}

/** Standard successful JSON response */
export function apiSuccess<T>(data: T, options?: ApiResponseOptions): NextResponse {
  const status = options?.status ?? 200;
  const payload: Record<string, unknown> = {
    success: true,
    data,
  };
  if (options?.meta) {
    payload.meta = options.meta;
  }
  return NextResponse.json(payload, {
    status,
    headers: options?.headers,
  });
}

/** Standard error JSON response */
export function apiError(
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: unknown;
    hint?: string;
  },
): NextResponse {
  const status = options?.status ?? 400;
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: options?.code,
      details: options?.details,
      hint: options?.hint,
    },
    { status },
  );
}

/** Format Zod validation errors into a clean, field-keyed map and error message */
export function handleValidationError(err: ZodError): NextResponse {
  const issues = err.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
  const fieldSummary = issues.map((i) => `${i.field}: ${i.message}`).join("; ");
  return apiError(`Validation failed: ${fieldSummary}`, {
    status: 400,
    code: "VALIDATION_ERROR",
    details: issues,
  });
}

/** Format unexpected catch block errors */
export function handleCatchError(e: unknown, contextName: string): NextResponse {
  console.error(`[${contextName}]`, e);
  const formatted = formatRouteError(e);
  return apiError(formatted.error, {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    details: formatted,
  });
}
