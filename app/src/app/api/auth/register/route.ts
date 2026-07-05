export const dynamic = "force-dynamic";

import { apiErrorResponse, apiSuccess } from "@/lib/api/response";
import {
  guardCloudAccountRoute,
  registerAccount,
} from "@/lib/auth/account/account-service";
import { parseRegisterAccountRequest } from "@/lib/auth/account/parse-account-request";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  try {
    guardCloudAccountRoute();
    const body = await request.json();
    const input = parseRegisterAccountRequest(body);
    const result = await registerAccount(input);

    return apiSuccess({
      ok: true as const,
      profile: result.profile,
      session: result.session,
      subscription: result.subscription,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
};
