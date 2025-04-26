// src/components/overview.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, ListChecks, Star, Trophy, TrendingUp, BarChartHorizontalBig, LineChart } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts"

interface Task {
  id: string;
  text: string;
  completed: boolean;
  studyTime: number; // in seconds
  isActive: boolean;
  priority?: 'low' | 'medium' | 'high'; // Added priority
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
    return parts.join(' ');
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
    // Fetch data from localStorage
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
    const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
    const storedPomodoro = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO);

    let studyTime = 0;
    let completed = 0;
    let tasks: Task[] = [];
    if (storedTasks) {
      tasks = JSON.parse(storedTasks);
      studyTime = tasks.reduce((sum, task) => sum + task.studyTime, 0);
      completed = tasks.filter(task => task.completed).length;
      setTaskData(tasks); // Store raw task data
    }

    const level = storedLevel ? parseInt(storedLevel, 10) : 1;
    const xp = storedXp ? parseFloat(storedXp) : 0;
    const xpNeeded = calculateXpToNextLevel(level);

    setTotalStudyTime(studyTime);
    setTasksCompleted(completed);
    setTotalTasks(tasks.length);
    setCurrentLevel(level);
    setCurrentXp(xp);
    setXpToNext(xpNeeded);
    setPomodoroSessions(storedPomodoro ? parseInt(storedPomodoro, 10) : 0);

    // Add listener for storage changes to update overview
    const handleStorageUpdate = () => {
        // Re-fetch all data on any storage change
        const updatedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
        const updatedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
        const updatedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
        const updatedPomodoro = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO);

        let newStudyTime = 0;
        let newCompleted = 0;
        let newTasks: Task[] = [];
        if (updatedTasks) {
            newTasks = JSON.parse(updatedTasks);
            newStudyTime = newTasks.reduce((sum, task) => sum + task.studyTime, 0);
            newCompleted = newTasks.filter(task => task.completed).length;
            setTaskData(newTasks);
        }

        const newLevel = updatedLevel ? parseInt(updatedLevel, 10) : 1;
        const newXp = updatedXp ? parseFloat(updatedXp) : 0;
        const newXpNeeded = calculateXpToNextLevel(newLevel);

        setTotalStudyTime(newStudyTime);
        setTasksCompleted(newCompleted);
        setTotalTasks(newTasks.length);
        setCurrentLevel(newLevel);
        setCurrentXp(newXp);
        setXpToNext(newXpNeeded);
        setPomodoroSessions(updatedPomodoro ? parseInt(updatedPomodoro, 10) : 0);
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('xpUpdate', handleStorageUpdate); // Listen for custom XP update
    window.addEventListener('taskUpdate', handleStorageUpdate); // Listen for custom task update
    window.addEventListener('pomodoroUpdate', handleStorageUpdate); // Listen for custom pomodoro update

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('xpUpdate', handleStorageUpdate);
      window.removeEventListener('taskUpdate', handleStorageUpdate);
      window.removeEventListener('pomodoroUpdate', handleStorageUpdate);
    };
  }, []);

  const levelProgress = xpToNext > 0 ? (currentXp / xpToNext) * 100 : 0;
  const taskCompletionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

  // Prepare data for charts
  const taskTimeData = useMemo(() => {
    return taskData
      .filter(task => task.studyTime > 0)
      .map(task => ({
        name: task.text.length > 15 ? task.text.substring(0, 15) + '...' : task.text, // Truncate long names
        time: task.studyTime / 60, // Convert to minutes
      }))
      .sort((a, b) => b.time - a.time) // Sort by time descending
      .slice(0, 5); // Show top 5 tasks
  }, [taskData]);

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border border-border bg-card/80 hover:bg-card/90 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatTime(totalStudyTime)}</div>
                    <p className="text-xs text-muted-foreground">Across all tasks</p>
                </CardContent>
            </Card>
             <Card className="shadow-sm border border-border bg-card/80 hover:bg-card/90 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tasksCompleted} / {totalTasks}</div>
                    <p className="text-xs text-muted-foreground">Completion Rate: {taskCompletionRate.toFixed(1)}%</p>
                    <Progress value={taskCompletionRate} aria-label={`${taskCompletionRate.toFixed(1)}% tasks completed`} className="h-1 mt-1 [&>div]:bg-primary" />
                </CardContent>
            </Card>
             <Card className="shadow-sm border border-border bg-card/80 hover:bg-card/90 transition-colors">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currentLevel}</div>
                     <p className="text-xs text-muted-foreground">{Math.round(currentXp)} / {xpToNext} XP to next</p>
                     <Progress value={levelProgress} aria-label={`${levelProgress.toFixed(1)}% XP to next level`} className="h-1 mt-1 [&>div]:bg-accent"/>
                </CardContent>
            </Card>
            <Card className="shadow-sm border border-border bg-card/80 hover:bg-card/90 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pomodoro Sessions</CardTitle>
                     {/* Replace with a suitable OSRS-like icon if possible */}
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pomodoroSessions}</div>
                    <p className="text-xs text-muted-foreground">Completed focus intervals</p>
                </CardContent>
            </Card>
       </div>

       <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
         <Card className="shadow-sm border border-border bg-card/80">
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><BarChartHorizontalBig className="h-5 w-5 text-primary"/> Top 5 Tasks by Study Time</CardTitle>
           </CardHeader>
           <CardContent className="pl-2 pr-6 pb-4">
             {taskTimeData.length > 0 ? (
                <ChartContainer config={{ time: { label: "Time (minutes)", color: "hsl(var(--accent))" } }} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={taskTimeData} margin={{ right: 20 }}>
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                            <XAxis type="number" dataKey="time" stroke="hsl(var(--foreground)/0.5)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                stroke="hsl(var(--foreground)/0.7)"
                                fontSize={10}
                                tick={{ fill: 'hsl(var(--foreground)/0.9)' }}
                                width={80} // Adjust width to prevent label overlap
                            />
                            <RechartsTooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                content={<ChartTooltipContent hideLabel />}
                                wrapperStyle={{ outline: 'none', fontSize: '10px' }}
                            />
                            <Bar dataKey="time" layout="vertical" radius={2} fill="var(--color-time)" barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
             ) : (
                <p className="text-muted-foreground text-center py-8">No study time recorded yet.</p>
             )}
           </CardContent>
         </Card>

         {/* Placeholder for future charts like study time trend */}
         {/*
         <Card className="shadow-sm border border-border bg-card/80">
           <CardHeader>
             <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5 text-primary"/> Study Time Trend (Placeholder)</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground text-center py-8">Study trend chart coming soon!</p>
              // <ChartContainer config={chartConfig} className="h-[200px] w-full">
              //   <LineChart data={sampleTrendData}>
              //     <CartesianGrid vertical={false} />
              //     <XAxis dataKey="date" />
              //     <YAxis />
              //     <ChartTooltip content={<ChartTooltipContent />} />
              //     <Line type="monotone" dataKey="studyTime" stroke="var(--color-studyTime)" />
              //   </LineChart>
              // </ChartContainer>
           </CardContent>
         </Card>
         */}
       </div>
    </div>
  );
}
