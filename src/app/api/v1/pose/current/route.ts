import { NextRequest, NextResponse } from "next/server";
import { logPoseRequestOnce } from "@/lib/pose-request-debug";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  logPoseRequestOnce(request, "/api/v1/pose/current");

  return NextResponse.json(
    {
      available: false,
      source: "saas-multi-tenant",
      message: "Pose service is not enabled in this project.",
      current: null,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
