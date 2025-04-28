
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { ListTodo, Timer, Award, Trophy, LayoutDashboard, Settings as SettingsIcon, Gem, BookOpen, Play, Pause, Coffee, Lock } from 'lucide-react';
import StudyTracker, { Task, TaskPriority } from '@/components/study-tracker';
import PomodoroTimer, { TimerMode } from '@/components/pomodoro-timer';
import LevelSystem from '@/components/level-system';
import Achievements, { Achievement, UserStats } from '@/components/achievements';
import Overview from '@/components/overview';
import Settings, { PomodoroSettings, FOCUSFRIEND_SETTINGS_KEY } from '@/components/settings';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

// --- Constants ---
const LOCAL_STORAGE_KEY_TASKS = 'studyQuestTasks';
const LOCAL_STORAGE_KEY_XP = 'studyQuestXP';
const LOCAL_STORAGE_KEY_LEVEL = 'studyQuestLevel';
const LOCAL_STORAGE_KEY_POMODORO_SESSIONS = 'focusFriendPomodoroSessions';
const LOCAL_STORAGE_KEY_GROWN_CRYSTALS = 'focusFriendGrownCrystals';

const XP_PER_SECOND = 0.1;
const XP_PER_TASK_COMPLETION = 15;
const LEVEL_UP_BASE_XP = 100;
const LEVEL_UP_FACTOR = 1.5;

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  enableNotifications: true,
  enableAutostart: false,
};

// --- Helper Functions ---
const calculateXpToNextLevel = (currentLevel: number): number => {
    return Math.floor(LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, currentLevel - 1));
};

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
};

// Initial Achievements structure (moved here for easier access by central state logic)
const initialAchievementsData: Omit<Achievement, 'unlocked' | 'icon'>[] = [
    { id: 1, name: "First Task", description: "Complete your first study task.", unlockCondition: (stats) => stats.tasksCompleted >= 1 },
    { id: 2, name: "Focused Mind", description: "Complete a Pomodoro session.", unlockCondition: (stats) => stats.pomodoroSessions >= 1 },
    { id: 3, name: "Hour Hero", description: "Log 1 hour of study time.", unlockCondition: (stats) => stats.totalStudyTime >= 3600 },
    { id: 9, name: "Crystal Seed", description: "Grow your first Focus Crystal.", unlockCondition: (stats) => stats.grownCrystals >= 1 }, // New Achievement
    { id: 4, name: "Task Master", description: "Complete 10 study tasks.", unlockCondition: (stats) => stats.tasksCompleted >= 10 },
    { id: 5, name: "Level 5", description: "Reach level 5.", unlockCondition: (stats) => stats.level >= 5 },
    { id: 6, name: "Study Streak", description: "Log 5 hours of study time.", unlockCondition: (stats) => stats.totalStudyTime >= 18000 },
    { id: 7, name: "Pomodoro Pro", description: "Complete 10 Pomodoro sessions.", unlockCondition: (stats) => stats.pomodoroSessions >= 10 },
    { id: 10, name: "Crystal Hoarder", description: "Grow 5 Focus Crystals.", unlockCondition: (stats) => stats.grownCrystals >= 5 }, // New Achievement
    { id: 8, name: "Level 10", description: "Reach level 10.", unlockCondition: (stats) => stats.level >= 10 },
];


// --- OSRS Icon ---
const PixelScrollIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-accent">
    <path style={{ imageRendering: 'pixelated' }} d="M6 2H18V4H6V2ZM5 5V19H7V18H8V17H9V16H15V17H16V18H17V19H19V5H17V6H16V7H15V8H9V7H8V6H7V5H5ZM6 20H18V22H6V20Z" />
    <path style={{ imageRendering: 'pixelated', fill: 'hsl(var(--foreground)/0.8)' }} d="M7 5H17V6H16V7H15V8H9V7H8V6H7V5ZM7 18V19H17V18H16V17H15V16H9V17H8V18H7Z" />
  </svg>
);

