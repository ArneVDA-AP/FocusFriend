
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
  SidebarFooter
} from "@/components/ui/sidebar-wrapper";

import {
  Flower,
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
import FocusCrystal, {
  FocusCrystalProps
} from '@/components/focus-crystal';
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

// Import skill-related types and functions
import { UserSkill, SkillDefinition, calculateXpToNextLevel as calculateSkillXpToNextLevel, completeTask as completeSkillTask } from '@/lib/skills';

// Placeholder data - in a real app, this would come from an API or DB
import defaultSkillsData from "@/data/skills.json";
import defaultUserSkillsData from "@/data/user_skills.json";


//--------------------------------------------------
//  CONSTANTS & HELPERS
//--------------------------------------------------

const LOCAL_STORAGE_KEY_TASKS = "studyQuestTasks";//
const LOCAL_STORAGE_KEY_XP = "studyQuestXP"; // Overall User XP
const LOCAL_STORAGE_KEY_LEVEL = "studyQuestLevel"; // Overall User Level
const LOCAL_STORAGE_KEY_USER_SKILLS = "studyQuestUserSkills"; // User's skill progress
const LOCAL_STORAGE_KEY_POMODORO_SESSIONS = "focusFriendPomodoroSessions";
const LOCAL_STORAGE_KEY_GROWN_CRYSTALS = "focusFriendGrownCrystals";

const XP_PER_SECOND = 0.1; // Overall XP per second of *any* tracked time
const XP_PER_TASK_COMPLETION = 15; // Bonus Overall XP for completing any task
const LEVEL_UP_BASE_XP = 100; // Base Overall XP needed for level 2
const LEVEL_UP_FACTOR = 1.5; // Multiplier for overall level XP requirement


const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  enableNotifications: true,
  enableAutostart: false,
};

// Calculate overall XP needed for the next level
const calculateOverallXpToNextLevel = (currentLevel: number): number =>
  Math.floor(LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, currentLevel - 1));

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

