"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  LayoutGrid, 
  Users, 
  Shield, 
  Mail, 
  TrendingUp,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsWidgetsProps {
  stats: {
    totalMembers: number;
    pendingInvites: number;
    totalProjects: number;
    projectBreakdown: { val: number; status: string }[];
    totalRoles: number;
  };
}

export function AnalyticsWidgets({ stats }: AnalyticsWidgetsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {/* Projects Widget */}
      <motion.div variants={item}>
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <LayoutGrid className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Active Projects
            </CardTitle>
            <LayoutGrid className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{stats.totalProjects}</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 flex items-center font-bold">
                <ArrowUpRight className="h-3 w-3" />
                Live
              </span>
              Isolated tenant instances
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Widget */}
      <motion.div variants={item}>
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{stats.totalMembers}</div>
            <p className="text-xs text-zinc-500 mt-1">
              {stats.pendingInvites > 0 ? (
                <span className="text-blue-400 font-medium">+{stats.pendingInvites} pending invites</span>
              ) : (
                "Verified team members"
              )}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Roles Widget */}
      <motion.div variants={item}>
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              RBAC Roles
            </CardTitle>
            <Shield className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{stats.totalRoles}</div>
            <p className="text-xs text-zinc-500 mt-1">
              Custom profiles defined
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Widget (Placeholder for complexity) */}
      <motion.div variants={item}>
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="h-24 w-24 -mr-8 -mt-8" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">
              System Health
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">99.9%</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "99.9%" }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="h-full bg-emerald-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