// --- Main Component ---
export default function Home() {
  const [activeSection, setActiveSection] = useState('overview');
  const [isMounted, setIsMounted] = useState(false); // Track mount state for localStorage access
  const { toast } = useToast();

  // --- Centralized State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(LEVEL_UP_BASE_XP);
  const [prevLevel, setPrevLevel] = useState<number>(1); // For level-up toast

  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(defaultSettings);
  const [pomodoroMode, setPomodoroMode] = useState<TimerMode>('work');
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState<number>(defaultSettings.workDuration * 60);
  const [pomodoroIsActive, setPomodoroIsActive] = useState<boolean>(false);
  const [pomodoroSessionsCompleted, setPomodoroSessionsCompleted] = useState<number>(0);
  const [grownCrystalsCount, setGrownCrystalsCount] = useState<number>(0);
  const [pomodoroInitialDuration, setPomodoroInitialDuration] = useState<number>(defaultSettings.workDuration * 60);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // --- Timer Refs ---
  const taskTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pomodoroTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Derived State ---
  const userStats: UserStats = React.useMemo(() => {
      const completed = tasks.filter(task => task.completed).length;
      const studyTime = tasks.reduce((sum, task) => sum + (task.studyTime || 0), 0);
      return {
          tasksCompleted: completed,
          totalStudyTime: studyTime,
          level: level,
          pomodoroSessions: pomodoroSessionsCompleted,
          grownCrystals: grownCrystalsCount,
      };
  }, [tasks, level, pomodoroSessionsCompleted, grownCrystalsCount]);

  const achievements: Achievement[] = React.useMemo(() => {
        return initialAchievementsData.map(ach => {
            const isUnlocked = ach.unlockCondition(userStats);
            let icon: React.ReactNode;
            if (isUnlocked) {
                icon = (ach.id === 9 || ach.id === 10)
                    ? <Gem size={20} className="text-accent stroke-1" />
                    : <Trophy size={20} className="text-accent stroke-1" />;
            } else {
                icon = <Lock size={20} className="text-muted-foreground/50 stroke-1" />;
            }
            return { ...ach, unlocked: isUnlocked, icon };
        }).sort((a, b) => a.id - b.id);
    }, [userStats]);


  // --- Utility Functions (using state) ---
  const addXP = useCallback((amount: number) => {
    setXp(prevXp => {
      const newXp = prevXp + amount;
      let currentLevel = level;
      let requiredXp = xpToNextLevel;
      let accumulatedXp = newXp;
      let leveledUp = false;

      while (accumulatedXp >= requiredXp) {
        accumulatedXp -= requiredXp;
        currentLevel += 1;
        requiredXp = calculateXpToNextLevel(currentLevel);
        leveledUp = true;
      }

      if (leveledUp) {
        setLevel(currentLevel);
        setXpToNextLevel(requiredXp);
        // Level up toast is handled by the useEffect watching [level]
        return accumulatedXp;
      }

      return newXp;
    });
  }, [level, xpToNextLevel]);

  const getPomodoroDuration = useCallback((mode: TimerMode, currentSettings = pomodoroSettings) => {
    const durationKey = `${mode}Duration` as keyof PomodoroSettings;
    return (currentSettings[durationKey] || defaultSettings[durationKey]) * 60;
  }, [pomodoroSettings]);

  // --- LocalStorage Effects ---
  useEffect(() => {
    setIsMounted(true); // Indicate component has mounted

    // Load Tasks
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (storedTasks) {
      try {
        const parsedTasks: Omit<Task, 'isEditing' | 'isActive'>[] = JSON.parse(storedTasks);
        setTasks(parsedTasks.map(task => ({
          ...task,
          isActive: false, // Reset active state on load
          isEditing: false,
          priority: task.priority || 'medium'
        })));
      } catch (e) { console.error("Failed to parse tasks", e); }
    }

    // Load XP and Level
    const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
    const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
    const initialLevel = storedLevel ? parseInt(storedLevel, 10) : 1;
    setXp(storedXp ? parseFloat(storedXp) : 0);
    setLevel(initialLevel);
    setPrevLevel(initialLevel); // Sync previous level on load
    setXpToNextLevel(calculateXpToNextLevel(initialLevel));

    // Load Pomodoro Sessions and Crystals
    const storedPomodoro = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS);
    const storedCrystals = localStorage.getItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS);
    setPomodoroSessionsCompleted(storedPomodoro ? parseInt(storedPomodoro, 10) : 0);
    setGrownCrystalsCount(storedCrystals ? parseInt(storedCrystals, 10) : 0);

    // Load Pomodoro Settings and initialize timer
    const storedSettings = localStorage.getItem(FOCUSFRIEND_SETTINGS_KEY);
    let currentSettings = defaultSettings;
    if (storedSettings) {
      try {
        currentSettings = { ...defaultSettings, ...JSON.parse(storedSettings) };
      } catch (e) { console.error("Failed to parse settings", e); }
    }
    setPomodoroSettings(currentSettings);
    const initialTime = getPomodoroDuration('work', currentSettings);
    setPomodoroTimeLeft(initialTime);
    setPomodoroInitialDuration(initialTime); // Set initial duration based on loaded settings

  }, [getPomodoroDuration]); // Add getPomodoroDuration dependency


  // Save Tasks
  useEffect(() => {
    if (!isMounted) return; // Don't save on initial render before loading
    const tasksToSave = tasks.map(({ isEditing, isActive, ...rest }) => rest); // Exclude transient UI state
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasksToSave));
  }, [tasks, isMounted]);

  // Save XP and Level
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, xp.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level.toString());
    // Level up notification
    if (level > prevLevel) {
       setTimeout(() => { // Ensure toast runs outside render
         toast({
          title: "Level Up!",
          description: `Congratulations! You've reached Level ${level}!`,
          variant: "default",
          className: "osrs-box border-accent text-foreground",
        });
      }, 0);
      setPrevLevel(level); // Update previous level after showing toast
    }
  }, [xp, level, prevLevel, toast, isMounted]);

   // Save Pomodoro Sessions
   useEffect(() => {
       if (!isMounted) return;
       localStorage.setItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS, pomodoroSessionsCompleted.toString());
   }, [pomodoroSessionsCompleted, isMounted]);

    // Save Grown Crystals
    useEffect(() => {
        if (!isMounted) return;
        localStorage.setItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS, grownCrystalsCount.toString());
    }, [grownCrystalsCount, isMounted]);

  // --- Task Timer Logic ---
  const startTaskTimer = useCallback((taskId: string) => {
    if (taskTimerIntervalRef.current) clearInterval(taskTimerIntervalRef.current);

    // Stop any previously active task timer
    setTasks(prevTasks => prevTasks.map(t => ({ ...t, isActive: t.id === taskId })));
    setActiveTaskId(taskId);

    taskTimerIntervalRef.current = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.id === taskId && task.isActive) {
            const newStudyTime = (task.studyTime || 0) + 1; // Ensure studyTime is treated as number
            addXP(XP_PER_SECOND);
            return { ...task, studyTime: newStudyTime };
          }
          return task;
        })
      );
    }, 1000);
  }, [addXP]);

  const stopTaskTimer = useCallback(() => {
    if (taskTimerIntervalRef.current) {
      clearInterval(taskTimerIntervalRef.current);
      taskTimerIntervalRef.current = null;
    }
    setTasks(prevTasks => prevTasks.map(task => ({ ...task, isActive: false })));
    setActiveTaskId(null);
  }, []);

   // Cleanup task timer on unmount
   useEffect(() => {
     return () => {
       if (taskTimerIntervalRef.current) clearInterval(taskTimerIntervalRef.current);
     };
   }, []);

  // --- Pomodoro Timer Logic ---
  const showPomodoroNotification = useCallback((title: string, body: string) => {
    if (!pomodoroSettings.enableNotifications || !("Notification" in window) || !isMounted) {
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
  }, [pomodoroSettings.enableNotifications, isMounted]);


  const switchPomodoroMode = useCallback((nextMode: TimerMode) => {
    // "Wither" crystal if switching away from active work session
     if (pomodoroIsActive && pomodoroMode === 'work') {
         setTimeout(() => toast({
            title: "Focus Broken",
            description: "Your crystal withered...",
            variant: "destructive",
            className: "osrs-box border-destructive text-destructive-foreground",
         }), 0);
     }

    setPomodoroIsActive(false);
    if (pomodoroTimerIntervalRef.current) clearInterval(pomodoroTimerIntervalRef.current);
    pomodoroTimerIntervalRef.current = null;

    setPomodoroMode(nextMode);
    const newDuration = getPomodoroDuration(nextMode);
    setPomodoroTimeLeft(newDuration);
    setPomodoroInitialDuration(newDuration); // Update initial duration for progress bar

    const modeText = nextMode === 'work' ? 'Work' : nextMode === 'shortBreak' ? 'Short Break' : 'Long Break';
    const description = `Time for ${nextMode === 'work' ? 'focus!' : 'a break!'} (${formatTime(newDuration)})`;

     setTimeout(() => toast({
      title: `Mode: ${modeText}`,
      description: description,
      action: nextMode === 'work' ? <BookOpen className="text-primary" strokeWidth={1.5}/> : <Coffee className="text-secondary-foreground" strokeWidth={1.5}/>,
      className: "osrs-box border-secondary text-foreground",
    }), 0);

     showPomodoroNotification(`Switched to ${modeText}`, description);

     // Handle autostart (only if enabled and not the very first work session)
     if (pomodoroSettings.enableAutostart && (nextMode !== 'work' || pomodoroSessionsCompleted > 0)) {
         setPomodoroIsActive(true);
     }

  }, [pomodoroIsActive, pomodoroMode, getPomodoroDuration, pomodoroSettings.enableAutostart, pomodoroSessionsCompleted, toast, showPomodoroNotification]);


  useEffect(() => {
    if (pomodoroIsActive && pomodoroTimeLeft > 0) {
      pomodoroTimerIntervalRef.current = setInterval(() => {
        setPomodoroTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (pomodoroIsActive && pomodoroTimeLeft === 0) {
      // Timer finished
      setPomodoroIsActive(false);
      if (pomodoroTimerIntervalRef.current) clearInterval(pomodoroTimerIntervalRef.current);
      pomodoroTimerIntervalRef.current = null;

      const notificationTitle = pomodoroMode === 'work' ? 'Work Session Complete!' : 'Break Over!';
      const notificationBody = pomodoroMode === 'work' ? 'Well done! Time for a break.' : 'Back to the grind!';

       setTimeout(() => toast({
        title: notificationTitle,
        description: notificationBody + (pomodoroMode === 'work' ? ' Your crystal grew!' : ''),
        variant: 'default',
        action: pomodoroMode === 'work' ? <Gem className="text-accent" strokeWidth={1.5} /> : undefined,
        className: "osrs-box border-accent text-foreground",
      }), 0);

       showPomodoroNotification(notificationTitle, notificationBody);

      if (pomodoroMode === 'work') {
        const newSessionsCompleted = pomodoroSessionsCompleted + 1;
        setPomodoroSessionsCompleted(newSessionsCompleted);
        setGrownCrystalsCount(prev => prev + 1);
         if (newSessionsCompleted % pomodoroSettings.sessionsBeforeLongBreak === 0) {
          switchPomodoroMode('longBreak');
        } else {
          switchPomodoroMode('shortBreak');
        }
      } else {
        switchPomodoroMode('work');
      }
    } else {
        // Timer is paused or reset
        if (pomodoroTimerIntervalRef.current) clearInterval(pomodoroTimerIntervalRef.current);
        pomodoroTimerIntervalRef.current = null;
    }

     // Cleanup Pomodoro timer
     return () => {
         if (pomodoroTimerIntervalRef.current) clearInterval(pomodoroTimerIntervalRef.current);
     };
  }, [pomodoroIsActive, pomodoroTimeLeft, pomodoroMode, pomodoroSessionsCompleted, pomodoroSettings.sessionsBeforeLongBreak, switchPomodoroMode, toast, showPomodoroNotification]);


   const togglePomodoroTimer = () => {
     const wasActive = pomodoroIsActive;
     setPomodoroIsActive(!wasActive);
     if (!wasActive && pomodoroMode === 'work' && pomodoroTimeLeft === pomodoroInitialDuration) {
          setTimeout(() => toast({ title: "Crystal Seed Planted", description: `Focus to make it grow!` , className: "osrs-box border-primary text-foreground"}), 0);
         if (pomodoroSettings.enableNotifications && Notification.permission === "default") {
             Notification.requestPermission();
         }
     }
     else if (!wasActive) {
         setTimeout(() => toast({ title: "Timer Resumed", description: `Continuing ${pomodoroMode === 'work' ? 'Focus' : 'Break'} for ${formatTime(pomodoroTimeLeft)}` , className: "osrs-box border-primary text-foreground"}), 0);
     } else {
         const pauseTitle = pomodoroMode === 'work' ? "Focus Paused" : "Break Paused";
         const pauseDesc = pomodoroMode === 'work' ? "Crystal growth paused..." : "";
         setTimeout(() => toast({ title: pauseTitle, description: pauseDesc, className: "osrs-box border-secondary text-foreground" }), 0);
     }
  };

  const resetPomodoroTimer = () => {
     if (pomodoroIsActive && pomodoroMode === 'work') {
         setTimeout(() => toast({
            title: "Focus Broken",
            description: "Your crystal withered...",
            variant: "destructive",
            className: "osrs-box border-destructive text-destructive-foreground",
        }), 0);
     }

    setPomodoroIsActive(false);
     if (pomodoroTimerIntervalRef.current) clearInterval(pomodoroTimerIntervalRef.current);
     pomodoroTimerIntervalRef.current = null;
    const duration = getPomodoroDuration(pomodoroMode);
    setPomodoroTimeLeft(duration);
    setPomodoroInitialDuration(duration); // Reset initial duration
    const modeLabel = pomodoroMode === 'work' ? 'Focus Session' : pomodoroMode === 'shortBreak' ? 'Short Break' : 'Long Break';
     setTimeout(() => toast({ title: "Timer Reset", description: `${modeLabel} timer reset to ${formatTime(duration)}.`, className: "osrs-box border-secondary text-foreground" }), 0);
  };

  // --- Task Actions ---
   const addTask = (text: string, priority: TaskPriority) => {
      if (text.trim() === '') {
          setTimeout(() => toast({ title: "Task cannot be empty", variant: "destructive", className: "osrs-box border-destructive"}), 0);
          return;
      }
      const newTask: Task = {
          id: Date.now().toString(), text, completed: false, studyTime: 0, isActive: false, priority, isEditing: false,
      };
      setTasks(prev => [newTask, ...prev]);
      setTimeout(() => toast({ title: "Task Added", description: `"${text}" assigned ${priority} priority.`, className: "osrs-box border-primary text-foreground" }), 0);
  };

  const toggleTaskCompletion = (id: string) => {
    let taskText = '';
    let completed = false;
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };
          taskText = updatedTask.text;
          completed = updatedTask.completed;
          if (updatedTask.completed && updatedTask.isActive) {
            stopTaskTimer(); // Use the centralized stop function
          }
          if (updatedTask.completed) {
             addXP(XP_PER_TASK_COMPLETION);
          }
          return updatedTask;
        }
        return task;
      })
    );

    setTimeout(() => {
      const toastProps = completed
        ? { title: "Task Completed!", description: `+${XP_PER_TASK_COMPLETION} XP! "${taskText}"`, action: <CheckCircle className="text-accent" strokeWidth={1.5}/>, className: "osrs-box border-accent text-foreground"}
        : { title: "Task Reopened", description: `"${taskText}" marked as incomplete.`, className: "osrs-box border-secondary text-foreground"};
      toast(toastProps);
    }, 0);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete?.isActive) {
      stopTaskTimer();
    }
    setTasks(prev => prev.filter(task => task.id !== id));
    setTimeout(() => toast({ title: "Task Deleted", description: `"${taskToDelete?.text}" removed.`, variant: "destructive", className: "osrs-box border-destructive" }), 0);
  };

  const editTask = (id: string, newText: string) => {
     if (newText.trim() === '') {
         setTimeout(() => toast({ title: "Task cannot be empty", variant: "destructive", className: "osrs-box border-destructive"}), 0);
         return false; // Indicate failure
     }
     setTasks(prev => prev.map(task => task.id === id ? { ...task, text: newText, isEditing: false } : task));
      setTimeout(() => toast({ title: "Task Updated", className: "osrs-box border-primary text-foreground"}), 0);
      return true; // Indicate success
  };

   const updateTaskPriority = (id: string, priority: TaskPriority) => {
       setTasks(prev => prev.map(task => task.id === id ? { ...task, priority } : task));
   };

   const setTaskEditing = (id: string, isEditing: boolean) => {
      setTasks(prev => prev.map(task => task.id === id ? { ...task, isEditing } : { ...task, isEditing: false })); // Only one task can be edited at a time
   };


   // --- Settings Actions ---
   const updateSettings = (newSettings: PomodoroSettings) => {
       setPomodoroSettings(newSettings);
       localStorage.setItem(FOCUSFRIEND_SETTINGS_KEY, JSON.stringify(newSettings));
       // Reset timer if settings affecting duration changed and timer is not active
       if (!pomodoroIsActive) {
            const newDuration = getPomodoroDuration(pomodoroMode, newSettings);
            if (pomodoroTimeLeft !== newDuration || pomodoroInitialDuration !== newDuration) {
                setPomodoroTimeLeft(newDuration);
                setPomodoroInitialDuration(newDuration);
            }
       }
       setTimeout(() => toast({ title: "Settings Saved", className: "osrs-box border-primary text-foreground"}), 0);
   };

    // --- Memoized Sidebar Click Handlers ---
    const handleOverviewClick = useCallback(() => setActiveSection('overview'), []);
    const handleStudyClick = useCallback(() => setActiveSection('study'), []);
    const handlePomodoroClick = useCallback(() => setActiveSection('pomodoro'), []);
    const handleLevelsClick = useCallback(() => setActiveSection('levels'), []);
    const handleAchievementsClick = useCallback(() => setActiveSection('achievements'), []);
    const handleSettingsClick = useCallback(() => setActiveSection('settings'), []);


  // --- Render ---
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible='icon' variant='inset'>
          <SidebarHeader>
            <div className="flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
              <PixelScrollIcon />
              <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden tracking-wider">FocusFriend</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleOverviewClick} isActive={activeSection === 'overview'} tooltip="Overview" className="text-sm">
                  <LayoutDashboard strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleStudyClick} isActive={activeSection === 'study'} tooltip="Study Tracker" className="text-sm">
                  <ListTodo strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Study Tracker</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handlePomodoroClick} isActive={activeSection === 'pomodoro'} tooltip="Pomodoro Timer" className="text-sm">
                  <Timer strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Pomodoro Timer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLevelsClick} isActive={activeSection === 'levels'} tooltip="Level System" className="text-sm">
                  <Award strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Level System</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleAchievementsClick} isActive={activeSection === 'achievements'} tooltip="Achievements" className="text-sm">
                  <Trophy strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSettingsClick} isActive={activeSection === 'settings'} tooltip="Settings" className="text-sm">
                  <SettingsIcon strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter className="group-data-[collapsible=icon]:hidden">
             <p className="text-xs text-muted-foreground text-center opacity-70">OSRS Inspired</p>
           </SidebarFooter>
        </Sidebar>

        <SidebarInset className={cn("flex-1 p-3 md:p-4 bg-background text-foreground")}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
             <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden border border-input hover:bg-muted" />
                 <h2 className="text-lg font-semibold capitalize tracking-wide">
                    {activeSection === 'overview' && 'Dashboard Overview'}
                    {activeSection === 'study' && 'Study Task Manager'}
                    {activeSection === 'pomodoro' && 'Pomodoro Timer'}
                    {activeSection === 'levels' && 'Level Progression'}
                    {activeSection === 'achievements' && 'Achievements Log'}
                    {activeSection === 'settings' && 'Pomodoro Settings'}
                 </h2>
             </div>
            <div></div> {/* Placeholder */}
          </div>

          <div className="grid grid-cols-1 gap-4 osrs-box p-3 md:p-4">
            {activeSection === 'overview' && isMounted && (
                <Overview
                    stats={userStats}
                    xp={xp}
                    xpToNextLevel={xpToNextLevel}
                    tasks={tasks} // Pass full tasks array
                 />
            )}
            {activeSection === 'study' && isMounted && (
                <StudyTracker
                    tasks={tasks}
                    xp={xp}
                    level={level}
                    xpToNextLevel={xpToNextLevel}
                    addTask={addTask}
                    toggleTaskCompletion={toggleTaskCompletion}
                    deleteTask={deleteTask}
                    editTask={editTask}
                    updateTaskPriority={updateTaskPriority}
                    startTaskTimer={startTaskTimer}
                    stopTaskTimer={stopTaskTimer}
                    setTaskEditing={setTaskEditing}
                    activeTaskId={activeTaskId}
                />
            )}
            {activeSection === 'pomodoro' && isMounted && (
                <PomodoroTimer
                    settings={pomodoroSettings}
                    mode={pomodoroMode}
                    timeLeft={pomodoroTimeLeft}
                    isActive={pomodoroIsActive}
                    sessionsCompleted={pomodoroSessionsCompleted}
                    grownCrystalsCount={grownCrystalsCount}
                    initialDuration={pomodoroInitialDuration}
                    switchMode={switchPomodoroMode}
                    toggleTimer={togglePomodoroTimer}
                    resetTimer={resetTimer}
                />
            )}
            {activeSection === 'levels' && isMounted && (
                <LevelSystem
                    xp={xp}
                    level={level}
                    xpToNextLevel={xpToNextLevel}
                 />
            )}
            {activeSection === 'achievements' && isMounted && (
                 <Achievements
                    userStats={userStats}
                    achievements={achievements} // Pass centrally calculated achievements
                 />
             )}
            {activeSection === 'settings' && isMounted && (
                <Settings
                    settings={pomodoroSettings}
                    onSettingsChange={updateSettings}
                 />
            )}
            {!isMounted && <p>Loading...</p>} {/* Or a loading spinner */}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
