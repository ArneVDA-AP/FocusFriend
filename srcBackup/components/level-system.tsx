'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
// Removed Progress import as the custom OSRS bar is used
import { Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const RANKS = [
    { level: 1, title: "Novice", color: "text-muted-foreground" },
    { level: 5, title: "Apprentice", color: "text-primary/90" },
    { level: 10, title: "Adept", color: "text-primary" },
    { level: 15, title: "Expert", color: "text-accent/90" },
    { level: 20, title: "Master", color: "text-accent" },
    { level: 30, title: "Grandmaster", color: "text-destructive" },
];

const getRank = (level: number): { title: string; color: string } => {
    let currentRank = RANKS[0];
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (level >= RANKS[i].level) {
            currentRank = RANKS[i];
            break;
        }
    }
    return currentRank;
};

interface LevelSystemProps {
  xp: number;
  level: number;
  xpToNextLevel: number;
}

const xpHistory = [
    { description: "Completed a Pomodoro session", xp: 20 },
    { description: "Finished a study session", xp: 50 },
    { description: "Completed a task", xp: 30 },
];

// OSRS Progress Bar Component (moved inline for simplicity, could be separate)
const OsrsProgressBar = ({ value, label }: { value: number; label: string }) => (
    <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden">
        <div
            className="h-full bg-gradient-to-b from-accent via-yellow-500 to-accent transition-all duration-300 ease-out rounded-full border-r border-black/30"
            style={{ width: `${value}%`}}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
        />
    </div>
);

export default function LevelSystem({ xp, level, xpToNextLevel }: LevelSystemProps) {
  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;
  const rank = getRank(level);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6">
         <div>
            <CardTitle className="text-xl font-semibold">Your Rank</CardTitle>
             <CardDescription className={cn("text-sm", rank.color)}>{rank.title}</CardDescription>
         </div>
         <Award className="h-4 w-4 text-accent stroke-1" />
      </CardHeader>
      <CardContent className="space-y-4 p-6">
         <div className="text-center mb-4">
             <span className="text-8xl font-bold text-foreground tracking-tighter">{level}</span>
             <p className="text-sm text-muted-foreground -mt-2">Level</p>
         </div>
         <div className="space-y-1 p-4 rounded-sm">
            <div className="flex justify-between items-center mb-1 px-1">
                <span className="font-medium flex items-center gap-1"><Star size={5} className="text-accent"/> XP</span>
                <span className="text-muted-foreground">{Math.round(xp)} / {xpToNextLevel}</span>
            </div>
             <OsrsProgressBar value={levelProgress} label={`Level progress: ${Math.round(levelProgress)}%`} />
         </div>
            <p className="text-sm text-muted-foreground text-center pt-1">Next level unlocks at {xpToNextLevel} XP</p>
            <div className="space-y-1 p-4 rounded-sm">
                <p className="text-sm font-medium">XP History</p>
                <Separator className="mb-2" />
                {xpHistory.map((event, index) => (
                    <div key={index} className="flex justify-between">
                        <p className="text-xs">{event.description}</p>
                        <p className="text-xs">{event.xp} XP</p>
                    </div>
                ))}
            </div>
      </CardContent>
    </Card>
  );
}
