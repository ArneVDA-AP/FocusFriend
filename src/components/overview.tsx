'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ListChecks, Star, Trophy, TrendingUp, BarChartHorizontalBig, Gem } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { cn } from '@/lib/utils';
import type { Task } from './study-tracker'; // Import Task type
import type { UserStats } from './achievements'; // Import UserStats type

interface OverviewProps {
    stats: UserStats;
    xp: number;
    xpToNextLevel: number;
    tasks: Task[]; // Pass full tasks array
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
};

// OSRS Progress Bar Component (Internal or imported)
const OsrsProgressBar = ({ value, label, colorClass = "bg-primary" }: { value: number; label: string; colorClass?: string }) => (
    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
        <div
            className={cn("h-full transition-all duration-300 ease-out rounded-full border-r border-black/30", colorClass)}
            style={{ width: `${value}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
        />
    </div>
);


export default function Overview({ stats, xp, xpToNextLevel, tasks }: OverviewProps) {

  const { tasksCompleted, totalStudyTime, level, pomodoroSessions, grownCrystals } = stats;
  const totalTasks = tasks.length; // Calculate total tasks from the passed array

  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;
  const taskCompletionRate = totalTasks > 0 ? Math.min((tasksCompleted / totalTasks) * 100, 100) : 0;

  // Calculate task time data based on the passed tasks prop
   const taskTimeData = useMemo(() => {
     return tasks
       .filter(task => task.studyTime > 0)
       .map(task => ({
         name: task.text.length > 15 ? task.text.substring(0, 15) + '...' : task.text,
         time: task.studyTime / 60, // Minutes
         fill: 'var(--color-time)' // Ensure chart color mapping works
       }))
       .sort((a, b) => b.time - a.time)
       .slice(0, 5);
   }, [tasks]);


  return (
    <div className="space-y-4">
       <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Total Study Time Card */}
            <Card className="osrs-box">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider">Total Study Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </CardHeader>
                <CardContent className="px-3 pb-2">
                    <div className="text-xl font-bold">{formatTime(totalStudyTime)}</div>
                    <p className="text-xs text-muted-foreground">Across all tasks</p>
                </CardContent>
            </Card>
             {/* Tasks Completed Card */}
             <Card className="osrs-box">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider">Tasks Completed</CardTitle>
                    <ListChecks className="h-4 w-4 text-muted-foreground" strokeWidth={1.5}/>
                </CardHeader>
                <CardContent className="px-3 pb-2 space-y-1">
                    <div className="text-xl font-bold">{tasksCompleted} / {totalTasks}</div>
                     <p className="text-xs text-muted-foreground">
                        Rate: {taskCompletionRate.toFixed(0)}%
                     </p>
                     <OsrsProgressBar value={taskCompletionRate} label={`${taskCompletionRate.toFixed(0)}% tasks completed`} colorClass="bg-gradient-to-b from-primary via-green-600 to-primary" />
                </CardContent>
            </Card>
             {/* Current Level Card */}
             <Card className="osrs-box">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider">Current Level</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" strokeWidth={1.5}/>
                </CardHeader>
                <CardContent className="px-3 pb-2 space-y-1">
                    <div className="text-xl font-bold">{level}</div>
                     <p className="text-xs text-muted-foreground">{Math.round(xp)} / {xpToNextLevel} XP</p>
                     <OsrsProgressBar value={levelProgress} label={`${levelProgress.toFixed(0)}% XP to next level`} colorClass="bg-gradient-to-b from-accent via-yellow-500 to-accent" />
                </CardContent>
            </Card>
             {/* Pomodoro Sessions Card */}
            <Card className="osrs-box">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider">Pomodoro Sessions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.5}/>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                    <div className="text-xl font-bold">{pomodoroSessions}</div>
                    <p className="text-xs text-muted-foreground">Focus intervals</p>
                </CardContent>
            </Card>
             {/* Grown Crystals Card */}
            <Card className="osrs-box">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider">Grown Crystals</CardTitle>
                    <Gem className="h-4 w-4 text-muted-foreground" strokeWidth={1.5}/>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                    <div className="text-xl font-bold">{grownCrystals}</div>
                    <p className="text-xs text-muted-foreground">Focus rewards</p>
                </CardContent>
            </Card>
       </div>

       {/* Task Time Chart Card */}
       <div className="grid gap-4 md:grid-cols-1">
         <Card className="osrs-box">
           <CardHeader className="pb-2 pt-3 px-4">
             <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><BarChartHorizontalBig className="h-4 w-4 text-primary" strokeWidth={1.5}/> Top 5 Tasks by Study Time</CardTitle>
           </CardHeader>
           <CardContent className="pl-2 pr-4 pb-3">
             {taskTimeData.length > 0 ? (
                 <ChartContainer config={{ time: { label: "Time (min)", color: "hsl(var(--accent))" } }} className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={taskTimeData} margin={{ right: 10, left: 10 }}>
                            <CartesianGrid horizontal={false} stroke="hsl(var(--border)/0.4)" strokeDasharray="2 3" />
                            <XAxis type="number" dataKey="time" stroke="hsl(var(--foreground)/0.4)" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                stroke="hsl(var(--foreground)/0.6)"
                                fontSize={9}
                                tick={{ fill: 'hsl(var(--foreground)/0.8)' }}
                                width={70}
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                content={<ChartTooltipContent
                                     hideLabel
                                     className="osrs-box text-xs p-1.5"
                                     />}
                                wrapperStyle={{ outline: 'none', fontSize: '10px' }}
                            />
                            <Bar dataKey="time" layout="vertical" radius={0} fill="var(--color-time)" barSize={10} shape={(props) => {
                                const { x, y, width, height, fill } = props;
                                return (
                                    <g>
                                        <rect x={x} y={y} width={width} height={height} fill={fill} />
                                        <rect x={x} y={y+height-1} width={width} height={1} fill="hsl(var(--accent)/0.6)" />
                                         <rect x={x} y={y} width={1} height={height} fill="hsl(var(--accent)/1.2)" />
                                    </g>
                                );
                            }}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
             ) : (
                <p className="text-muted-foreground text-center py-6 text-sm">No study time recorded yet.</p>
             )}
           </CardContent>
         </Card>
       </div>
    </div>
  );
}
