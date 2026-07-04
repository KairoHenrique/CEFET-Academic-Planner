export const dynamic = "force-dynamic";

import { apiErrorResponse } from "@/lib/api/response";
import {
  runHealthCheck,
  verifyCronSecret,
} from "@/lib/health/check-health";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const deep = url.searchParams.get("deep") === "1";

    if (deep && !verifyCronSecret(request)) {
      return NextResponse.json(
        {
          ok: false,
          code: "UNAUTHORIZED",
          message: "Cron secret inválido ou ausente.",
        },
        { status: 401 }
      );
    }

    const result = await runHealthCheck(deep);
    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
