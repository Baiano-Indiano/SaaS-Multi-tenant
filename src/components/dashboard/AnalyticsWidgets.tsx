"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { 
  LayoutGrid, 
  Users, 
  Shield, 
  Activity,
  Database
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalyticsWidgetsProps {
  stats: {
    totalProjects: number;
    totalMembers: number;
    pendingInvites: number;
    totalRoles: number;
    quotas: {
      maxMembers: number;
      maxProjects: number;
    };
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
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-white">{stats.totalProjects}</div>
              <div className="text-xs text-zinc-500 font-medium">/{stats.quotas.maxProjects}</div>
            </div>
            <div className="mt-4 space-y-2">
              <Progress 
                value={(stats.totalProjects / stats.quotas.maxProjects) * 100} 
                className="h-1"
              />
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {Math.round((stats.totalProjects / stats.quotas.maxProjects) * 100)}% Capacity used
              </p>
            </div>
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
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black text-white">{stats.totalMembers}</div>
              <div className="text-xs text-zinc-500 font-medium">/{stats.quotas.maxMembers}</div>
            </div>
            <div className="mt-4 space-y-2">
              <Progress 
                value={(stats.totalMembers / stats.quotas.maxMembers) * 100} 
                className="h-1 bg-zinc-800"
              />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                  {stats.pendingInvites > 0 ? `+${stats.pendingInvites} Pending` : 'Plan limit'}
                </p>
                <p className="text-[10px] text-zinc-400 font-bold">
                  {Math.round((stats.totalMembers / stats.quotas.maxMembers) * 100)}%
                </p>
              </div>
            </div>
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
              Database Instances
            </CardTitle>
            <Database className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">Active</div>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold">STABLE</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
