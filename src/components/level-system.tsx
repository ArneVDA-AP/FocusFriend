'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Star } from 'lucide-react';

const LOCAL_STORAGE_KEY_XP = 'studyQuestXP';
const LOCAL_STORAGE_KEY_LEVEL = 'studyQuestLevel';

const LEVEL_UP_BASE_XP = 100;
const LEVEL_UP_FACTOR = 1.5;

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

    // Listen for custom event dispatched by StudyTracker when XP/Level changes
    const handleStorageUpdate = () => {
        console.log("Storage update event received in LevelSystem");
        updateStateFromStorage();
    };

    window.addEventListener('storage', handleStorageUpdate); // Standard storage event
    window.addEventListener('xpUpdate', handleStorageUpdate); // Custom event


    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('xpUpdate', handleStorageUpdate);
    };
  }, [updateStateFromStorage]); // Rerun effect if update function changes (shouldn't happen often)


  const levelProgress = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Your Level</CardTitle>
         <Award className="h-5 w-5 text-accent" />
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="text-4xl font-bold text-center text-primary">{level}</div>
         <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium flex items-center gap-1"><Star size={14} className="text-accent"/> XP</span>
                <span className="text-xs text-muted-foreground">{Math.round(xp)} / {xpToNextLevel} to next level</span>
            </div>
            <Progress value={levelProgress} className="w-full h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" aria-label={`Level progress: ${Math.round(levelProgress)}%`} />
         </div>
         {/* Potentially add rank or title based on level */}
         {/* <p className="text-sm text-muted-foreground text-center">Rank: Novice Scholar</p> */}
      </CardContent>
    </Card>
  );
}
