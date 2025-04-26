'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEY_XP = 'studyQuestXP';
const LOCAL_STORAGE_KEY_LEVEL = 'studyQuestLevel';

const LEVEL_UP_BASE_XP = 100;
const LEVEL_UP_FACTOR = 1.5;

const RANKS = [
    { level: 1, title: "Novice", color: "text-muted-foreground" },
    { level: 5, title: "Apprentice", color: "text-primary/90" }, // Adjusted color slightly
    { level: 10, title: "Adept", color: "text-primary" },
    { level: 15, title: "Expert", color: "text-accent/90" }, // Adjusted color slightly
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


export default function LevelSystem() {
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(LEVEL_UP_BASE_XP);

  const calculateXpToNextLevel = useCallback((currentLevel: number) => {
    return Math.floor(LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, currentLevel - 1));
  }, []);

  const updateStateFromStorage = useCallback(() => {
    const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
    const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);

    const currentLevel = storedLevel ? parseInt(storedLevel, 10) : 1;
    const currentXp = storedXp ? parseFloat(storedXp) : 0;
    const requiredXp = calculateXpToNextLevel(currentLevel);

    setLevel(currentLevel);
    setXp(currentXp);
    setXpToNextLevel(requiredXp);
  }, [calculateXpToNextLevel]);


   useEffect(() => {
    updateStateFromStorage();

    const handleStorageUpdate = () => {
        updateStateFromStorage();
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('xpUpdate', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('xpUpdate', handleStorageUpdate);
    };
  }, [updateStateFromStorage]);


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
            {/* OSRS-style progress bar */}
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                 <div
                    className="h-full bg-gradient-to-b from-accent via-yellow-500 to-accent transition-all duration-300 ease-out rounded-full border-r border-black/30"
                    style={{ width: `${levelProgress}%` }}
                    role="progressbar"
                    aria-valuenow={levelProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Level progress: ${Math.round(levelProgress)}%`}
                  />
             </div>
         </div>
         <p className="text-xs text-muted-foreground text-center pt-1">Next level unlocks at {xpToNextLevel} XP</p>
      </CardContent>
    </Card>
  );
}
