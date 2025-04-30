
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

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
} from "@/components/ui/sidebar";

import {
  ListTodo,
  Timer,
  Award,
  Trophy,
  LayoutDashboard,
  Settings as SettingsIcon,
  Gem,
  BookOpen,
  Coffee,
  Lock,
  CheckCircle,
} from "lucide-react";

import StudyTracker, {
  Task,
  TaskPriority,
} from "@/components/study-tracker";
import PomodoroTimer, {
  TimerMode,
} from "@/components/pomodoro-timer";
import LevelSystem from "@/components/level-system";
import Overview from "@/components/overview";
import Settings, {
  PomodoroSettings,
  FOCUSFRIEND_SETTINGS_KEY,
} from "@/components/settings";
import Achievements, {
  Achievement,
  UserStats,
} from "@/components/achievements";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useXP from '@/hooks/use-xp'; // Import the useXP hook

//--------------------------------------------------
//  CONSTANTS & HELPERS
//--------------------------------------------------

const LOCAL_STORAGE_KEY_TASKS = "studyQuestTasks";
const LOCAL_STORAGE_KEY_XP = "studyQuestXP";
const LOCAL_STORAGE_KEY_LEVEL = "studyQuestLevel";
const LOCAL_STORAGE_KEY_POMODORO_SESSIONS = "focusFriendPomodoroSessions";
const LOCAL_STORAGE_KEY_GROWN_CRYSTALS = "focusFriendGrownCrystals";

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

// Use the overall XP calculation function from utils
import { calculateXpToNextLevel as calculateOverallXpToNextLevel } from "@/lib/utils";

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

//--------------------------------------------------
//  ACHIEVEMENTS DATA (unlocked flag & icon are added later)
//--------------------------------------------------

const initialAchievementsData: Omit<Achievement, "unlocked" | "icon">[] = [
  {
    id: 1,
    name: "First Task",
    description: "Complete your first study task.",
    unlockCondition: (stats) => stats.tasksCompleted >= 1,
  },
  {
    id: 2,
    name: "Focused Mind",
    description: "Complete a Pomodoro session.",
    unlockCondition: (stats) => stats.pomodoroSessions >= 1,
  },
  {
    id: 3,
    name: "Hour Hero",
    description: "Log 1 hour of study time.",
    unlockCondition: (stats) => stats.totalStudyTime >= 3600,
  },
  {
    id: 9,
    name: "Crystal Seed",
    description: "Grow your first Focus Crystal.",
    unlockCondition: (stats) => stats.grownCrystals >= 1,
  },
  {
    id: 4,
    name: "Task Master",
    description: "Complete 10 study tasks.",
    unlockCondition: (stats) => stats.tasksCompleted >= 10,
  },
  {
    id: 5,
    name: "Level 5",
    description: "Reach level 5.",
    unlockCondition: (stats) => stats.level >= 5,
  },
  {
    id: 6,
    name: "Study Streak",
    description: "Log 5 hours of study time.",
    unlockCondition: (stats) => stats.totalStudyTime >= 18000,
  },
  {
    id: 7,
    name: "Pomodoro Pro",
    description: "Complete 10 Pomodoro sessions.",
    unlockCondition: (stats) => stats.pomodoroSessions >= 10,
  },
  {
    id: 10,
    name: "Crystal Hoarder",
    description: "Grow 5 Focus Crystals.",
    unlockCondition: (stats) => stats.grownCrystals >= 5,
  },
  {
    id: 8,
    name: "Level 10",
    description: "Reach level 10.",
    unlockCondition: (stats) => stats.level >= 10,
  },
];

//--------------------------------------------------
//  PIXEL‑ART SCROLL ICON COMPONENT
//--------------------------------------------------

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

//--------------------------------------------------
//  MAIN COMPONENT
//--------------------------------------------------

