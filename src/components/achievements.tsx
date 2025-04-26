'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
    id: number;
    name: string;
    description: string;
    unlocked: boolean;
    icon: React.ReactNode;
    unlockCondition: (data: UserStats) => boolean;
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
const LOCAL_STORAGE_KEY_XP = 'studyQuestXP'; // Added XP key


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
                 ? <Trophy size={20} className="text-accent stroke-1" /> // Slightly smaller icon
                 : <Lock size={20} className="text-muted-foreground/50 stroke-1" />, // Dimmed lock
         };
     }));
  };


  const fetchAndUpdateStats = () => {
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
        const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
        const storedPomodoro = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO);

        let completedTasks = 0;
        let studyTime = 0;
        if (storedTasks) {
            try {
                const tasks = JSON.parse(storedTasks);
                if (Array.isArray(tasks)) {
                    completedTasks = tasks.filter((task: { completed: boolean }) => task.completed).length;
                    studyTime = tasks.reduce((sum: number, task: { studyTime: number }) => sum + (task.studyTime || 0), 0);
                }
            } catch (e) {
                console.error("Failed to parse tasks from localStorage", e);
            }
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
        updateAchievements(currentStats);
  };

  useEffect(() => {
    fetchAndUpdateStats();

    const handleStorageUpdate = (event: Event) => {
       // Check if the event is relevant (related to our keys)
       if (event instanceof StorageEvent) {
           if ([LOCAL_STORAGE_KEY_TASKS, LOCAL_STORAGE_KEY_LEVEL, LOCAL_STORAGE_KEY_POMODORO, LOCAL_STORAGE_KEY_XP].includes(event.key || '')) {
               fetchAndUpdateStats();
           }
       } else {
          // Handle custom events
           fetchAndUpdateStats();
       }
    };

    window.addEventListener('taskUpdate', handleStorageUpdate);
    window.addEventListener('xpUpdate', handleStorageUpdate);
    window.addEventListener('pomodoroUpdate', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('taskUpdate', handleStorageUpdate);
      window.removeEventListener('xpUpdate', handleStorageUpdate);
      window.removeEventListener('pomodoroUpdate', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <Card className="osrs-box">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-base font-semibold">Achievements Log</CardTitle>
         <CardDescription>
            Track your milestones. ({unlockedCount} / {totalCount} Unlocked)
         </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {achievements.map((ach) => (
            <div key={ach.id} className={cn(
                'p-2 flex items-center gap-2 rounded-sm border transition-colors duration-150 osrs-inner-bevel',
                ach.unlocked
                    ? 'bg-accent/10 border-accent/40 hover:bg-accent/20'
                    : 'bg-black/20 border-muted/40 hover:bg-black/30'
                 )}>
              <div className={cn(
                  'flex-shrink-0 p-1.5 rounded-sm border',
                   ach.unlocked ? 'bg-accent/20 border-accent/50' : 'bg-muted/30 border-muted/50'
                   )}>
                {ach.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={cn(
                    'font-semibold text-sm truncate',
                     ach.unlocked ? 'text-accent' : 'text-foreground/80'
                 )} title={ach.name}>
                    {ach.name}
                 </h3>
                <p className={cn(
                    'text-xs',
                    ach.unlocked ? 'text-accent/80' : 'text-muted-foreground/70'
                 )} title={ach.description}>
                    {ach.description}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
