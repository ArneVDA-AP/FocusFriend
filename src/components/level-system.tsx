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

// Example ranks - adjust as needed
const RANKS = [
    { level: 1, title: "Novice", color: "text-muted-foreground" },
    { level: 5, title: "Apprentice", color: "text-primary" },
    { level: 10, title: "Adept", color: "text-primary/90" },
    { level: 15, title: "Expert", color: "text-accent" },
    { level: 20, title: "Master", color: "text-accent/90" },
    { level: 30, title: "Grandmaster", color: "text-destructive" }, // Example higher rank
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

  // Function to update state based on localStorage changes
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


  // Initial load and setup listener for storage changes
   useEffect(() => {
    updateStateFromStorage(); // Initial load

    const handleStorageUpdate = () => {
        // console.log("Storage update event received in LevelSystem"); // Keep for debugging if needed
        updateStateFromStorage();
    };

    window.addEventListener('storage', handleStorageUpdate); // Standard storage event
    window.addEventListener('xpUpdate', handleStorageUpdate); // Custom event for XP changes

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('xpUpdate', handleStorageUpdate);
    };
  }, [updateStateFromStorage]);


  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0; // Cap progress at 100%
  const rank = getRank(level);

  return (
    <Card className="shadow-md border border-border bg-card/80">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
         <div>
            <CardTitle className="text-lg font-medium">Your Rank</CardTitle>
             <CardDescription className={cn("text-xs", rank.color)}>{rank.title}</CardDescription>
         </div>
         <Award className="h-5 w-5 text-accent" />
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
         <div className="text-center">
             <span className="text-5xl font-bold text-foreground tracking-tighter">{level}</span>
             <p className="text-xs text-muted-foreground -mt-1">Level</p>
         </div>
         <div className="space-y-1">
            <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-medium flex items-center gap-1"><Star size={12} className="text-accent"/> XP</span>
                <span className="text-muted-foreground">{Math.round(xp)} / {xpToNextLevel}</span>
            </div>
            {/* Custom styled progress bar */}
             <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                 <div
                    className="h-full bg-gradient-to-r from-accent to-yellow-600 transition-all duration-300 ease-out rounded-full"
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