//---------------------------------------------------
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
  const [xp, setXp] = useState(0); // Overall User XP
  const [level, setLevel] = useState(1); // Overall User Level
  const [xpToNextLevel, setXpToNextLevel] = useState(
    calculateOverallXpToNextLevel(1) // Overall XP needed
  );
  const [prevLevel, setPrevLevel] = useState(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null); // Track active task timer

  // Skill System State
   const [skillDefinitions] = useState<SkillDefinition[]>(defaultSkillsData.skills); // Static definitions
   const [userSkills, setUserSkills] = useState<UserSkill[]>([]); // User's progress in each skill

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

  //------------------------------------------------
  //  DERIVED USER STATS (Includes Overall Level)
  //------------------------------------------------
  const userStats: UserStats = useMemo(
    () => ({
      tasksCompleted: tasks.filter((t) => t.completed).length,
      totalStudyTime: tasks.reduce(
        (sum, t) => sum + (t.studyTime ?? 0),
        0
      ),
      pomodoroSessions: pomodoroSessionsCompleted,
      level, // Use overall user level here
      grownCrystals: grownCrystalsCount,
    }),
    [tasks, level, pomodoroSessionsCompleted, grownCrystalsCount]
  );

   // Derived Skill Data for UI (e.g., for Overview)
  const overviewSkillsData = useMemo(() => {
       return userSkills.map(userSkill => {
           const definition = skillDefinitions.find(def => def.id === userSkill.skill_id);
           return {
               ...userSkill,
               name: definition?.name ?? 'Unknown Skill',
               xpToNextLevel: calculateSkillXpToNextLevel(userSkill.current_level)
           };
       });
   }, [userSkills, skillDefinitions]);

  
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
      return Number(minutes ?? 0) * 60; // Ensure minutes is a number
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
    (amount: number) => {
      if (amount <= 0) return; // Avoid unnecessary updates
      setXp((prevXp) => {
        let newTotalXp = prevXp + amount;
        let currentLvl = level; // Use level state directly
        let requiredXp = xpToNextLevel; // Use xpToNextLevel state directly
        let leveledUp = false;

        while (newTotalXp >= requiredXp) {
          newTotalXp -= requiredXp;
          currentLvl += 1;
          requiredXp = calculateOverallXpToNextLevel(currentLvl); // Use overall calculator
          leveledUp = true;
        }

        if (leveledUp) {
          // Queue state updates together for batching
          setLevel(currentLvl);
          setXpToNextLevel(requiredXp);
          // Toast is a side effect, handle it after state updates (in useEffect below)
        }

        return newTotalXp; // Return the final XP value for this state update
      });
    },
    [level, xpToNextLevel] // Depend only on level and xpToNextLevel state
  );

  // --- LEVEL UP TOAST EFFECT (for overall level) ---
   useEffect(() => {
     if (isMounted && level > prevLevel) {
       // Use setTimeout to ensure toast appears after render cycle completes
       setTimeout(() => {
        toast({
           title: "Level Up!",
           description: `Congratulations! You've reached Overall Level ${level}!`,
           className: "osrs-box border-accent text-foreground",
         });
       }, 0);
       setPrevLevel(level); // Update prevLevel *after* showing the toast
     }
   }, [level, prevLevel, isMounted, toast]); // Depend on level, prevLevel, isMounted, and toast


  // --- TASK TIMER HELPERS ---
  // Define stopTaskTimer first as it's used by startTaskTimer and others
  const stopTaskTimer = useCallback(() => {
      if (taskTimerIntervalRef.current) {
          clearInterval(taskTimerIntervalRef.current);
          taskTimerIntervalRef.current = null;
      }
      setActiveTaskId(null); // Clear the active task ID
      // Update tasks state immutably
      setTasks((prevTasks) => prevTasks.map((t) => ({ ...t, isActive: false })));
  }, []); // No external dependencies needed here

  // Now define startTaskTimer
  const startTaskTimer = useCallback(
    (taskId: string) => {
      // Stop any *other* currently running task timer
      if (activeTaskId && activeTaskId !== taskId) {
          stopTaskTimer(); // Stop the previous task timer
      }

      setActiveTaskId(taskId); // Set the active task ID
      // Update tasks state immutably
      setTasks((prevTasks) => prevTasks.map((t) => ({ ...t, isActive: t.id === taskId })));

      taskTimerIntervalRef.current = setInterval(() => {
        setTasks((prevTasks) =>
          prevTasks.map((t) => {
            if (t.id === taskId && t.isActive) {
              const newTime = (t.studyTime ?? 0) + 1;
              addOverallXP(XP_PER_SECOND); // Add OVERALL XP per second
              return { ...t, studyTime: newTime };
            }
            return t;
          })
        );
      }, 1000);
    },
    [addOverallXP, stopTaskTimer, activeTaskId]
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
                         addOverallXP(50); // Bonus OVERALL XP for completing a work session
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
                       addOverallXP(XP_PER_SECOND);
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
          isActive: false,
          priority: priority,
          isEditing: false,
          skillId: 'reading', // Default skill or implement selection
      };
      setTasks((prev) => [newTask, ...prev]);
  }, []); // No external dependencies

  const toggleTaskCompletion = useCallback((id: string) => {
      setTasks((prevTasks) => {
          const updatedTasks = prevTasks.map((task) => {
              if (task.id === id) {
                  const wasCompleted = task.completed;
                  const isNowComplete = !wasCompleted;

                  if (isNowComplete) {
                      addOverallXP(XP_PER_TASK_COMPLETION); // Add overall XP

                      // Award Skill XP - Find associated skill and award XP
                      const skillIdToAward = task.skillId || 'reading'; // Use task's skill or default
                       const timeSpent = task.studyTime || 0; // Use recorded time
                       // Call the imported skill completion function
                       // It requires the current userSkills state
                       setUserSkills(currentSkills =>
                         completeSkillTask('user123', task.id, skillIdToAward, timeSpent, currentSkills)
                       );

                      // If completing an active task, stop its timer
                      if (task.isActive) {
                          stopTaskTimer();
                      }
                  }
                   // Ensure isActive is false when completed/uncompleted
                   return { ...task, completed: isNowComplete, isActive: false };
              }
              return task;
          });
          return updatedTasks; // Return the new array
      });
  }, [addOverallXP, stopTaskTimer, setUserSkills]); // Add setUserSkills dependency


 const deleteTask = useCallback((id: string) => {
      setTasks((prev) => prev.filter((task) => {
           if (task.id === id && task.id === activeTaskId) {
               stopTaskTimer();
           }
          return task.id !== id
      }));
  }, [activeTaskId, stopTaskTimer]);

  const editTask = useCallback((id: string, newText: string, newSkillId?: string): boolean => {
      if (!newText.trim()) {
           toast({
             title: "Error",
             description: "Task text cannot be empty.",
           });
          return false;
      }
      setTasks((prev) =>
          prev.map((task) =>
              task.id === id ? {
                  ...task,
                  text: newText.trim(),
                  skillId: newSkillId ?? task.skillId, // Update skill if provided
                  isEditing: false,
                  } : task
          )
      );
      return true;
  }, [toast]);

 const updateTaskPriority = useCallback((id: string, priority: TaskPriority) => {
   setTasks((prev) =>
     prev.map((task) =>
       task.id === id ? { ...task, priority: priority } : task
     )
   );
 }, []);

 const setTaskEditing = useCallback((id: string, isEditing: boolean)=> {
   setTasks((prev) =>
     prev.map((task) =>
       task.id === id ? { ...task, isEditing: isEditing } : task
     )
   );
 }, []);

  // --- SETTINGS UPDATE FUNCTION ---
  const updateSettings = useCallback((newSettings: PomodoroSettings, manualSave: boolean) => {
      if (manualSave) {
          setPomodoroSettings(newSettings);
          localStorage.setItem(FOCUSFRIEND_SETTINGS_KEY, JSON.stringify(newSettings));
          toast({
            title: "Settings Saved",
            description: "Your Pomodoro settings have been updated.",
             className: "osrs-box"
          });
          if (!pomodoroIsActive) {
               const currentModeDuration = getPomodoroDuration(pomodoroMode, newSettings);
               setPomodoroTimeLeft(currentModeDuration);
               setPomodoroInitialDuration(currentModeDuration);
           }
      }
  }, [pomodoroIsActive, pomodoroMode, getPomodoroDuration, toast]);


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
    // --- tasks ---
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (storedTasks) {
      try {
        const parsed: Omit<Task, "isActive" | "isEditing">[] = JSON.parse(storedTasks);
        setTasks(
          parsed.map((t) => ({
            ...t,
            isActive: false,
            isEditing: false,
            priority: t.priority || "medium",
             skillId: t.skillId || 'reading', // Ensure skillId exists
          }))
        );
      } catch (err) {
        console.error("Failed to parse tasks", err);
        setTasks([]); // Set to empty array on error
      }
    } else {
       setTasks([]);
    }

    // --- OVERALL xp + level ---
    const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
    const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
    const initialLevel = storedLevel ? parseInt(storedLevel, 10) : 1;
    setXp(storedXp ? parseFloat(storedXp) : 0);
    setLevel(initialLevel);
    setPrevLevel(initialLevel);
    setXpToNextLevel(calculateOverallXpToNextLevel(initialLevel));

     // --- USER SKILLS ---
     const storedUserSkills = localStorage.getItem(LOCAL_STORAGE_KEY_USER_SKILLS);
     if (storedUserSkills) {
         try {
             const parsedSkills: UserSkill[] = JSON.parse(storedUserSkills);
             // Basic validation: Ensure it's an array
             if (Array.isArray(parsedSkills)) {
                  // You might add more validation here, e.g., check required fields
                 setUserSkills(parsedSkills);
             } else {
                  console.error("Stored user skills is not an array, using default.");
                  setUserSkills(defaultUserSkillsData.user_skills); // Fallback
             }
         } catch (err) {
             console.error("Failed to parse user skills, using default.", err);
             setUserSkills(defaultUserSkillsData.user_skills); // Fallback
         }
     } else {
         // Initialize with default skills if nothing is stored
         setUserSkills(defaultUserSkillsData.user_skills);
     }

    // --- pomodoro sessions + crystals ---
    const storedPomodoro = localStorage.getItem(
      LOCAL_STORAGE_KEY_POMODORO_SESSIONS
    );
    const storedCrystals = localStorage.getItem(LOCAL_STORAGE_KEY_GROWN_CRYSTALS);
    setPomodoroSessionsCompleted(storedPomodoro ? parseInt(storedPomodoro, 10) : 0);
    setGrownCrystalsCount(storedCrystals ? parseInt(storedCrystals, 10) : 0);

    // --- settings ---
    const storedSettings = localStorage.getItem(FOCUSFRIEND_SETTINGS_KEY);
    let loadedSettings = defaultSettings;
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        loadedSettings = { ...defaultSettings, ...parsed }; // Ensure all keys are present
      } catch (err) {
        console.error("Failed to parse settings", err);
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

    // Save tasks (stripped)
    const strippedTasks = tasks.map(({ isActive, isEditing, ...rest }) => rest);
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(strippedTasks));

    // Save overall XP and Level
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, xp.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level.toString());

    // Save User Skills
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_SKILLS, JSON.stringify(userSkills));

    // Save Pomodoro stats
    localStorage.setItem(
      LOCAL_STORAGE_KEY_POMODORO_SESSIONS,
      pomodoroSessionsCompleted.toString()
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEY_GROWN_CRYSTALS,
      grownCrystalsCount.toString()
    );
    // Settings are saved manually via the updateSettings callback

  }, [isMounted, tasks, xp, level, userSkills, pomodoroSessionsCompleted, grownCrystalsCount]);


   //------------------------------------------------
   //  POMODORO SETTINGS EFFECT (for timer display when not active)
   //------------------------------------------------
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
                {activeSection === "levels" && "Overall Progression"}
                {activeSection === "achievements" && "Achievements Log"}
                {activeSection === "settings" && "Pomodoro Settings"}
              </h2>
            </div>
            <div />
          </div>

          <div className="grid grid-cols-1 gap-4 osrs-box p-3 md:p-4">
            {activeSection === "overview" && isMounted && (
              <>
              {console.log("Overview is", Overview)}
              <Overview
              stats={userStats}
              xp={xp}
              xpToNextLevel={xpToNextLevel}
              tasks={tasks}
              skills={overviewSkillsData}
              />
              </>
            )}
            
            {activeSection === "study" && isMounted && (
              <StudyTracker
                tasks={tasks}
                // Pass overall XP/Level for display (optional, could show skill progress instead)
                xp={xp}
                level={level}
                xpToNextLevel={xpToNextLevel}
                // Task management functions
                addTask={addTask}
                toggleTaskCompletion={toggleTaskCompletion}
                deleteTask={deleteTask}
                editTask={editTask}
                updateTaskPriority={updateTaskPriority}
                startTaskTimer={startTaskTimer}
                stopTaskTimer={stopTaskTimer}
                setTaskEditing={setTaskEditing}
                activeTaskId={activeTaskId}
                // Provide skill definitions for selection
                skillDefinitions={skillDefinitions}
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
                // Pass isGrowing prop
                isGrowing={pomodoroMode === 'work' && pomodoroIsActive}
                
                toggleTimer={togglePomodoroTimer}
                resetTimer={() => resetTimer()}
              />
            )}
                        
            {activeSection === "levels" && isMounted && (
               // Display Overall Level progression
              <LevelSystem xp={xp} level={level} xpToNextLevel={xpToNextLevel} />
            )}
                        
            {activeSection === "achievements" && isMounted && (
              <Achievements userStats={userStats} achievements={achievements} />
            )}
                        
            
            {activeSection === "settings" && isMounted && (
             <Settings
                settings={pomodoroSettings}
                onManualSave={updateSettings}
              />
            )}

            {!isMounted && <p>Loading...</p>}
          </div>
        </SidebarInset>
      </div>{/* flex */}
    </SidebarProvider>
  );
}

// Add missing skillId property to Task interface
declare module './study-tracker' {
    interface Task {
        skillId?: string; // Optional: Associate task with a skill
    }
}
