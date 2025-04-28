'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Lock, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Achievement {
    id: number;
    name: string;
    description: string;
    unlocked: boolean;
    icon: React.ReactNode;
    unlockCondition: (data: UserStats) => boolean; // Keep condition for potential future use/display
}

export interface UserStats {
    tasksCompleted: number;
    totalStudyTime: number; // seconds
    level: number;
    pomodoroSessions: number;
    grownCrystals: number;
}

interface AchievementsProps {
    userStats: UserStats; // Passed from parent
    achievements: Achievement[]; // Passed from parent
}

export default function Achievements({ userStats, achievements }: AchievementsProps) {
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
                {ach.icon} {/* Icon is already determined by parent */}
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
