import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { invitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "@/components/auth/AcceptInviteButton";
import Link from "next/link";
import postgres from "postgres";
import { getTranslations } from "next-intl/server";

const connectionString = process.env.DATABASE_URL!;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { id } = await params;
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  // 1. Fetch Invitation with Context
  const invite = await db.query.invitations.findFirst({
    where: eq(invitations.id, id),
    with: { 
      organization: true,
      inviter: true
    }
  });

  const t = await getTranslations("InviteFlow");

  // Handle Invalid/Expired/Not Found
  if (!invite || invite.status !== "pending") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-100">{t("invalidOrExpiredTitle")}</h1>
          <p className="text-zinc-400">{t("invalidOrExpiredDesc")}</p>
          <Link href="/" className="text-zinc-200 underline text-sm">{t("backToHome")}</Link>
        </div>
      </main>
    );
  }

  // 2. Fetch Human-Readable Role Name from Tenant Schema
  let roleName = "Membro";
  let roleError = false;

  if (invite.roleId && invite.organization.tenantSchemaName) {
    const schema = invite.organization.tenantSchemaName;
    const client = postgres(connectionString, { prepare: false });
    try {
      const rows = await client`
        SELECT name FROM ${client(schema)}.role WHERE id = ${invite.roleId}
      `;
      if (rows.length > 0) {
        roleName = rows[0].name;
      } else {
        roleError = true;
      }
    } catch (e) {
      console.error("Error fetching role info:", e);
      roleError = true;
    } finally {
      await client.end();
    }
  }

  // 3. Security Check: Redirect if not logged in (to force auth first)
  if (!session?.user) {
    const callbackUrl = encodeURIComponent(`/invite/${id}`);
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  const isEmailMismatch = session.user.email !== invite.email;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-950 overflow-hidden font-sans">
      {/* Premium Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none opacity-40 translate-x-20" />
      
      <div className="relative z-10 w-full flex flex-col items-center gap-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <span className="text-zinc-950 font-black text-xl">GA</span>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-zinc-500">{t("brandName")}</p>
        </div>

        {/* Message */}
        {!isEmailMismatch && !roleError && (
          <div className="text-center space-y-2 px-6">
            <p className="text-zinc-400 text-sm">
              <span className="text-zinc-100 font-semibold">{t("invitedTo", { name: invite.inviter.name })}</span>
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {invite.organization.name}
            </h2>
            <div className="inline-flex items-center px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full mt-2">
              <span className="text-xs text-zinc-500 mr-2 uppercase tracking-wider font-bold">{t("roleLabel")}</span>
              <span className="text-xs text-zinc-200 font-semibold">{roleName}</span>
            </div>
          </div>
        )}

        {roleError ? (
          <div className="w-full max-w-md p-8 bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl rounded-2xl text-center space-y-4">
             <h2 className="text-xl font-bold text-red-500">{t("invalidTitle")}</h2>
             <p className="text-zinc-400 text-sm">
                {t("roleErrorDesc")}
             </p>
             <Link href="/" className="inline-block text-zinc-500 hover:text-zinc-400 text-xs underline">{t("backToSite")}</Link>
          </div>
        ) : (
          <AcceptInviteButton 
            invitationId={id}
            isEmailMismatch={isEmailMismatch}
            targetEmail={invite.email}
            currentEmail={session?.user?.email}
          />
        )}

        {/* Footer info */}
        {!isEmailMismatch && !roleError && (
          <p className="text-zinc-600 text-[11px] text-center max-w-[280px]">
            {t("termsNotice")}
          </p>
        )}
      </div>
    </main>
  );
}
