import type { NextRequest } from "next/server";

type PoseDebugState = {
  loggedEndpoints: Set<string>;
};

declare global {
  // eslint-disable-next-line no-var
  var __poseDebugState: PoseDebugState | undefined;
}

function getState(): PoseDebugState {
  if (!globalThis.__poseDebugState) {
    globalThis.__poseDebugState = {
      loggedEndpoints: new Set<string>(),
    };
  }
  return globalThis.__poseDebugState;
}

export function logPoseRequestOnce(request: NextRequest, endpoint: string) {
  const state = getState();
  if (state.loggedEndpoints.has(endpoint)) {
    return;
  }

  state.loggedEndpoints.add(endpoint);

  const details = {
    endpoint,
    method: request.method,
    host: request.headers.get("host"),
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    secFetchMode: request.headers.get("sec-fetch-mode"),
    secFetchDest: request.headers.get("sec-fetch-dest"),
    xRequestedWith: request.headers.get("x-requested-with"),
    xForwardedFor: request.headers.get("x-forwarded-for"),
  };

  console.warn("[Pose API Fallback] First request captured:", details);
}