export default function Home() {
  //------------------------------------------------
  //  GLOBAL TOAST
  //------------------------------------------------
  const { toast } = useToast();

  //------------------------------------------------
  //  MOUNT STATE (because we read localStorage)
  //------------------------------------------------
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  //------------------------------------------------
  //  NAVIGATION (sidebar buttons)
  //------------------------------------------------
  const [activeSection, setActiveSection] = useState<
    "overview" | "study" | "pomodoro" | "levels" | "achievements" | "settings"
  >("overview");

  //------------------------------------------------
  //  CENTRAL DATA STATE
  //------------------------------------------------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(
    calculateOverallXpToNextLevel(1)
  );
  const [prevLevel, setPrevLevel] = useState(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null); // Track active task timer

  // Pomodoro
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(
    defaultSettings
  );
  const [pomodoroMode, setPomodoroMode] = useState<TimerMode>("work");
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(
    defaultSettings.workDuration * 60
  );
  const [pomodoroIsActive, setPomodoroIsActive] = useState(false);
  const [pomodoroSessionsCompleted, setPomodoroSessionsCompleted] =
    useState(0);
  const [grownCrystalsCount, setGrownCrystalsCount] = useState(0);
  const [pomodoroInitialDuration, setPomodoroInitialDuration] = useState(
    defaultSettings.workDuration * 60
  );

  // timers
  const taskTimerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const pomodoroTimerIntervalRef = useRef<
    ReturnType<typeof setInterval> | null
  >(null);

  // XP History Hook
  const { xpHistory, addXPEvent } = useXP(); // Get the hook's state and function

  //------------------------------------------------
  //  DERIVED USER STATS
  //------------------------------------------------
  const userStats: UserStats = useMemo(
    () => ({
      tasksCompleted: tasks.filter((t) => t.completed).length,
      totalStudyTime: tasks.reduce(
        (sum, t) => sum + (t.studyTime ?? 0),
        0
      ),
      pomodoroSessions: pomodoroSessionsCompleted,
      level,
      grownCrystals: grownCrystalsCount,
    }),
    [tasks, level, pomodoroSessionsCompleted, grownCrystalsCount]
  );

  //------------------------------------------------
  //  ACHIEVEMENTS (computed from userStats)
  //------------------------------------------------
  const achievements: Achievement[] = useMemo(() => {
    return initialAchievementsData
      .map((ach) => {
        const unlocked = ach.unlockCondition(userStats);
        const icon = unlocked ? (
          ach.id === 9 || ach.id === 10 ? (
            <Gem size={20} className="text-accent stroke-1" />
          ) : (
            <Trophy size={20} className="text-accent stroke-1" />
          )
        ) : (
          <Lock size={20} className="text-muted-foreground/50 stroke-1" />
        );

        return { ...ach, unlocked, icon } as Achievement;
      })
      .sort((a, b) => a.id - b.id);
  }, [userStats]);


  //------------------------------------------------
  //  REUSABLE CALLBACKS / LOGIC (Define dependencies first)
  //------------------------------------------------

  // --- POMODORO HELPERS ---
  const getPomodoroDuration = useCallback(
    (
      mode: TimerMode,
      currentSettings: PomodoroSettings = pomodoroSettings
    ) => {
      const map: Record<TimerMode, keyof PomodoroSettings> = {
        work: "workDuration",
        shortBreak: "shortBreakDuration",
        longBreak: "longBreakDuration",
      };
      const minutes = currentSettings[map[mode]] ?? defaultSettings[map[mode]];
      return Number(minutes ?? 0) * 60;
    },
    [pomodoroSettings] // Depends only on pomodoroSettings state
  );


  // Needs to be defined before being used in other callbacks
  const switchPomodoroMode = useCallback((newMode: TimerMode) => {
      if (pomodoroIsActive) return; // Don't switch if timer is active

      setPomodoroMode(newMode);
      const newDuration = getPomodoroDuration(newMode, pomodoroSettings);
      setPomodoroTimeLeft(newDuration);
      setPomodoroInitialDuration(newDuration); // Update initial duration for progress bar
  }, [pomodoroIsActive, getPomodoroDuration, pomodoroSettings]);

  // Needs to be defined before being used in other callbacks
  const resetTimer = useCallback((modeToReset: TimerMode = pomodoroMode) => {
      if (pomodoroTimerIntervalRef.current) {
          clearInterval(pomodoroTimerIntervalRef.current);
          pomodoroTimerIntervalRef.current = null;
      }
      setPomodoroIsActive(false);
      const duration = getPomodoroDuration(modeToReset, pomodoroSettings);
      setPomodoroTimeLeft(duration);
      setPomodoroInitialDuration(duration); // Update initial duration
      setPomodoroMode(modeToReset); // Ensure mode is set correctly
  }, [getPomodoroDuration, pomodoroSettings, pomodoroMode]);


  // --- OVERALL XP / LEVEL HELPERS ---
  const addOverallXP = useCallback(
    (amount: number, source: string) => { // Add source parameter
      if (amount <= 0) return;
      setXp((prevXp) => {
        let newTotalXp = prevXp + amount;
        let currentLvl = level;
        let requiredXp = xpToNextLevel;
        let leveledUp = false;

        while (newTotalXp >= requiredXp) {
          newTotalXp -= requiredXp;
          currentLvl += 1;
          requiredXp = calculateOverallXpToNextLevel(currentLvl);
          leveledUp = true;
        }

        if (leveledUp) {
          setLevel(currentLvl);
          setXpToNextLevel(requiredXp);
          // Toast handled in useEffect
        }

        // Add XP event to history
        addXPEvent(source, Math.round(amount)); // Use the source description

        return newTotalXp;
      });
    },
    [level, xpToNextLevel, addXPEvent] // Add addXPEvent dependency
  );


  // --- TASK TIMER HELPERS ---
  // Define stopTaskTimer first as it's used by startTaskTimer and others
  const stopTaskTimer = useCallback((taskId: string) => {
      if (taskTimerIntervalRef.current && activeTaskId === taskId) { // Only clear if it's the timer for the specified task
          clearInterval(taskTimerIntervalRef.current);
          taskTimerIntervalRef.current = null;
          setActiveTaskId(null); // Clear the active task ID
          // Update tasks state immutably
          setTasks((prevTasks) => prevTasks.map((t) => t.id === taskId ? { ...t, isActive: false } : t));
      }
  }, [activeTaskId]); // Dependency on activeTaskId

  // Now define startTaskTimer
  const startTaskTimer = useCallback(
    (taskId: string) => {
      // Don't allow starting a new timer if another task timer is already active
      // if (activeTaskId && activeTaskId !== taskId) {
      //     toast({ title: "Timer Active", description: `Another task timer is already running.` });
      //     return;
      // }

       // Allow starting if pomodoro timer is active
      setActiveTaskId(taskId); // Set the active task ID
      // Update tasks state immutably
      setTasks((prevTasks) => prevTasks.map((t) => ({ ...t, isActive: t.id === taskId })));

      taskTimerIntervalRef.current = setInterval(() => {
        setTasks((prevTasks) =>
          prevTasks.map((t) => {
            if (t.id === taskId && t.isActive) {
              const newTime = (t.studyTime ?? 0) + 1;
              // Add overall XP per second from Task Timer
              addOverallXP(XP_PER_SECOND, `Task: ${t.text.substring(0, 15)}...`);
              return { ...t, studyTime: newTime };
            }
            return t;
          })
        );
      }, 1000);
    },
    [addOverallXP, toast, activeTaskId] // Removed stopTaskTimer dependency
  );

   // --- POMODORO MAIN LOGIC ---
  const togglePomodoroTimer = useCallback(() => {
      if (pomodoroIsActive) {
          // Pausing
          if (pomodoroTimerIntervalRef.current) {
              clearInterval(pomodoroTimerIntervalRef.current);
              pomodoroTimerIntervalRef.current = null;
          }
      } else {
          // Starting
           // Reset Pomodoro timer if timeLeft is 0 before starting
           if (pomodoroTimeLeft <= 0) {
               resetTimer(pomodoroMode); // Reset to current mode's duration
           }

          pomodoroTimerIntervalRef.current = setInterval(() => {
              setPomodoroTimeLeft((prevTime) => {
                  if (prevTime <= 1) {
                      clearInterval(pomodoroTimerIntervalRef.current!);
                      pomodoroTimerIntervalRef.current = null;
                      setPomodoroIsActive(false); // Ensure timer stops

                      // Handle timer completion
                      if (pomodoroMode === 'work') {
                         setPomodoroSessionsCompleted(s => s + 1);
                         setGrownCrystalsCount(c => c + 1); // Increment grown crystals
                         // Bonus OVERALL XP for completing a work session
                         addOverallXP(50, 'Pomodoro Session');
                         toast({ title: "Focus Session Complete!", description: "Time for a break. Crystal grown!", className: "osrs-box border-accent text-foreground" });

                         // Determine next mode based on settings
                         const sessions = pomodoroSessionsCompleted + 1; // Use the upcoming count
                         const nextMode = sessions % pomodoroSettings.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak';
                         if (pomodoroSettings.enableAutostart) {
                             setTimeout(() => switchPomodoroMode(nextMode), 500); // Short delay before auto-switching
                             setTimeout(() => togglePomodoroTimer(), 1000); // Short delay before auto-starting
                         } else {
                             switchPomodoroMode(nextMode);
                         }

                      } else { // Break finished
                          toast({ title: "Break Over!", description: "Ready for the next focus session?", className: "osrs-box border-primary text-foreground" });
                          if (pomodoroSettings.enableAutostart) {
                              setTimeout(() => switchPomodoroMode('work'), 500);
                              setTimeout(() => togglePomodoroTimer(), 1000);
                          } else {
                              switchPomodoroMode('work');
                          }
                      }
                      return 0; // Timer finished
                  }
                   // Add OVERALL XP during active work sessions only
                   if (pomodoroMode === 'work') {
                       // Add XP per *second* for Pomodoro work sessions
                       addOverallXP(XP_PER_SECOND, 'Pomodoro Focus');
                   }
                  return prevTime - 1;
              });
          }, 1000);
      }
      setPomodoroIsActive((prev) => !prev); // Toggle active state
  }, [pomodoroIsActive, pomodoroTimeLeft, pomodoroMode, pomodoroSessionsCompleted, pomodoroSettings, addOverallXP, toast, switchPomodoroMode, resetTimer]);


  // --- TASK MANAGEMENT FUNCTIONS ---
  const addTask = useCallback((text: string, priority: TaskPriority) => {
      if (!text.trim()) return;
      const newTask: Task = {
          id: Date.now().toString(), // Simple ID generation
          text: text.trim(),
          completed: false,
          studyTime: 0,
          isActive: false, // Newly added task is not active
          priority: priority,
          isEditing: false,
      };
      setTasks((prev) => [newTask, ...prev]); // Add to the beginning
  }, []); // No external dependencies

  const toggleTaskCompletion = useCallback((id: string) => {
      setTasks((prev) =>
          prev.map((task) => {
              if (task.id === id) {
                  const wasCompleted = task.completed;
                  const isNowComplete = !wasCompleted;
                  // Add/remove XP only when toggling
                  if (isNowComplete) {
                      addOverallXP(XP_PER_TASK_COMPLETION, `Complete: ${task.text.substring(0,10)}...`); // Add overall XP
                  }
                  // If completing an active task, stop its timer
                  if (isNowComplete && task.isActive) {
                     stopTaskTimer(id); // Pass the task ID to stop
                  }
                  return { ...task, completed: isNowComplete, isActive: false }; // Ensure isActive is false when completed/uncompleted
              }
              return task;
          })
      );
  }, [addOverallXP, stopTaskTimer]);

  const deleteTask = useCallback((id: string) => {
      setTasks((prev) => prev.filter((task) => {
           // If deleting the active task, stop the timer
           if (task.id === id && task.id === activeTaskId) { // Compare with activeTaskId state
               stopTaskTimer(id); // Pass the task ID to stop
           }
          return task.id !== id
      }));
  }, [activeTaskId, stopTaskTimer]);

  const editTask = useCallback((id: string, newText: string): boolean => {
      if (!newText.trim()) {
           toast({
             title: "Error",
             description: "Task text cannot be empty.",
           });
          return false; // Indicate failure
      }
      setTasks((prev) =>
          prev.map((task) =>
              task.id === id ? { ...task, text: newText.trim(), isEditing: false } : task
          )
      );
      return true; // Indicate success
  }, [toast]); // Depends on stable toast

 const updateTaskPriority = useCallback((id: string, priority: TaskPriority) => {
   setTasks((prev) =>
     prev.map((task) =>
       task.id === id ? { ...task, priority: priority } : task
     )
   );
 }, []); // No external dependencies

 const setTaskEditing = useCallback((id: string, isEditing: boolean) => {
   setTasks((prev) =>
     prev.map((task) =>
       task.id === id ? { ...task, isEditing: isEditing } : task
     )
   );
 }, []); // No external dependencies

  // --- SETTINGS UPDATE FUNCTION ---
  // This function is called only when the "Save Settings" button is clicked in the Settings component
  const updateSettings = useCallback((newSettings: PomodoroSettings, manualSave: boolean) => {
      // Always update the local state for immediate UI feedback (already done in Settings component)
      // setPomodoroSettings(newSettings); // This would cause the error if called directly from Settings render

      // Only save to localStorage on manual save (which is always true when this is called)
      if (manualSave) {
          setPomodoroSettings(newSettings); // Update the parent state *only* on manual save
          localStorage.setItem(FOCUSFRIEND_SETTINGS_KEY, JSON.stringify(newSettings));
          toast({
            title: "Settings Saved",
            description: "Your Pomodoro settings have been updated.",
             className: "osrs-box"
          });
           // Update the timer *after* saving and updating state,
           // if it's not active
           if (!pomodoroIsActive) {
               const currentModeDuration = getPomodoroDuration(pomodoroMode, newSettings);
               setPomodoroTimeLeft(currentModeDuration);
               setPomodoroInitialDuration(currentModeDuration);
           }
      }
       // Note: Automatic updates for timer display while editing settings are handled within the Settings component's local state.
       // The parent state (and thus the timer logic) only updates upon clicking "Save".
  }, [pomodoroIsActive, pomodoroMode, getPomodoroDuration, toast]); // Dependencies


  //------------------------------------------------
  //  SIDE‑BAR NAV CLICK HANDLERS (memoised so they don't recreate every render)
  //------------------------------------------------
  const handleOverviewClick = useCallback(() => setActiveSection("overview"), []);
  const handleStudyClick = useCallback(() => setActiveSection("study"), []);
  const handlePomodoroClick = useCallback(() => setActiveSection("pomodoro"), []);
  const handleLevelsClick = useCallback(() => setActiveSection("levels"), []);
  const handleAchievementsClick = useCallback(
    () => setActiveSection("achievements"),
    []
  );
  const handleSettingsClick = useCallback(() => setActiveSection("settings"), []);

  //------------------------------------------------
  //  MOUNT‑TIME: LOAD FROM LOCAL STORAGE
  //------------------------------------------------
  useEffect(() => {
    // --- tasks
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (stored) {
      try {
        const parsed: Omit<Task, "isActive" | "isEditing">[] = JSON.parse(stored);
        setTasks(
          parsed.map((t) => ({
            ...t,
            isActive: false, // Initialize isActive to false on load
            isEditing: false, // Initialize isEditing to false on load
            priority: t.priority || "medium",
          }))
        );
      } catch (err) {
        console.error("Failed to parse tasks", err);
      }
    } else {
       setTasks([]); // Ensure tasks is an empty array if nothing is stored
    }

    // --- xp + level
    const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
    const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
    const initialLevel = storedLevel ? parseInt(storedLevel, 10) : 1;
    setXp(storedXp ? parseFloat(storedXp) : 0);
    setLevel(initialLevel);
    setPrevLevel(initialLevel);
    setXpToNextLevel(calculateOverallXpToNextLevel(initialLevel));

    // --- pomodoro sessions + crystals
    const storedPomodoro = localStorage.getItem(
      LOCAL_STORAGE_KEY_POMODORO_SESSIONS
    );
    const storedCrystals = localStorage.getItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS);
    setPomodoroSessionsCompleted(storedPomodoro ? parseInt(storedPomodoro, 10) : 0);
    setGrownCrystalsCount(storedCrystals ? parseInt(storedCrystals, 10) : 0);

    // --- settings
    const storedSettings = localStorage.getItem(FOCUSFRIEND_SETTINGS_KEY);
    let loadedSettings = defaultSettings;
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        loadedSettings = { ...defaultSettings, ...parsed }; // Ensure all keys are present
      } catch (err) {
        console.error("Failed to parse settings", err);
        // Use default settings if parsing fails
      }
    }
    setPomodoroSettings(loadedSettings);
    // Initialize timer based on loaded or default settings
    const initialTime = getPomodoroDuration("work", loadedSettings);
    setPomodoroTimeLeft(initialTime);
    setPomodoroInitialDuration(initialTime);


    // cleanup intervals on unmount
    return () => {
      if (taskTimerIntervalRef.current) clearInterval(taskTimerIntervalRef.current);
      if (pomodoroTimerIntervalRef.current)
        clearInterval(pomodoroTimerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial mount

  //------------------------------------------------
  //  SAVE TO LOCAL STORAGE (debounced by React’s batching)
  //------------------------------------------------
  useEffect(() => {
    if (!isMounted) return;

    // Save only non-UI state for tasks
    const strippedTasks = tasks.map(({ isActive, isEditing, ...rest }) => rest);
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(strippedTasks));
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, xp.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level.toString());
    localStorage.setItem(
      LOCAL_STORAGE_KEY_POMODORO_SESSIONS,
      pomodoroSessionsCompleted.toString()
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEY_GROWN_CRYSTALS,
      grownCrystalsCount.toString()
    );
    // Settings are saved manually via the updateSettings callback

  }, [isMounted, tasks, xp, level, pomodoroSessionsCompleted, grownCrystalsCount]); // Removed prevLevel, toast dependencies

   //------------------------------------------------
   //  LEVEL UP TOAST EFFECT
   //------------------------------------------------
   useEffect(() => {
     if (isMounted && level > prevLevel) {
       // Use setTimeout to ensure toast appears after render cycle completes
       setTimeout(() => {
         toast({
           title: "Level Up!",
           description: `Congratulations! You've reached Level ${level}!`,
           className: "osrs-box border-accent text-foreground",
         });
       }, 0);
       setPrevLevel(level); // Update prevLevel *after* showing the toast
     }
   }, [level, prevLevel, isMounted, toast]); // Depend on level, prevLevel, isMounted, and toast


  //------------------------------------------------
  //  POMODORO SETTINGS EFFECT (for timer display when not active)
  //------------------------------------------------
   // Effect to update timer duration if settings change *in the parent state*
   // and the timer is NOT active
   useEffect(() => {
     if (!pomodoroIsActive) {
       const newDuration = getPomodoroDuration(pomodoroMode, pomodoroSettings);
       setPomodoroTimeLeft(newDuration);
       setPomodoroInitialDuration(newDuration);
     }
     // This effect runs when pomodoroSettings state in Home changes,
     // which happens only when the user clicks "Save Settings".
   }, [pomodoroSettings, pomodoroMode, pomodoroIsActive, getPomodoroDuration]);


  //------------------------------------------------
  //  RENDER
  //------------------------------------------------
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* ---------------- SIDEBAR ---------------- */}
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
              <PixelScrollIcon />
              <h1 className="text-xl font-semibold tracking-wider group-data-[collapsible=icon]:hidden">
                FocusFriend
              </h1>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleOverviewClick}
                  isActive={activeSection === "overview"}
                  tooltip="Overview"
                  className="text-sm"
                >
                  <LayoutDashboard strokeWidth={1.5} />
                  <span className="group-data-[collapsible=icon]:hidden">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleStudyClick}
                  isActive={activeSection === "study"}
                  tooltip="Study Tracker"
                  className="text-sm"
                >
                  <ListTodo strokeWidth={1.5} />
                  <span className="group-data-[collapsible=icon]:hidden">Study Tracker</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handlePomodoroClick}
                  isActive={activeSection === "pomodoro"}
                  tooltip="Pomodoro Timer"
                  className="text-sm"
                >
                  <Timer strokeWidth={1.5} />
                  <span className="group-data-[collapsible=icon]:hidden">Pomodoro Timer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLevelsClick}
                  isActive={activeSection === "levels"}
                  tooltip="Level System"
                  className="text-sm"
                >
                  <Award strokeWidth={1.5} />
                  <span className="group-data-[collapsible=icon]:hidden">Level System</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleAchievementsClick}
                  isActive={activeSection === "achievements"}
                  tooltip="Achievements"
                  className="text-sm"
                >
                  <Trophy strokeWidth={1.5} />
                  <span className="group-data-[collapsible=icon]:hidden">Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleSettingsClick}
                  isActive={activeSection === "settings"}
                  tooltip="Settings"
                  className="text-sm"
                >
                  <SettingsIcon strokeWidth={1.5} />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground text-center opacity-70">
              OSRS Inspired
            </p>
          </SidebarFooter>
        </Sidebar>

        {/* ---------------- MAIN PANEL ---------------- */}
        <SidebarInset className={cn("flex-1 p-3 md:p-4 bg-background text-foreground")}>
          {/* ---------- top bar ---------- */}
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
            <div />
          </div>

          {/* ---------- main grid ---------- */}
          <div className="grid grid-cols-1 gap-4 osrs-box p-3 md:p-4">
            {activeSection === "overview" && isMounted && (
              <Overview
                stats={userStats}
                xp={xp}
                xpToNextLevel={xpToNextLevel}
                tasks={tasks}
              />
            )}

            {activeSection === "study" && isMounted && (
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
                awardXp={addOverallXP} // Pass addOverallXP as awardXp
              />
            )}

            {activeSection === "pomodoro" && isMounted && (
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
                resetTimer={() => resetTimer()} // Pass resetTimer correctly
              />
            )}

            {activeSection === "levels" && isMounted && (
              <LevelSystem xp={xp} level={level} xpToNextLevel={xpToNextLevel} xpHistory={xpHistory} />
            )}

            {activeSection === "achievements" && isMounted && (
              <Achievements userStats={userStats} achievements={achievements} />
            )}

            {activeSection === "settings" && isMounted && (
              <Settings
                settings={pomodoroSettings}
                // Remove onSettingsChange prop
                onManualSave={updateSettings} // Pass the updateSettings handler for explicit save
              />
            )}

            {!isMounted && <p>Loading...</p>}
          </div>
        </SidebarInset>
      </div>{/* flex */}
    </SidebarProvider>
  );
}
