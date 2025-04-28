
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw, Coffee, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PomodoroSettings, FOCUSFRIEND_SETTINGS_KEY } from '@/components/settings'; // Import settings interface and key

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const LOCAL_STORAGE_KEY_POMODORO_SESSIONS = 'focusFriendPomodoroSessions';

// Default values (will be overridden by loaded settings)
const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  enableNotifications: true,
  enableAutostart: false,
};

export default function PomodoroTimer() {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(defaultSettings.workDuration * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const { toast } = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // Use ref for interval

  // Load settings and sessions on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem(FOCUSFRIEND_SETTINGS_KEY);
    let currentSettings = defaultSettings;
    if (storedSettings) {
      try {
        currentSettings = { ...defaultSettings, ...JSON.parse(storedSettings) };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setSettings(currentSettings);
    setTimeLeft(currentSettings.workDuration * 60); // Initialize timer with loaded duration

    const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS);
    if (storedSessions) {
      setSessionsCompleted(parseInt(storedSessions, 10));
    }

    // Listen for settings updates from the settings page
    const handleSettingsUpdate = () => {
        const updatedStoredSettings = localStorage.getItem(FOCUSFRIEND_SETTINGS_KEY);
         let updatedSettings = defaultSettings;
        if (updatedStoredSettings) {
             try {
                updatedSettings = { ...defaultSettings, ...JSON.parse(updatedStoredSettings) };
             } catch (e) { console.error("Failed to parse updated settings", e); }
        }
        setSettings(updatedSettings);
         // Reset timer if it's not active and mode/duration changed
         if (!isActive) {
             setTimeLeft(updatedSettings[`${mode}Duration` as keyof PomodoroSettings] * 60);
         }
    };

     window.addEventListener('storage', (event) => {
        if (event.key === FOCUSFRIEND_SETTINGS_KEY) {
            handleSettingsUpdate();
        }
         if (event.key === LOCAL_STORAGE_KEY_POMODORO_SESSIONS) {
             const updatedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS);
             setSessionsCompleted(updatedSessions ? parseInt(updatedSessions, 10) : 0);
         }
     });
     // Use custom event if storage event is not reliable across tabs/windows for your setup
     window.addEventListener('settingsUpdate', handleSettingsUpdate);


    return () => {
         window.removeEventListener('settingsUpdate', handleSettingsUpdate);
         // Clean up storage listener if added above
    };

  }, [isActive, mode]); // Add isActive and mode dependency to reset timer correctly on settings change

  // Save sessions completed count
   useEffect(() => {
       localStorage.setItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS, sessionsCompleted.toString());
        // Dispatch custom event for cross-component updates if needed
        // window.dispatchEvent(new CustomEvent('pomodoroUpdate'));
   }, [sessionsCompleted]);


   const getDuration = useCallback((currentMode: TimerMode) => {
        // Use settings directly, ensure property name matches
        const durationKey = `${currentMode}Duration` as keyof PomodoroSettings;
        return (settings[durationKey] || defaultSettings[durationKey]) * 60; // Fallback to default
   }, [settings]);


  // Function to show notification
  const showNotification = useCallback((title: string, body: string) => {
    if (!settings.enableNotifications || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  }, [settings.enableNotifications]);

  const switchMode = useCallback((nextMode: TimerMode) => {
    setIsActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;

    setMode(nextMode);
    const newDuration = getDuration(nextMode);
    setTimeLeft(newDuration);

    const modeText = nextMode === 'work' ? 'Work' : nextMode === 'shortBreak' ? 'Short Break' : 'Long Break';
    const description = `Time for ${nextMode === 'work' ? 'focus!' : 'a break!'} (${formatTime(newDuration)})`;

     // Toast notification
     setTimeout(() => toast({
      title: `Mode: ${modeText}`,
      description: description,
      action: nextMode === 'work' ? <BookOpen className="text-primary" strokeWidth={1.5}/> : <Coffee className="text-secondary-foreground" strokeWidth={1.5}/>,
      className: "osrs-box border-secondary text-foreground", // OSRS style toast
    }), 0);

     // Browser notification
     showNotification(`Switched to ${modeText}`, description);

    // Handle autostart
     if (settings.enableAutostart) {
         setIsActive(true);
     }

  }, [getDuration, toast, showNotification, settings.enableAutostart]);


  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => {
          if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;

      const notificationTitle = mode === 'work' ? 'Work Session Complete!' : 'Break Over!';
      const notificationBody = mode === 'work' ? 'Well done! Time for a break.' : 'Back to the grind!';

       // Toast
       setTimeout(() => toast({
        title: notificationTitle,
        description: notificationBody,
        variant: 'default',
        className: "osrs-box border-accent text-foreground", // OSRS style toast
      }), 0);

      // Browser Notification
       showNotification(notificationTitle, notificationBody);


      if (mode === 'work') {
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
         if (newSessionsCompleted % settings.sessionsBeforeLongBreak === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('work');
      }
    } else {
        // Timer is paused or reset
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft, settings.sessionsBeforeLongBreak]); // Add switchMode dependency if it changes, ensure it's memoized


  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);


  const toggleTimer = () => {
     const wasActive = isActive;
     setIsActive(!isActive);
     setTimeout(() => {
         if (!wasActive) {
            toast({ title: "Timer Started", description: `Focus for ${formatTime(timeLeft)}!` , className: "osrs-box border-primary text-foreground"});
             // Request notification permission when timer starts if not granted/denied
             if (settings.enableNotifications && Notification.permission === "default") {
                 Notification.requestPermission();
             }
         } else {
            toast({ title: "Timer Paused", className: "osrs-box border-secondary text-foreground" });
         }
     }, 0);
  };

  const resetTimer = () => {
    setIsActive(false);
     if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
     timerIntervalRef.current = null;
    const duration = getDuration(mode);
    setTimeLeft(duration);
     setTimeout(() => toast({ title: "Timer Reset", description: `${mode === 'work' ? 'Work' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'} timer reset to ${formatTime(duration)}.`, className: "osrs-box border-secondary text-foreground" }), 0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const durationForMode = getDuration(mode);
  const progress = durationForMode > 0 ? ((durationForMode - timeLeft) / durationForMode) * 100 : 0;
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
            disabled={isActive} // Disable mode switching while timer is active
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
