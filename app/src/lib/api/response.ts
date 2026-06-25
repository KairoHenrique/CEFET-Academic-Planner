import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export function apiSuccess<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        message: error.message,
        details: error.details,
      },
      { status: error.status }
    );
  }

  console.error("[api] unexpected error", error);
  return NextResponse.json(
    {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor.",
    },
    { status: 500 }
  );
}
