'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define ranks based on levels
const RANKS = [
    { level: 1, title: "Novice", color: "text-muted-foreground" },
    { level: 5, title: "Apprentice", color: "text-primary/90" },
    { level: 10, title: "Adept", color: "text-primary" },
    { level: 15, title: "Expert", color: "text-accent/90" },
    { level: 20, title: "Master", color: "text-accent" },
    { level: 30, title: "Grandmaster", color: "text-destructive" },
];

// Function to determine the rank based on the current level
const getRank = (level: number): { title: string; color: string } => {
    let currentRank = RANKS[0]; // Default to Novice
    // Iterate backwards to find the highest applicable rank
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

// Custom OSRS-style progress bar component
const OsrsProgressBar = ({ value, label }: { value: number; label: string }) => (
    <div className="w-full h-4 bg-black/40 rounded-sm overflow-hidden border border-black/50 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5)]">
        <div
            className="h-full bg-gradient-to-b from-accent via-yellow-500 to-accent transition-all duration-300 ease-out border-r border-black/30"
            style={{ width: `${Math.min(value, 100)}%`}} // Ensure width doesn't exceed 100%
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
        />
    </div>
);

export default function LevelSystem({ xp, level, xpToNextLevel }: LevelSystemProps) {
  // Calculate the progress towards the next level as a percentage
  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;
  // Get the current rank based on the level
  const rank = getRank(level);

  return (
    // Use the osrs-box style for the main card container
    <Card className="w-full osrs-box">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
         {/* Display the main title and the user's current rank */}
         <div className="flex items-center gap-2">
             <Award className="h-5 w-5 text-accent stroke-1" />
            <CardTitle className="text-lg font-semibold tracking-wide">Your Rank</CardTitle>
         </div>
         <CardDescription className={cn("text-base font-medium", rank.color)}>
            {rank.title}
         </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
         {/* Center the large level display */}
         <div className="text-center my-4">
             <span className="text-8xl font-bold text-foreground tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">{level}</span>
             <p className="text-sm text-muted-foreground -mt-2">Level</p>
         </div>
         {/* Container for the progress bar and XP text */}
         <div className="space-y-1 bg-black/20 p-3 rounded-sm border border-black/50 osrs-inner-bevel">
            <div className="flex justify-between items-center mb-1 px-1">
                {/* Display current XP and XP required for the next level */}
                <span className="font-medium text-sm flex items-center gap-1 text-muted-foreground">
                    <Star size={12} className="text-accent fill-accent/50"/> XP:
                 </span>
                <span className="text-sm text-foreground/90">{Math.round(xp)} / {xpToNextLevel}</span>
            </div>
            {/* Render the OSRS-style progress bar */}
             <OsrsProgressBar value={levelProgress} label={`Level progress: ${Math.round(levelProgress)}%`} />
              <p className="text-xs text-muted-foreground text-center pt-1">
                  Next level unlocks at {xpToNextLevel} XP
              </p>
         </div>

      </CardContent>
    </Card>
  );
}
