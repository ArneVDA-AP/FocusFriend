'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, ListChecks, Star, Trophy, TrendingUp, BarChartHorizontalBig, LineChart } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { cn } from '@/lib/utils'; // Import cn utility

interface Task {
  id: string;
  text: string;
  completed: boolean;
  studyTime: number; // in seconds
  isActive: boolean;
  priority?: 'low' | 'medium' | 'high';
}

const LOCAL_STORAGE_KEY_TASKS = 'studyQuestTasks';
const LOCAL_STORAGE_KEY_XP = 'studyQuestXP';
const LOCAL_STORAGE_KEY_LEVEL = 'studyQuestLevel';
const LOCAL_STORAGE_KEY_POMODORO = 'studyQuestPomodoroSessions';
const LEVEL_UP_BASE_XP = 100;
const LEVEL_UP_FACTOR = 1.5;

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s'; // Ensure '0s' if no parts
};


const calculateXpToNextLevel = (currentLevel: number) => {
    return Math.floor(LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, currentLevel - 1));
};


export default function Overview() {
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentXp, setCurrentXp] = useState(0);
  const [xpToNext, setXpToNext] = useState(LEVEL_UP_BASE_XP);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [taskData, setTaskData] = useState<Task[]>([]);

  useEffect(() => {
    const fetchData = () => {
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
        const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
        const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
        const storedPomodoro = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO);

        let studyTime = 0;
        let completed = 0;
        let tasks: Task[] = [];
        if (storedTasks) {
            try {
                tasks = JSON.parse(storedTasks);
                if (Array.isArray(tasks)) {
                    studyTime = tasks.reduce((sum, task) => sum + (task.studyTime || 0), 0);
                    completed = tasks.filter(task => task.completed).length;
                    setTaskData(tasks);
                } else {
                    setTaskData([]); // Ensure taskData is an array if parsing fails or returns non-array
                }
            } catch (e) {
                console.error("Failed to parse tasks from localStorage", e);
                 setTaskData([]); // Reset on error
            }
        } else {
            setTaskData([]); // Reset if no tasks stored
        }


        const level = storedLevel ? parseInt(storedLevel, 10) : 1;
        const xp = storedXp ? parseFloat(storedXp) : 0;
        const xpNeeded = calculateXpToNextLevel(level);

        setTotalStudyTime(studyTime);
        setTasksCompleted(completed);
        setTotalTasks(tasks.length); // Use parsed tasks length
        setCurrentLevel(level);
        setCurrentXp(xp);
        setXpToNext(xpNeeded);
        setPomodoroSessions(storedPomodoro ? parseInt(storedPomodoro, 10) : 0);
    };

    fetchData(); // Initial fetch

    const handleStorageUpdate = (event: Event) => {
       // More specific check for custom events or broad check for StorageEvent
       if (event instanceof StorageEvent) {
           // Check if the key is relevant
           if ([LOCAL_STORAGE_KEY_TASKS, LOCAL_STORAGE_KEY_LEVEL, LOCAL_STORAGE_KEY_POMODORO, LOCAL_STORAGE_KEY_XP].includes(event.key || '')) {
               fetchData();
           }
       } else {
           // Assume custom events are relevant and refetch
           fetchData();
       }
    };


    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('xpUpdate', handleStorageUpdate);
    window.addEventListener('taskUpdate', handleStorageUpdate);
    window.addEventListener('pomodoroUpdate', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('xpUpdate', handleStorageUpdate);
      window.removeEventListener('taskUpdate', handleStorageUpdate);
      window.removeEventListener('pomodoroUpdate', handleStorageUpdate);
    };
  }, []);

  const levelProgress = xpToNext > 0 ? Math.min((currentXp / xpToNext) * 100, 100) : 0;
  const taskCompletionRate = totalTasks > 0 ? Math.min((tasksCompleted / totalTasks) * 100, 100) : 0;

  const taskTimeData = useMemo(() => {
    return taskData
      .filter(task => task.studyTime > 0)
      .map(task => ({
        name: task.text.length > 15 ? task.text.substring(0, 15) + '...' : task.text,
        time: task.studyTime / 60, // Minutes
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);
  }, [taskData]);

  // OSRS Progress Bar Component
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


  return (
    <div className="space-y-4">
       <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Apply osrs-box to each stat card */}
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
             <Card className="osrs-box">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-2 px-3">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider">Current Level</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" strokeWidth={1.5}/>
                </CardHeader>
                <CardContent className="px-3 pb-2 space-y-1">
                    <div className="text-xl font-bold">{currentLevel}</div>
                     <p className="text-xs text-muted-foreground">{Math.round(currentXp)} / {xpToNext} XP</p>
                     <OsrsProgressBar value={levelProgress} label={`${levelProgress.toFixed(0)}% XP to next level`} colorClass="bg-gradient-to-b from-accent via-yellow-500 to-accent" />
                </CardContent>
            </Card>
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
                            {/* Use darker grid lines */}
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
                                width={70} // Adjust width
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                content={<ChartTooltipContent
                                     hideLabel
                                     className="osrs-box text-xs p-1.5" // Style tooltip like OSRS box
                                     />
                                     }
                                wrapperStyle={{ outline: 'none', fontSize: '10px' }}
                            />
                             {/* OSRS-style bars */}
                            <Bar dataKey="time" layout="vertical" radius={0} fill="var(--color-time)" barSize={10} shape={(props) => {
                                const { x, y, width, height, fill } = props;
                                return (
                                    <g>
                                        {/* Main bar */}
                                        <rect x={x} y={y} width={width} height={height} fill={fill} />
                                        {/* Darker edge */}
                                        <rect x={x} y={y+height-1} width={width} height={1} fill="hsl(var(--accent)/0.6)" />
                                         {/* Lighter edge */}
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
