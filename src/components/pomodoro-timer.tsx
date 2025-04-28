
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCw, Coffee, BookOpen, Gem } from 'lucide-react'; // Added Gem icon
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PomodoroSettings, FOCUSFRIEND_SETTINGS_KEY } from '@/components/settings';
import FocusCrystal from '@/components/focus-crystal'; // Import the new component

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const LOCAL_STORAGE_KEY_POMODORO_SESSIONS = 'focusFriendPomodoroSessions';
const LOCAL_STORAGE_KEY_GROWN_CRYSTALS = 'focusFriendGrownCrystals'; // Key for grown crystals

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
  const [grownCrystalsCount, setGrownCrystalsCount] = useState<number>(0); // State for grown crystals
  const { toast } = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // Use ref for interval
  const initialDurationRef = useRef<number>(defaultSettings.workDuration * 60); // Store initial duration for progress

  // Load settings, sessions, and grown crystals on mount
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
    const initialTime = currentSettings.workDuration * 60;
    setTimeLeft(initialTime);
    initialDurationRef.current = initialTime;

    const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS);
    if (storedSessions) {
      setSessionsCompleted(parseInt(storedSessions, 10));
    }

    const storedCrystals = localStorage.getItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS); // Load grown crystals
    if (storedCrystals) {
        setGrownCrystalsCount(parseInt(storedCrystals, 10));
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
             const newDuration = (updatedSettings[`${mode}Duration` as keyof PomodoroSettings] || defaultSettings[`${mode}Duration` as keyof PomodoroSettings]) * 60;
             setTimeLeft(newDuration);
             initialDurationRef.current = newDuration; // Update initial duration ref
         }
    };

     const handleStorageChange = (event: StorageEvent) => {
        if (event.key === FOCUSFRIEND_SETTINGS_KEY) {
            handleSettingsUpdate();
        }
         if (event.key === LOCAL_STORAGE_KEY_POMODORO_SESSIONS) {
             const updatedSessions = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS);
             setSessionsCompleted(updatedSessions ? parseInt(updatedSessions, 10) : 0);
         }
          if (event.key === LOCAL_STORAGE_KEY_GROWN_CRYSTALS) { // Listen for crystal changes
              const updatedCrystals = localStorage.getItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS);
              setGrownCrystalsCount(updatedCrystals ? parseInt(updatedCrystals, 10) : 0);
          }
     };

     window.addEventListener('storage', handleStorageChange);
     // Use custom event if storage event is not reliable across tabs/windows for your setup
     window.addEventListener('settingsUpdate', handleSettingsUpdate);


    return () => {
         window.removeEventListener('storage', handleStorageChange);
         window.removeEventListener('settingsUpdate', handleSettingsUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed isActive and mode dependency as reset logic is handled inside the listener

  // Save sessions completed count
   useEffect(() => {
       localStorage.setItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS, sessionsCompleted.toString());
       // Dispatch custom event for cross-component updates (e.g., achievements)
       window.dispatchEvent(new CustomEvent('pomodoroUpdate'));
   }, [sessionsCompleted]);

    // Save grown crystals count
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS, grownCrystalsCount.toString());
        // Dispatch event if other components need to know about crystal count
        // window.dispatchEvent(new CustomEvent('crystalUpdate'));
    }, [grownCrystalsCount]);


   const getDuration = useCallback((currentMode: TimerMode) => {
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
    if (isActive && mode === 'work') {
        // If switching away from an active work session, the crystal "dies" (doesn't count)
        toast({
            title: "Focus Broken",
            description: "Your crystal withered...",
            variant: "destructive",
            className: "osrs-box border-destructive text-destructive-foreground",
        });
    }

    setIsActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;

    setMode(nextMode);
    const newDuration = getDuration(nextMode);
    setTimeLeft(newDuration);
    initialDurationRef.current = newDuration; // Update initial duration for the new mode

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
     if (settings.enableAutostart && nextMode !== 'work') { // Usually autostart breaks, not work
         setIsActive(true);
     } else if (settings.enableAutostart && nextMode === 'work' && sessionsCompleted > 0) {
         // Only autostart work if it's not the very first session (or based on preference)
          setIsActive(true);
     }

  }, [getDuration, toast, showNotification, settings.enableAutostart, sessionsCompleted, isActive, mode]);


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
        description: notificationBody + (mode === 'work' ? ' Your crystal grew!' : ''),
        variant: 'default',
         action: mode === 'work' ? <Gem className="text-accent" strokeWidth={1.5} /> : undefined,
        className: "osrs-box border-accent text-foreground", // OSRS style toast
      }), 0);

      // Browser Notification
       showNotification(notificationTitle, notificationBody);


      if (mode === 'work') {
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
        setGrownCrystalsCount(prev => prev + 1); // Increment grown crystals count
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
  }, [isActive, timeLeft, settings.sessionsBeforeLongBreak, switchMode]); // Added switchMode dependency

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
     if (!wasActive && mode === 'work' && timeLeft === initialDurationRef.current) {
         // Starting a fresh work session
          toast({ title: "Crystal Seed Planted", description: `Focus to make it grow!` , className: "osrs-box border-primary text-foreground"});
          // Request notification permission when timer starts if not granted/denied
         if (settings.enableNotifications && Notification.permission === "default") {
             Notification.requestPermission();
         }
     }
     else if (!wasActive) {
         // Resuming timer
         toast({ title: "Timer Resumed", description: `Continuing ${modeLabel} for ${formatTime(timeLeft)}` , className: "osrs-box border-primary text-foreground"});
     } else {
         // Pausing timer
         if (mode === 'work') {
            toast({ title: "Focus Paused", description: "Crystal growth paused...", className: "osrs-box border-secondary text-foreground" });
         } else {
             toast({ title: "Break Paused", className: "osrs-box border-secondary text-foreground" });
         }
     }
  };

  const resetTimer = () => {
     if (isActive && mode === 'work') {
        // Resetting an active work session means the crystal "dies"
         toast({
            title: "Focus Broken",
            description: "Your crystal withered...",
            variant: "destructive",
            className: "osrs-box border-destructive text-destructive-foreground",
        });
     }

    setIsActive(false);
     if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
     timerIntervalRef.current = null;
    const duration = getDuration(mode);
    setTimeLeft(duration);
    initialDurationRef.current = duration; // Update initial duration on reset
     setTimeout(() => toast({ title: "Timer Reset", description: `${modeLabel} timer reset to ${formatTime(duration)}.`, className: "osrs-box border-secondary text-foreground" }), 0);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const durationForMode = initialDurationRef.current; // Use ref for consistent progress calculation
  const progress = durationForMode > 0 ? ((durationForMode - timeLeft) / durationForMode) * 100 : 0;
  const modeLabel = mode === 'work' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';
  const isCrystalGrowing = mode === 'work' && isActive;
  const crystalDies = mode === 'work' && !isActive && timeLeft < durationForMode && timeLeft > 0; // Paused or stopped mid-session

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

        {/* Timer and Crystal Area */}
        <div className="relative w-48 h-48 sm:w-52 sm:h-52"> {/* Increased size slightly */}
            {/* Focus Crystal Visualization */}
             <FocusCrystal
                progress={mode === 'work' ? progress : 0} // Only show progress during work
                isGrowing={isCrystalGrowing}
                isWithered={crystalDies} // Pass withered state
             />

           {/* Timer Text Overlay */}
           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <span className={cn(
                 "text-4xl sm:text-4xl font-bold tabular-nums text-foreground tracking-tighter",
                 "drop-shadow-[1px_1px_0_rgba(0,0,0,0.7)]" // Add shadow to text for readability over crystal
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
