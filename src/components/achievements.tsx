'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Lock } from 'lucide-react'; // Changed ShieldQuestion to Trophy, added Lock
import { cn } from '@/lib/utils';

interface Achievement {
    id: number;
    name: string;
    description: string;
    unlocked: boolean;
    icon: React.ReactNode;
    unlockCondition: (data: UserStats) => boolean; // Function to check unlock status
}

interface UserStats {
    tasksCompleted: number;
    totalStudyTime: number; // seconds
    level: number;
    pomodoroSessions: number;
}

const LOCAL_STORAGE_KEY_TASKS = 'studyQuestTasks';
const LOCAL_STORAGE_KEY_LEVEL = 'studyQuestLevel';
const LOCAL_STORAGE_KEY_POMODORO = 'studyQuestPomodoroSessions';


const initialAchievements: Omit<Achievement, 'unlocked' | 'icon'>[] = [
  { id: 1, name: "First Task", description: "Complete your first study task.", unlockCondition: (stats) => stats.tasksCompleted >= 1 },
  { id: 2, name: "Focused Mind", description: "Complete a Pomodoro session.", unlockCondition: (stats) => stats.pomodoroSessions >= 1 },
  { id: 3, name: "Hour Hero", description: "Log 1 hour of study time.", unlockCondition: (stats) => stats.totalStudyTime >= 3600 },
  { id: 4, name: "Task Master", description: "Complete 10 study tasks.", unlockCondition: (stats) => stats.tasksCompleted >= 10 },
  { id: 5, name: "Level 5", description: "Reach level 5.", unlockCondition: (stats) => stats.level >= 5 },
  { id: 6, name: "Study Streak", description: "Log 5 hours of study time.", unlockCondition: (stats) => stats.totalStudyTime >= 18000 },
  { id: 7, name: "Pomodoro Pro", description: "Complete 10 Pomodoro sessions.", unlockCondition: (stats) => stats.pomodoroSessions >= 10 },
  { id: 8, name: "Level 10", description: "Reach level 10.", unlockCondition: (stats) => stats.level >= 10 },
];

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ tasksCompleted: 0, totalStudyTime: 0, level: 1, pomodoroSessions: 0 });

  const updateAchievements = (stats: UserStats) => {
     setAchievements(initialAchievements.map(ach => {
         const isUnlocked = ach.unlockCondition(stats);
         return {
             ...ach,
             unlocked: isUnlocked,
             icon: isUnlocked
                 ? <Trophy size={24} className="text-accent stroke-1" /> // Gold trophy for unlocked
                 : <Lock size={24} className="text-muted-foreground/60 stroke-1" />, // Lock icon for locked
         };
     }));
  };


  // Function to fetch and update stats
  const fetchAndUpdateStats = () => {
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
        const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
        const storedPomodoro = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO);

        let completedTasks = 0;
        let studyTime = 0;
        if (storedTasks) {
            const tasks = JSON.parse(storedTasks);
            completedTasks = tasks.filter((task: { completed: boolean }) => task.completed).length;
            studyTime = tasks.reduce((sum: number, task: { studyTime: number }) => sum + task.studyTime, 0);
        }

        const level = storedLevel ? parseInt(storedLevel, 10) : 1;
        const pomodoroSessions = storedPomodoro ? parseInt(storedPomodoro, 10) : 0;

        const currentStats: UserStats = {
            tasksCompleted: completedTasks,
            totalStudyTime: studyTime,
            level: level,
            pomodoroSessions: pomodoroSessions,
        };
        setUserStats(currentStats);
        updateAchievements(currentStats); // Update achievements based on new stats
  };

  // Initial load and listener setup
  useEffect(() => {
    fetchAndUpdateStats(); // Initial fetch

    const handleStorageUpdate = () => {
      fetchAndUpdateStats(); // Re-fetch stats on any relevant update
    };

    // Listen to specific update events for efficiency
    window.addEventListener('taskUpdate', handleStorageUpdate);
    window.addEventListener('xpUpdate', handleStorageUpdate); // Level depends on XP
    window.addEventListener('pomodoroUpdate', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate); // Fallback for direct storage edits

    return () => {
      window.removeEventListener('taskUpdate', handleStorageUpdate);
      window.removeEventListener('xpUpdate', handleStorageUpdate);
      window.removeEventListener('pomodoroUpdate', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Card className="shadow-md border border-border bg-card/80">
      <CardHeader>
        <CardTitle>Achievements Log</CardTitle>
         <CardDescription>
            Track your milestones. ({unlockedCount} / {totalCount} Unlocked)
         </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <Card key={ach.id} className={cn(
                'p-3 flex items-center gap-3 transition-colors duration-200 border',
                ach.unlocked
                    ? 'bg-accent/10 border-accent/30 hover:bg-accent/20' // Unlocked style
                    : 'bg-muted/30 border-muted/50 hover:bg-muted/40' // Locked style
                 )}>
              <div className={`flex-shrink-0 p-2 rounded ${ach.unlocked ? 'bg-accent/20' : 'bg-muted/50'}`}>
                {ach.icon}
              </div>
              <div className="min-w-0">
                <h3 className={cn(
                    'font-semibold text-sm truncate',
                     ach.unlocked ? 'text-accent' : 'text-foreground/80' // Title color
                 )} title={ach.name}>
                    {ach.name}
                 </h3>
                <p className={cn(
                    'text-xs',
                    ach.unlocked ? 'text-accent/80' : 'text-muted-foreground' // Description color
                 )} title={ach.description}>
                    {ach.description}
                 </p>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
