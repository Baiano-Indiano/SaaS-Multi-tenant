import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { trackMfaFailure } from "@/lib/security/mfa-tracker";

export const dynamic = "force-dynamic";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const isVerifyTotp = url.pathname.includes("/two-factor/verify-totp");
  const isVerifyBackup = url.pathname.includes("/two-factor/verify-backup-code");

  const response = await handler.POST(request);

  if ((isVerifyTotp || isVerifyBackup) && response.status >= 400) {
    // Run tracking asynchronously (non-blocking)
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      if (session?.user?.id) {
        trackMfaFailure(session.user.id).catch((err) =>
          console.error("[MFA Interceptor] Failed to track MFA error:", err)
        );
      }
    } catch (e) {
      console.error("[MFA Interceptor] Session retrieval failed:", e);
    }
  }

  return response;
}