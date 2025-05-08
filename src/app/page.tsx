// FILE: src/app/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

// --- Core Components & UI ---
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter
} from "@/components/ui/sidebar";
import StudyTracker, { Task, TaskPriority } from "@/components/study-tracker";
import PomodoroTimer, { TimerMode } from "@/components/pomodoro-timer";
import LevelSystem from "@/components/level-system";
import Overview from "@/components/overview";
import Settings, { PomodoroSettings, FOCUSFRIEND_SETTINGS_KEY } from "@/components/settings";
import Achievements, { Achievement, UserStats } from "@/components/achievements";
import { useToast } from "@/hooks/use-toast";
import useXP, { XPEvent } from '@/hooks/use-xp';

// --- Icons ---
import { ListTodo, Timer, Award, Trophy, LayoutDashboard, Settings as SettingsIcon, Gem, BookOpen, Coffee, Lock, CheckCircle, AlertTriangle } from "lucide-react";

// --- Utils & Constants ---
import { cn } from "@/lib/utils";
import { calculateXpToNextLevel as calculateOverallXpToNextLevel } from "@/lib/utils";

const LOCAL_STORAGE_KEY_TASKS = "studyQuestTasks";
const LOCAL_STORAGE_KEY_XP = "studyQuestXP";
const LOCAL_STORAGE_KEY_LEVEL = "studyQuestLevel";
const LOCAL_STORAGE_KEY_POMODORO_SESSIONS = "focusFriendPomodoroSessions";
const LOCAL_STORAGE_KEY_GROWN_CRYSTALS = "focusFriendGrownCrystals";
const XP_PER_SECOND = 0.1;
const XP_PER_TASK_COMPLETION = 15;
const defaultSettings: PomodoroSettings = { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, sessionsBeforeLongBreak: 4, enableNotifications: true, enableAutostart: false };

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ") || "0s";
};

const initialAchievementsData: Omit<Achievement, "unlocked" | "icon">[] = [
    { id: 1, name: "First Task", description: "Complete your first study task.", unlockCondition: (stats) => stats.tasksCompleted >= 1, },
    { id: 2, name: "Focused Mind", description: "Complete a Pomodoro session.", unlockCondition: (stats) => stats.pomodoroSessions >= 1, },
    { id: 3, name: "Hour Hero", description: "Log 1 hour of study time.", unlockCondition: (stats) => stats.totalStudyTime >= 3600, },
    { id: 9, name: "Crystal Seed", description: "Grow your first Focus Crystal.", unlockCondition: (stats) => stats.grownCrystals >= 1, },
    { id: 4, name: "Task Master", description: "Complete 10 study tasks.", unlockCondition: (stats) => stats.tasksCompleted >= 10, },
    { id: 5, name: "Level 5", description: "Reach level 5.", unlockCondition: (stats) => stats.level >= 5, },
    { id: 6, name: "Study Streak", description: "Log 5 hours of study time.", unlockCondition: (stats) => stats.totalStudyTime >= 18000, },
    { id: 7, name: "Pomodoro Pro", description: "Complete 10 Pomodoro sessions.", unlockCondition: (stats) => stats.pomodoroSessions >= 10, },
    { id: 10, name: "Crystal Hoarder", description: "Grow 5 Focus Crystals.", unlockCondition: (stats) => stats.grownCrystals >= 5, },
    { id: 8, name: "Level 10", description: "Reach level 10.", unlockCondition: (stats) => stats.level >= 10, },
];

const PixelScrollIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6 text-accent"
  >
    <path
      style={{ imageRendering: "pixelated" }}
      d="M6 2H18V4H6V2ZM5 5V19H7V18H8V17H9V16H15V17H16V18H17V19H19V5H17V6H16V7H15V8H9V7H8V6H7V5H5ZM6 20H18V22H6V20Z"
    />
    <path
      style={{ imageRendering: "pixelated", fill: "hsl(var(--foreground)/0.8)" }}
      d="M7 5H17V6H16V7H15V8H9V7H8V6H7V5ZM7 18V19H17V18H16V17H15V16H9V17H8V18H7Z"
    />
  </svg>
);


