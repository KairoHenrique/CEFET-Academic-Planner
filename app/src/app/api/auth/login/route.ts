export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  guardCloudAccountRoute,
  loginAccount,
} from "@/lib/auth/account/account-service";
import { parseLoginAccountRequest } from "@/lib/auth/account/parse-account-request";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    guardCloudAccountRoute();
    const body = await request.json();
    const input = parseLoginAccountRequest(body);
    const result = await loginAccount(input);

    return apiSuccess({
      ok: true as const,
      profile: result.profile,
      session: result.session,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
};
