'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCw, Coffee, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes
const SESSIONS_BEFORE_LONG_BREAK = 4;
const LOCAL_STORAGE_KEY_POMODORO = 'studyQuestPomodoroSessions';

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(WORK_DURATION);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const { toast } = useToast();
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

   useEffect(() => {
       const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO);
       if (storedSessions) {
           setSessionsCompleted(parseInt(storedSessions, 10));
       }
   }, []);

   useEffect(() => {
       localStorage.setItem(LOCAL_STORAGE_KEY_POMODORO, sessionsCompleted.toString());
        window.dispatchEvent(new CustomEvent('pomodoroUpdate'));
   }, [sessionsCompleted]);


   const getDuration = useCallback((currentMode: TimerMode) => {
    switch (currentMode) {
      case 'work':
        return WORK_DURATION;
      case 'shortBreak':
        return SHORT_BREAK_DURATION;
      case 'longBreak':
        return LONG_BREAK_DURATION;
      default:
        return WORK_DURATION;
    }
  }, []);

  const switchMode = useCallback((nextMode: TimerMode) => {
    setIsActive(false);
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);

    setMode(nextMode);
    setTimeLeft(getDuration(nextMode));

    const modeText = nextMode === 'work' ? 'Work' : nextMode === 'shortBreak' ? 'Short Break' : 'Long Break';
     setTimeout(() => toast({
      title: `Mode: ${modeText}`,
      description: `Time for ${nextMode === 'work' ? 'focus!' : 'a break!'} (${formatTime(getDuration(nextMode))})`,
      action: nextMode === 'work' ? <BookOpen className="text-primary" strokeWidth={1.5}/> : <Coffee className="text-secondary-foreground" strokeWidth={1.5}/>,
      className: "osrs-box border-secondary text-foreground", // OSRS style toast
    }), 0);

  }, [getDuration, timerInterval, toast]);


  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);

       setTimeout(() => toast({
        title: mode === 'work' ? 'Work Session Complete!' : 'Break Over!',
        description: mode === 'work' ? 'Well done! Time for a break.' : 'Back to the grind!',
        variant: 'default',
        className: "osrs-box border-accent text-foreground", // OSRS style toast
      }), 0);


      if (mode === 'work') {
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
        if (newSessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('work');
      }
    } else {
        if (timerInterval) clearInterval(timerInterval);
        setTimerInterval(null);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]); // switchMode is memoized, toast is stable


  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);


  const toggleTimer = () => {
     const wasActive = isActive;
     setIsActive(!isActive);
     setTimeout(() => {
         if (!wasActive) {
            toast({ title: "Timer Started", description: `Focus for ${formatTime(timeLeft)}!` , className: "osrs-box border-primary text-foreground"});
         } else {
            toast({ title: "Timer Paused", className: "osrs-box border-secondary text-foreground" });
         }
     }, 0);
  };

  const resetTimer = () => {
    setIsActive(false);
     if (timerInterval) clearInterval(timerInterval);
     setTimerInterval(null);
    setTimeLeft(getDuration(mode));
     setTimeout(() => toast({ title: "Timer Reset", description: `${mode === 'work' ? 'Work' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'} timer reset to ${formatTime(getDuration(mode))}.`, className: "osrs-box border-secondary text-foreground" }), 0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100;
  const modeLabel = mode === 'work' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';

  return (
    <Card className="osrs-box max-w-md mx-auto">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-lg font-semibold">Pomodoro Timer</CardTitle>
        <CardDescription className="text-xs">Stay focused and take regular breaks.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-5 pt-2 pb-4">
        {/* Mode Buttons */}
        <div className="flex gap-2">
           <Button
            variant={mode === 'work' ? 'default' : 'outline'}
            onClick={() => switchMode('work')}
            size="sm"
            className={cn(mode === 'work' ? '' : 'bg-transparent border-input hover:bg-muted/50')}
          >
            <BookOpen className="mr-1.5 h-4 w-4" strokeWidth={1.5}/> Work
          </Button>
           <Button
            variant={mode === 'shortBreak' ? 'default' : 'outline'}
            onClick={() => switchMode('shortBreak')}
            size="sm"
             className={cn(mode === 'shortBreak' ? '' : 'bg-transparent border-input hover:bg-muted/50')}
          >
           <Coffee className="mr-1.5 h-4 w-4" strokeWidth={1.5}/> Short Break
          </Button>
          <Button
            variant={mode === 'longBreak' ? 'default' : 'outline'}
            onClick={() => switchMode('longBreak')}
            size="sm"
             className={cn(mode === 'longBreak' ? '' : 'bg-transparent border-input hover:bg-muted/50')}
          >
            <Coffee className="mr-1.5 h-4 w-4" strokeWidth={1.5}/> Long Break
          </Button>
        </div>

        {/* Timer Circle */}
        <div className="relative w-40 h-40 sm:w-44 sm:h-44">
           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            {/* Background circle - OSRS style */}
            <circle
              className="text-black/30 stroke-current"
              strokeWidth="6"
              cx="50"
              cy="50"
              r="45"
              fill="hsl(var(--card))" // Use card background
            />
             <circle // Inner bevel shadow
              className="text-black/20 stroke-current"
              strokeWidth="1"
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
            />
             <circle // Inner highlight
              className="text-white/10 stroke-current"
              strokeWidth="1"
              cx="50"
              cy="50"
              r="48"
              fill="transparent"
            />
             {/* Progress circle */}
            <circle
              className="text-accent stroke-current"
              strokeWidth="4" // Slightly thinner progress bar
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${(2 * Math.PI * 45) * (1 - progress / 100)}`}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              strokeLinecap="butt" // Sharp ends
            />
          </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-4xl font-bold tabular-nums text-foreground tracking-tighter">{formatTime(timeLeft)}</span>
             <span className="text-xs text-muted-foreground mt-1 capitalize">
                {modeLabel}
             </span>
          </div>
        </div>

         {/* Control Buttons */}
        <div className="flex gap-3">
          <Button
             onClick={toggleTimer}
             size="default" // Standard size
             aria-label={isActive ? 'Pause Timer' : 'Start Timer'}
             className={cn(
                "w-24 text-sm", // Slightly smaller text
                isActive ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
             )}
             >
            {isActive ? <Pause className="mr-1.5 h-4 w-4" strokeWidth={2} /> : <Play className="mr-1.5 h-4 w-4" strokeWidth={2}/>}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button
             onClick={resetTimer}
             variant="outline"
             size="icon"
             aria-label="Reset Timer"
             className="border-input hover:bg-muted/50"
             >
            <RotateCw className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>

         {/* Session Counter */}
        <p className="text-xs text-muted-foreground pt-1">
          Completed Sessions: <span className="font-semibold text-foreground">{sessionsCompleted}</span>
        </p>
      </CardContent>

    </Card>
  );
}
