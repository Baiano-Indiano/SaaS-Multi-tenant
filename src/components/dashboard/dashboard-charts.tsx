"use client";

import dynamic from "next/dynamic";

export const OverviewChart = dynamic(() => import("./overview-chart").then(mod => mod.OverviewChart), { ssr: false });
export const AreaChart = dynamic(() => import("./area-chart").then(mod => mod.AreaChart), { ssr: false });
