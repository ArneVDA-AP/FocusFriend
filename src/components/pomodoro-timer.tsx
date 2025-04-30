
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw, Coffee, BookOpen, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PomodoroSettings } from '@/components/settings'; // Import only the type
import FocusCrystal from '@/components/focus-crystal';
// Removed unused useXP import

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroTimerProps {
  settings: PomodoroSettings;
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  sessionsCompleted: number;
  grownCrystalsCount: number;
  initialDuration: number; // Needed for progress calculation
  switchMode: (mode: TimerMode) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
}

export default function PomodoroTimer({
  settings, // Receive settings as prop
  mode,
  timeLeft,
  isActive,
  sessionsCompleted,
  grownCrystalsCount,
  initialDuration, // Receive initialDuration for progress
  switchMode,
  toggleTimer,
  resetTimer,
}: PomodoroTimerProps) {

  // Removed useXP hook call

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const durationForMode = initialDuration; // Use passed initialDuration
  const progress = durationForMode > 0 ? ((durationForMode - timeLeft) / durationForMode) * 100 : 0;
  const modeLabel = mode === 'work' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
  const isCrystalGrowing = mode === 'work' && isActive;
   // Determine if the crystal is withered (paused/stopped mid-work session, not yet completed)
   const crystalDies = mode === 'work' && !isActive && timeLeft < durationForMode && timeLeft > 0;


  const calculateCrystalStage = (currentProgress: number): number => {
     // Crystal only grows during active work sessions
    if (mode !== 'work' || !isActive) {
        // If completed, show max stage. If paused/withered, show stage 0
        return (progress === 100 && !isActive && !crystalDies) ? 24 : 0;
    }
    const stage = Math.floor(currentProgress / (100 / 24));
    return Math.min(stage, 24);
  };

  const crystalStage = calculateCrystalStage(progress);

  // Removed useEffect for logging XP history as it's handled in page.tsx

  return (
    <Card className="osrs-box max-w-md mx-auto">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-lg font-semibold">Pomodoro Timer</CardTitle>
        <CardDescription className="text-xs">Grow Focus Crystals by completing work sessions.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-5 pt-2 pb-4">
        {/* Mode Buttons */}
        <div className="flex gap-2">
           <Button
            variant={mode === 'work' ? 'default' : 'outline'}
            onClick={() => switchMode('work')}
            size="sm"
            className={cn(mode === 'work' ? '' : 'bg-transparent border-input hover:bg-muted/50')}
            disabled={isActive}
          >
            <BookOpen className="mr-1.5 h-4 w-4" strokeWidth={1.5}/> Work
          </Button>
           <Button
            variant={mode === 'shortBreak' ? 'default' : 'outline'}
            onClick={() => switchMode('shortBreak')}
            size="sm"
             className={cn(mode === 'shortBreak' ? '' : 'bg-transparent border-input hover:bg-muted/50')}
             disabled={isActive}
          >
           <Coffee className="mr-1.5 h-4 w-4" strokeWidth={1.5}/> Short Break
          </Button>
          <Button
            variant={mode === 'longBreak' ? 'default' : 'outline'}
            onClick={() => switchMode('longBreak')}
            size="sm"
             className={cn(mode === 'longBreak' ? '' : 'bg-transparent border-input hover:bg-muted/50')}
             disabled={isActive}
          >
            <Coffee className="mr-1.5 h-4 w-4" strokeWidth={1.5}/> Long Break
          </Button>
        </div>

        {/* Timer and Crystal Area */}
        <div className="relative w-48 h-48 sm:w-52 sm:h-52">
             <FocusCrystal
                 stage={crystalStage} // Use calculated stage
                 isGrowing={isCrystalGrowing}
                 isWithered={crystalDies}
             />

           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className={cn(
                 "text-4xl sm:text-4xl font-bold tabular-nums text-foreground tracking-tighter",
                 "drop-shadow-[1px_1px_0_rgba(0,0,0,0.7)]"
                 )}>
                 {formatTime(timeLeft)}
             </span>
             <span className={cn(
                 "text-xs text-muted-foreground mt-1 capitalize px-1.5 py-0.5 rounded bg-background/60 backdrop-blur-sm",
                 )}>
                {modeLabel}
             </span>
          </div>
        </div>

         {/* Control Buttons */}
        <div className="flex gap-3">
          <Button
             onClick={toggleTimer} // Use passed handler
             size="default"
             aria-label={isActive ? 'Pause Timer' : 'Start Timer'}
             className={cn(
                "w-24 text-sm",
                isActive ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
             )}
             >
            {isActive ? <Pause className="mr-1.5 h-4 w-4" strokeWidth={2} /> : <Play className="mr-1.5 h-4 w-4" strokeWidth={2}/>}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button
             onClick={resetTimer} // Use passed handler
             variant="outline"
             size="icon"
             aria-label="Reset Timer"
             className="border-input hover:bg-muted/50"
             >
            <RotateCw className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>

         {/* Session & Crystal Counter */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
            <span>
                Completed Sessions: <span className="font-semibold text-foreground">{sessionsCompleted}</span>
            </span>
            <span className="flex items-center gap-0.5">
               <Gem size={12} className="text-accent"/> Grown Crystals: <span className="font-semibold text-foreground">{grownCrystalsCount}</span>
            </span>
        </div>
      </CardContent>
    </Card>
  );
}
