import { NextRequest, NextResponse } from "next/server";
import { logPoseRequestOnce } from "@/lib/pose-request-debug";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  logPoseRequestOnce(request, "/api/v1/pose/stats");

  const hoursParam = request.nextUrl.searchParams.get("hours");
  const hours = Number(hoursParam);

  return NextResponse.json(
    {
      available: false,
      source: "saas-multi-tenant",
      message: "Pose service is not enabled in this project.",
      hours: Number.isFinite(hours) ? hours : 1,
      stats: {
        samples: 0,
        lastUpdatedAt: null,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
