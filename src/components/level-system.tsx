'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

// OSRS Progress Bar Component (moved inline for simplicity, could be separate)
const OsrsProgressBar = ({ value, label }: { value: number; label: string }) => (
    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
        <div
            className="h-full bg-gradient-to-b from-accent via-yellow-500 to-accent transition-all duration-300 ease-out rounded-full border-r border-black/30"
            style={{ width: `${value}%` }}
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
    <Card className="osrs-box">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1 pt-3 px-4">
         <div>
            <CardTitle className="text-base font-semibold">Your Rank</CardTitle>
             <CardDescription className={cn("text-xs", rank.color)}>{rank.title}</CardDescription>
         </div>
         <Award className="h-4 w-4 text-accent stroke-1" />
      </CardHeader>
      <CardContent className="space-y-2 p-3">
         <div className="text-center mb-1">
             <span className="text-4xl font-bold text-foreground tracking-tighter">{level}</span>
             <p className="text-xs text-muted-foreground -mt-1">Level</p>
         </div>
         <div className="space-y-1 osrs-inner-bevel p-2 rounded-sm">
            <div className="flex justify-between items-center mb-1 text-xs px-1">
                <span className="font-medium flex items-center gap-1"><Star size={10} strokeWidth={1.5} className="text-accent"/> XP</span>
                <span className="text-muted-foreground">{Math.round(xp)} / {xpToNextLevel}</span>
            </div>
             <OsrsProgressBar value={levelProgress} label={`Level progress: ${Math.round(levelProgress)}%`} />
         </div>
         <p className="text-xs text-muted-foreground text-center pt-1">Next level unlocks at {xpToNextLevel} XP</p>
      </CardContent>
    </Card>
  );
}
