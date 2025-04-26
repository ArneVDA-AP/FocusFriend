'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCw, Coffee, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes
const SESSIONS_BEFORE_LONG_BREAK = 4;

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(WORK_DURATION);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const { toast } = useToast();
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

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
    setIsActive(false); // Stop timer on mode switch
    if (timerInterval) clearInterval(timerInterval);
    setTimerInterval(null);

    setMode(nextMode);
    setTimeLeft(getDuration(nextMode));

    // Show notification for mode switch
    toast({
      title: `Switched to ${nextMode === 'work' ? 'Work' : nextMode === 'shortBreak' ? 'Short Break' : 'Long Break'} Mode`,
      description: `Time for ${nextMode === 'work' ? 'focus!' : 'a break!'}`,
      action: nextMode === 'work' ? <BookOpen className="text-primary" /> : <Coffee className="text-secondary-foreground" />,
    });

  }, [getDuration, timerInterval, toast]);


  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval); // Clear interval on cleanup
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      if (timerInterval) clearInterval(timerInterval);
      setTimerInterval(null);

      // Play sound or show notification
      // For now, using toast
      toast({
        title: mode === 'work' ? 'Work Session Complete!' : 'Break Over!',
        description: mode === 'work' ? 'Time for a break!' : 'Time to get back to work!',
        variant: 'default',
      });

      if (mode === 'work') {
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
        if (newSessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        // If break finished, switch back to work
        switchMode('work');
      }
    } else {
       // Clear interval if timer is not active or timeLeft is 0
        if (timerInterval) clearInterval(timerInterval);
        setTimerInterval(null);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]); // Dependency array: only re-run effect if isActive or timeLeft changes


   // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);


  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
     if (timerInterval) clearInterval(timerInterval);
     setTimerInterval(null);
    setTimeLeft(getDuration(mode));
    toast({ title: "Timer Reset", description: `Timer reset to ${formatTime(getDuration(mode))}.` });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100;

  return (
    <Card className="shadow-md max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Pomodoro Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="flex gap-2 mb-4">
           <Button
            variant={mode === 'work' ? 'default' : 'outline'}
            onClick={() => switchMode('work')}
            size="sm"
          >
            Work
          </Button>
           <Button
            variant={mode === 'shortBreak' ? 'default' : 'outline'}
            onClick={() => switchMode('shortBreak')}
            size="sm"
          >
            Short Break
          </Button>
          <Button
            variant={mode === 'longBreak' ? 'default' : 'outline'}
            onClick={() => switchMode('longBreak')}
            size="sm"
          >
            Long Break
          </Button>
        </div>

        <div className="relative w-48 h-48">
           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
            <circle
              className="text-muted stroke-current"
              strokeWidth="4"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            ></circle>
             {/* Progress circle */}
            <circle
              className="text-primary stroke-current"
              strokeWidth="4"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${(2 * Math.PI * 45) * (1 - progress / 100)}`}
              transform="rotate(-90 50 50)" // Start from the top
              style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            ></circle>
          </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums">{formatTime(timeLeft)}</span>
             <span className="text-sm text-muted-foreground capitalize">
                {mode === 'work' ? 'Work Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
             </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={toggleTimer} size="lg" aria-label={isActive ? 'Pause Timer' : 'Start Timer'}>
            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg" aria-label="Reset Timer">
            <RotateCw className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Sessions completed: {sessionsCompleted}
        </p>
      </CardContent>

    </Card>
  );
}