export default function Home() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");

  // --- Core State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(calculateOverallXpToNextLevel(1));
  const [prevLevel, setPrevLevel] = useState(1);

  // --- Timer UI State ---
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<TimerMode>("work");
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(defaultSettings.workDuration * 60);
  const [pomodoroInitialDuration, setPomodoroInitialDuration] = useState(defaultSettings.workDuration * 60);

  // --- Other State ---
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(defaultSettings);
  const [pomodoroSessionsCompleted, setPomodoroSessionsCompleted] = useState(0);
  const [grownCrystalsCount, setGrownCrystalsCount] = useState(0);
  const { xpHistory, addXPEvent } = useXP();

  // --- Active Task Display State ---
  const [activeTaskDisplayTime, setActiveTaskDisplayTime] = useState<number>(0);
  const latestActiveTaskTimeRef = useRef<number>(0);
  useEffect(() => {
      latestActiveTaskTimeRef.current = activeTaskDisplayTime;
  }, [activeTaskDisplayTime]);

  // --- Web Workers ---
  const pomodoroWorkerRef = useRef<Worker | null>(null);
  const taskWorkerRef = useRef<Worker | null>(null);
  const [pomodoroWorkerReady, setPomodoroWorkerReady] = useState(false);
  const [taskWorkerReady, setTaskWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // --- Check Worker Readiness ---
  const ensurePomodoroWorkerReady = useCallback(() => {
    if (!pomodoroWorkerRef.current || !pomodoroWorkerReady) {
      console.warn("Pomodoro Worker not available or not ready.");
      toast({ title: "Pomodoro Timer Unavailable", description: workerError ?? "The Pomodoro timer worker is not ready.", variant: "destructive" });
      return false;
    }
    return true;
  }, [pomodoroWorkerReady, workerError, toast]);

  const ensureTaskWorkerReady = useCallback(() => {
    if (!taskWorkerRef.current || !taskWorkerReady) {
      console.warn("Task Worker not available or not ready.");
      toast({ title: "Task Timer Unavailable", description: workerError ?? "The Task timer worker is not ready.", variant: "destructive" });
      return false;
    }
    return true;
  }, [taskWorkerReady, workerError, toast]);

  // --- Derived State (UserStats, Achievements) ---
  const userStats = useMemo((): UserStats => {
    return {
      tasksCompleted: tasks.filter((t) => t.completed).length,
      totalStudyTime: tasks.reduce((sum, t) => sum + (t.studyTime ?? 0), 0),
      pomodoroSessions: pomodoroSessionsCompleted,
      level,
      grownCrystals: grownCrystalsCount,
    };
  }, [tasks, level, pomodoroSessionsCompleted, grownCrystalsCount]);

  const achievements = useMemo((): Achievement[] => {
    if (!userStats || typeof userStats.level !== 'number') return [];
    return initialAchievementsData.map((ach) => {
      const unlocked = ach.unlockCondition(userStats);
      const icon = unlocked
        ? (ach.id === 9 || ach.id === 10 ? <Gem size={20} className="text-accent stroke-1" /> : <Trophy size={20} className="text-accent stroke-1" />)
        : <Lock size={20} className="text-muted-foreground/50 stroke-1" />;
      return { ...ach, unlocked, icon } as Achievement;
    }).sort((a, b) => a.id - b.id);
  }, [userStats]);

  // --- Core Logic Callbacks ---
  const getPomodoroDuration = useCallback((mode: TimerMode, currentSettings: PomodoroSettings = pomodoroSettings): number => {
    const map: Record<TimerMode, keyof PomodoroSettings> = { work: "workDuration", shortBreak: "shortBreakDuration", longBreak: "longBreakDuration" };
    const minutes = currentSettings[map[mode]] ?? defaultSettings[map[mode]];
    return Number(minutes ?? 0) * 60;
  }, [pomodoroSettings]);

  // --- addOverallXP MUST be defined before the main useEffect that uses it ---
  const addOverallXP = useCallback((amount: number, source: string) => {
    if (amount <= 0 || !isMounted) return;
    let didLevelUp = false;
    let finalNewLevel = level;
    let finalNewXpToNext = xpToNextLevel;
    setXp(prevXp => {
      let newTotalXp = prevXp + amount;
      let currentRequiredXp = xpToNextLevel;
      let newLevel = level;
      didLevelUp = false;
      finalNewLevel = level;
      finalNewXpToNext = xpToNextLevel;
      while (newTotalXp >= currentRequiredXp) {
        newTotalXp -= currentRequiredXp;
        newLevel += 1;
        currentRequiredXp = calculateOverallXpToNextLevel(newLevel);
        didLevelUp = true;
        finalNewLevel = newLevel;
        finalNewXpToNext = currentRequiredXp;
      }
      return newTotalXp;
    });
    if (didLevelUp) {
      setLevel(finalNewLevel);
      setXpToNextLevel(finalNewXpToNext);
    }
    addXPEvent(source, Math.round(amount));
  }, [level, xpToNextLevel, addXPEvent, isMounted]); // Dependencies are correct

  // --- handlePomodoroCompletion MUST be defined before the main useEffect that uses it ---
  const handlePomodoroCompletion = useCallback((completedMode: TimerMode) => {
    console.log(`Main: Handling Pomodoro completion for mode: ${completedMode}`);
    if (completedMode === 'work') {
      setPomodoroSessionsCompleted(s => s + 1);
      setGrownCrystalsCount(c => c + 1);
      toast({ title: "Focus Session Complete!", description: "Time for a break. Crystal grown!", className: "osrs-box border-accent text-foreground" });
      const sessions = pomodoroSessionsCompleted + 1;
      const nextMode = sessions % pomodoroSettings.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
      const nextDuration = getPomodoroDuration(nextMode, pomodoroSettings);
      setPomodoroMode(nextMode);
      setPomodoroTimeLeft(nextDuration);
      setPomodoroInitialDuration(nextDuration);
      if (pomodoroSettings.enableAutostart && ensurePomodoroWorkerReady()) {
        setTimeout(() => {
          console.log(`Main: Auto-starting ${nextMode} timer.`);
          pomodoroWorkerRef.current!.postMessage({
            type: 'START',
            payload: { duration: nextDuration, mode: nextMode, xpPerSecond: XP_PER_SECOND }
          });
          setPomodoroIsActive(true);
        }, 500);
      } else if (ensurePomodoroWorkerReady()) {
        pomodoroWorkerRef.current!.postMessage({
          type: 'RESET',
          payload: { duration: nextDuration, mode: nextMode }
        });
      }
    } else { // Break finished
      toast({ title: "Break Over!", description: "Ready for the next focus session?", className: "osrs-box border-primary text-foreground" });
      const nextDuration = getPomodoroDuration('work', pomodoroSettings);
      setPomodoroMode('work');
      setPomodoroTimeLeft(nextDuration);
      setPomodoroInitialDuration(nextDuration);
      if (pomodoroSettings.enableAutostart && ensurePomodoroWorkerReady()) {
        setTimeout(() => {
          console.log("Main: Auto-starting work timer.");
          pomodoroWorkerRef.current!.postMessage({
            type: 'START',
            payload: { duration: nextDuration, mode: 'work', xpPerSecond: XP_PER_SECOND }
          });
          setPomodoroIsActive(true);
        }, 500);
      } else if (ensurePomodoroWorkerReady()) {
        pomodoroWorkerRef.current!.postMessage({
          type: 'RESET',
          payload: { duration: nextDuration, mode: 'work' }
        });
      }
    }
  }, [pomodoroSessionsCompleted, pomodoroSettings, getPomodoroDuration, toast, ensurePomodoroWorkerReady]); // Dependencies are correct

  // --- Initialize Workers ---
  // *** MOVED this useEffect block AFTER addOverallXP and handlePomodoroCompletion ***
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // --- Pomodoro Worker ---
      if (!pomodoroWorkerRef.current) {
        console.log("Initializing Pomodoro Worker...");
        const workerInstance = new Worker(new URL('../workers/pomodoro.worker.ts', import.meta.url), { type: 'module' });
        pomodoroWorkerRef.current = workerInstance;

        workerInstance.onmessage = (event: MessageEvent) => {
          const { type, payload } = event.data;
          // console.log("Main: Received Pomodoro message:", type, payload);

          switch (type) {
            case 'POMODORO_WORKER_READY':
              setPomodoroWorkerReady(true);
              setWorkerError(null);
              console.log("Main: Pomodoro Worker Ready.");
              workerInstance.postMessage({ type: 'UPDATE_XP_RATE', payload: { xpPerSecond: XP_PER_SECOND } });
              break;
            case 'POMODORO_TICK':
              setPomodoroTimeLeft(payload.timeLeft);
              if (payload.mode && payload.mode !== pomodoroMode) {
                  setPomodoroMode(payload.mode);
              }
              break;
            case 'AWARD_XP':
              addOverallXP(payload.amount, payload.source); // Uses the function defined above
              break;
            case 'POMODORO_COMPLETE':
              console.log(`Main: Pomodoro worker reported complete. Mode: ${payload.mode}`);
              setPomodoroIsActive(false);
              handlePomodoroCompletion(payload.mode); // Uses the function defined above
              break;
            default:
              console.warn('Main: Received unknown message from Pomodoro worker:', type);
          }
        };
        workerInstance.onerror = (error) => {
          console.error("Main: Pomodoro Worker Error:", error.message);
          setWorkerError(`Pomodoro worker failed: ${error.message}`);
          setPomodoroWorkerReady(false);
          toast({ title: "Pomodoro Worker Error", description: "Pomodoro timer functionality may be limited.", variant: "destructive" });
        };
      }

      // --- Task Worker ---
      if (!taskWorkerRef.current) {
        console.log("Initializing Task Worker...");
        const workerInstance = new Worker(new URL('../workers/task.worker.ts', import.meta.url), { type: 'module' });
        taskWorkerRef.current = workerInstance;

        workerInstance.onmessage = (event: MessageEvent) => {
          const { type, payload } = event.data;
          // console.log("Main: Received Task message:", type, payload);

          switch (type) {
            case 'TASK_WORKER_READY':
              setTaskWorkerReady(true);
              setWorkerError(null);
              console.log("Main: Task Worker Ready.");
              workerInstance.postMessage({ type: 'UPDATE_XP_RATE', payload: { xpPerSecond: XP_PER_SECOND } });
              break;
            case 'TASK_TICK':
              if (payload.taskId === activeTaskId) {
                  setActiveTaskDisplayTime(payload.elapsedTime);
              }
              break;
            case 'AWARD_XP':
              addOverallXP(payload.amount, payload.source); // Uses the function defined above
              break;
            default:
              console.warn('Main: Received unknown message from Task worker:', type);
          }
        };
        workerInstance.onerror = (error) => {
          console.error("Main: Task Worker Error:", error.message);
          setWorkerError(`Task timer worker failed: ${error.message}`);
          setTaskWorkerReady(false);
          toast({ title: "Task Worker Error", description: "Task timer functionality may be limited.", variant: "destructive" });
        };
      }
    }

    // --- Cleanup Workers ---
    return () => {
      if (pomodoroWorkerRef.current) {
        console.log("Terminating Pomodoro Worker.");
        pomodoroWorkerRef.current.terminate();
        pomodoroWorkerRef.current = null;
        setPomodoroWorkerReady(false);
      }
      if (taskWorkerRef.current) {
        console.log("Terminating Task Worker.");
        taskWorkerRef.current.terminate();
        taskWorkerRef.current = null;
        setTaskWorkerReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskId, pomodoroMode, addOverallXP, handlePomodoroCompletion]); // Dependencies are now valid as functions are defined above


  // --- Level Up Toast Effect ---
  useEffect(() => {
    if (isMounted && level > prevLevel) {
      setTimeout(() => {
        toast({
          title: "Level Up!",
          description: `Congratulations! You've reached Level ${level}!`,
          className: "osrs-box border-accent text-foreground",
        });
      }, 0);
      setPrevLevel(level);
    }
  }, [level, prevLevel, isMounted, toast]);

  // --- Timer Control Functions ---
  const startTaskTimer = useCallback((taskId: string) => {
    if (!ensureTaskWorkerReady()) return;
    const task = tasks.find(t => t.id === taskId);
    const startTime = task?.studyTime ?? 0;
    console.log(`Main: Requesting task worker start timer for ${taskId}`);
    setActiveTaskId(taskId);
    setActiveTaskDisplayTime(startTime);
    setTasks((prevTasks) => prevTasks.map((t) => ({ ...t, isActive: t.id === taskId })));
    taskWorkerRef.current!.postMessage({
      type: 'START',
      payload: { taskId: taskId, startTime: startTime, xpPerSecond: XP_PER_SECOND }
    });
  }, [ensureTaskWorkerReady, tasks]);

  const stopTaskTimer = useCallback((taskId: string) => {
    if (!ensureTaskWorkerReady()) return;
    if (activeTaskId === taskId) {
      console.log(`Main: Requesting task worker pause timer for ${taskId}`);
      taskWorkerRef.current!.postMessage({ type: 'PAUSE' });
      const finalTime = latestActiveTaskTimeRef.current;
      setTasks((prevTasks) => prevTasks.map((t) =>
          t.id === taskId ? { ...t, isActive: false, studyTime: finalTime } : t
      ));
      setActiveTaskId(null);
      setActiveTaskDisplayTime(0);
    }
  }, [ensureTaskWorkerReady, activeTaskId]);

  const togglePomodoroTimer = useCallback(() => {
    if (!ensurePomodoroWorkerReady()) return;
    const shouldStart = !pomodoroIsActive;
    if (shouldStart) {
      console.log(`Main: Requesting pomodoro worker start timer. Mode: ${pomodoroMode}, TimeLeft: ${pomodoroTimeLeft}`);
      pomodoroWorkerRef.current!.postMessage({
        type: 'START',
        payload: { duration: pomodoroTimeLeft, mode: pomodoroMode, xpPerSecond: XP_PER_SECOND }
      });
    } else {
      console.log("Main: Requesting pomodoro worker pause timer.");
      pomodoroWorkerRef.current!.postMessage({ type: 'PAUSE' });
    }
    setPomodoroIsActive(shouldStart);
  }, [ensurePomodoroWorkerReady, pomodoroIsActive, pomodoroMode, pomodoroTimeLeft]);

  const resetTimer = useCallback((modeToReset: TimerMode = pomodoroMode) => {
    if (!ensurePomodoroWorkerReady()) return;
    const duration = getPomodoroDuration(modeToReset, pomodoroSettings);
    console.log(`Main: Requesting pomodoro worker reset timer. Mode: ${modeToReset}, Duration: ${duration}`);
    pomodoroWorkerRef.current!.postMessage({
      type: 'RESET',
      payload: { duration: duration, mode: modeToReset }
    });
    setPomodoroIsActive(false);
    setPomodoroTimeLeft(duration);
    setPomodoroInitialDuration(duration);
    setPomodoroMode(modeToReset);
  }, [ensurePomodoroWorkerReady, pomodoroMode, pomodoroSettings, getPomodoroDuration]);

  const switchPomodoroMode = useCallback((newMode: TimerMode) => {
    if (pomodoroIsActive) {
      console.warn("Cannot switch Pomodoro mode while timer is active.");
      toast({ title: "Action Denied", description: "Pause the timer before switching modes.", variant: "destructive" });
      return;
    }
    resetTimer(newMode);
  }, [pomodoroIsActive, resetTimer, toast]);

  // --- Task Management Functions ---
  const addTask = useCallback((text: string, priority: TaskPriority) => {
    if (!text.trim()) return;
    const newTask: Task = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      text: text.trim(), completed: false, studyTime: 0, isActive: false,
      priority: priority, isEditing: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const toggleTaskCompletion = useCallback((id: string) => {
    let taskText = "";
    let finalTime = 0;
    if (id === activeTaskId) {
        if (ensureTaskWorkerReady()) {
            console.log(`Main: Task ${id} completed, requesting task worker pause.`);
            taskWorkerRef.current!.postMessage({ type: 'PAUSE' });
            finalTime = latestActiveTaskTimeRef.current;
            setActiveTaskId(null);
            setActiveTaskDisplayTime(0);
        } else {
            finalTime = tasks.find(t => t.id === id)?.studyTime ?? 0;
        }
    }
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id) {
          taskText = task.text;
          const isNowComplete = !task.completed;
          if (isNowComplete) {
            addOverallXP(XP_PER_TASK_COMPLETION, `Complete: ${taskText.substring(0, 10)}...`);
          }
          return {
              ...task,
              completed: isNowComplete,
              isActive: false,
              studyTime: task.id === activeTaskId ? finalTime : task.studyTime
          };
        }
        return task;
      })
    );
  }, [addOverallXP, activeTaskId, ensureTaskWorkerReady, tasks]);

  const deleteTask = useCallback((id: string) => {
    if (id === activeTaskId) {
        if (ensureTaskWorkerReady()) {
            console.log(`Main: Deleting active task ${id}, requesting task worker STOP.`);
            taskWorkerRef.current!.postMessage({ type: 'STOP' });
            setActiveTaskId(null);
            setActiveTaskDisplayTime(0);
        } else {
             setActiveTaskId(null);
             setActiveTaskDisplayTime(0);
        }
    }
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, [activeTaskId, ensureTaskWorkerReady]);

  const editTask = useCallback((id: string, newText: string): boolean => {
    if (!newText.trim()) {
      toast({ title: "Error", description: "Task text cannot be empty.", variant: "destructive" });
      return false;
    }
    setTasks((prev) => prev.map((task) =>
      task.id === id ? { ...task, text: newText.trim(), isEditing: false } : task
    ));
    return true;
  }, [toast]);

  const updateTaskPriority = useCallback((id: string, priority: TaskPriority) => {
    setTasks((prev) => prev.map((task) =>
      task.id === id ? { ...task, priority: priority } : task
    ));
  }, []);

  const setTaskEditing = useCallback((id: string, isEditing: boolean) => {
    setTasks((prev) => prev.map((task) =>
      task.id === id ? { ...task, isEditing: isEditing } : task
    ));
  }, []);

  // --- Settings Update Function ---
  const updateSettings = useCallback((newSettings: PomodoroSettings, manualSave: boolean) => {
    if (manualSave) {
      setPomodoroSettings(newSettings);
      localStorage.setItem(FOCUSFRIEND_SETTINGS_KEY, JSON.stringify(newSettings));
      toast({ title: "Settings Saved", description: "Your Pomodoro settings have been updated.", className: "osrs-box" });
      if (!pomodoroIsActive && ensurePomodoroWorkerReady()) {
        const currentModeDuration = getPomodoroDuration(pomodoroMode, newSettings);
        setPomodoroTimeLeft(currentModeDuration);
        setPomodoroInitialDuration(currentModeDuration);
        pomodoroWorkerRef.current!.postMessage({
          type: 'RESET',
          payload: { duration: currentModeDuration, mode: pomodoroMode }
        });
      }
      const currentXpRate = XP_PER_SECOND;
      if (ensurePomodoroWorkerReady()) {
          pomodoroWorkerRef.current!.postMessage({ type: 'UPDATE_XP_RATE', payload: { xpPerSecond: currentXpRate } });
      }
      if (ensureTaskWorkerReady()) {
          taskWorkerRef.current!.postMessage({ type: 'UPDATE_XP_RATE', payload: { xpPerSecond: currentXpRate } });
      }
    }
  }, [pomodoroIsActive, pomodoroMode, getPomodoroDuration, toast, ensurePomodoroWorkerReady, ensureTaskWorkerReady]);

  // --- Sidebar Navigation ---
  const handleNavClick = useCallback((section: string) => setActiveSection(section), []);

  // --- Load/Save Effects ---
  useEffect(() => {
    setIsMounted(true);
    // Load from localStorage
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
     if (storedTasks) { try { const parsed = JSON.parse(storedTasks); setTasks( parsed.map((t: any) => ({ ...t, isActive: false, isEditing: false, priority: t.priority || "medium", })) ); } catch (err) { console.error("Failed to parse tasks", err); setTasks([]); } } else { setTasks([]); }
     const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP); const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL); const initialLevel = storedLevel ? parseInt(storedLevel, 10) : 1; setXp(storedXp ? parseFloat(storedXp) : 0); setLevel(initialLevel); setPrevLevel(initialLevel); setXpToNextLevel(calculateOverallXpToNextLevel(initialLevel));
     const storedPomodoro = localStorage.getItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS); const storedCrystals = localStorage.getItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS); setPomodoroSessionsCompleted(storedPomodoro ? parseInt(storedPomodoro, 10) : 0); setGrownCrystalsCount(storedCrystals ? parseInt(storedCrystals, 10) : 0);
     const storedSettings = localStorage.getItem(FOCUSFRIEND_SETTINGS_KEY); let loadedSettings = defaultSettings; if (storedSettings) { try { const parsed = JSON.parse(storedSettings); loadedSettings = { ...defaultSettings, ...parsed }; } catch (err) { console.error("Failed to parse settings", err); } } setPomodoroSettings(loadedSettings); const initialTime = getPomodoroDuration("work", loadedSettings); setPomodoroTimeLeft(initialTime); setPomodoroInitialDuration(initialTime);

  }, [getPomodoroDuration]); // Added getPomodoroDuration dependency

  useEffect(() => {
    if (!isMounted) return;
    // Save to localStorage
    const strippedTasks = tasks.map(({ isActive, isEditing, ...rest }) => rest);
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(strippedTasks));
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, xp.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_POMODORO_SESSIONS, pomodoroSessionsCompleted.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS, grownCrystalsCount.toString());
  }, [isMounted, tasks, xp, level, pomodoroSessionsCompleted, grownCrystalsCount]);

  // Effect to update pomodoro timer display if settings change and timer is not active
  useEffect(() => {
    if (!pomodoroIsActive) {
      const newDuration = getPomodoroDuration(pomodoroMode, pomodoroSettings);
      setPomodoroTimeLeft(newDuration);
      setPomodoroInitialDuration(newDuration);
    }
  }, [pomodoroSettings, pomodoroMode, pomodoroIsActive, getPomodoroDuration]);


  //------------------------------------------------
  //  RENDER
  //------------------------------------------------
  const workersReady = pomodoroWorkerReady && taskWorkerReady;
  const anyWorkerError = workerError !== null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* --- Sidebar --- */}
        <Sidebar collapsible="icon" variant="inset">
             <SidebarHeader>
                <div className="flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
                <PixelScrollIcon />
                <h1 className="text-xl font-semibold tracking-wider group-data-[collapsible=icon]:hidden">FocusFriend</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                <SidebarMenuItem><SidebarMenuButton onClick={() => handleNavClick("overview")} isActive={activeSection === "overview"} tooltip="Overview" className="text-sm"><LayoutDashboard strokeWidth={1.5} /><span className="group-data-[collapsible=icon]:hidden">Overview</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton onClick={() => handleNavClick("study")} isActive={activeSection === "study"} tooltip="Study Tracker" className="text-sm"><ListTodo strokeWidth={1.5} /><span className="group-data-[collapsible=icon]:hidden">Study Tracker</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton onClick={() => handleNavClick("pomodoro")} isActive={activeSection === "pomodoro"} tooltip="Pomodoro Timer" className="text-sm"><Timer strokeWidth={1.5} /><span className="group-data-[collapsible=icon]:hidden">Pomodoro Timer</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton onClick={() => handleNavClick("levels")} isActive={activeSection === "levels"} tooltip="Level System" className="text-sm"><Award strokeWidth={1.5} /><span className="group-data-[collapsible=icon]:hidden">Level System</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton onClick={() => handleNavClick("achievements")} isActive={activeSection === "achievements"} tooltip="Achievements" className="text-sm"><Trophy strokeWidth={1.5} /><span className="group-data-[collapsible=icon]:hidden">Achievements</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton onClick={() => handleNavClick("settings")} isActive={activeSection === "settings"} tooltip="Settings" className="text-sm"><SettingsIcon strokeWidth={1.5} /><span className="group-data-[collapsible=icon]:hidden">Settings</span></SidebarMenuButton></SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="group-data-[collapsible=icon]:hidden"><p className="text-xs text-muted-foreground text-center opacity-70">OSRS Inspired</p></SidebarFooter>
        </Sidebar>

        {/* --- Main Panel --- */}
        <SidebarInset className={cn("flex-1 p-3 md:p-4 bg-background text-foreground")}>
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
             <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden border border-input hover:bg-muted" />
              <h2 className="text-lg font-semibold capitalize tracking-wide">
                {activeSection === "overview" && "Dashboard Overview"}
                {activeSection === "study" && "Study Task Manager"}
                {activeSection === "pomodoro" && "Pomodoro Timer"}
                {activeSection === "levels" && "Level Progression"}
                {activeSection === "achievements" && "Achievements Log"}
                {activeSection === "settings" && "Pomodoro Settings"}
              </h2>
            </div>
            {/* Worker Status Indicator */}
            {anyWorkerError && isMounted && (
              <div className="flex items-center gap-1 text-xs text-destructive" title={workerError ?? "Worker Error"}>
                <AlertTriangle size={14} />
                <span>Timer Error</span>
              </div>
            )}
             {!anyWorkerError && !workersReady && isMounted && (
                <span className="text-xs text-muted-foreground animate-pulse">Timers Loading...</span>
            )}
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 gap-4 osrs-box p-3 md:p-4">
            {activeSection === "overview" && isMounted && <Overview stats={userStats} xp={xp} xpToNextLevel={xpToNextLevel} tasks={tasks} />}
            {activeSection === "study" && isMounted && (
                <StudyTracker
                    tasks={tasks} xp={xp} level={level} xpToNextLevel={xpToNextLevel}
                    addTask={addTask} toggleTaskCompletion={toggleTaskCompletion}
                    deleteTask={deleteTask} editTask={editTask} updateTaskPriority={updateTaskPriority}
                    startTaskTimer={startTaskTimer} stopTaskTimer={stopTaskTimer}
                    setTaskEditing={setTaskEditing} activeTaskId={activeTaskId}
                    awardXp={addOverallXP}
                    activeTaskDisplayTime={activeTaskDisplayTime}
                />
            )}
            {activeSection === "pomodoro" && isMounted && (
                <PomodoroTimer
                    settings={pomodoroSettings} mode={pomodoroMode} timeLeft={pomodoroTimeLeft}
                    isActive={pomodoroIsActive} sessionsCompleted={pomodoroSessionsCompleted}
                    grownCrystalsCount={grownCrystalsCount} initialDuration={pomodoroInitialDuration}
                    switchMode={switchPomodoroMode} toggleTimer={togglePomodoroTimer}
                    resetTimer={resetTimer}
                />
            )}
            {activeSection === "levels" && isMounted && <LevelSystem xp={xp} level={level} xpToNextLevel={xpToNextLevel} xpHistory={xpHistory} />}
            {activeSection === "achievements" && isMounted && <Achievements userStats={userStats} achievements={achievements} />}
            {activeSection === "settings" && isMounted && <Settings settings={pomodoroSettings} onManualSave={updateSettings} />}
            {!isMounted && <div className="text-center p-8 text-muted-foreground">Loading App...</div>}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}