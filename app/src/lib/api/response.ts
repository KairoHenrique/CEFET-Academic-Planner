import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { logSafeError } from "@/lib/security/safe-log";
import crypto from "node:crypto";

export function apiSuccess<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    const exposeDetails = process.env.NODE_ENV !== "production";

    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        message: error.message,
        details: exposeDetails ? error.details : undefined,
      },
      { status: error.status }
    );
  }

  const traceId = crypto.randomUUID();
  logSafeError(`[api] unexpected error (Trace: ${traceId})`, error);
  return NextResponse.json(
    {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor.",
      traceId,
    },
    { status: 500 }
  );
}
