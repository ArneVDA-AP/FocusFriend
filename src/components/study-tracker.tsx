'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Play, Pause, CheckCircle, Clock, Edit2, Save, X, GripVertical, Flag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  studyTime: number; // in seconds
  isActive: boolean;
  priority: TaskPriority; // Added priority
  isEditing: boolean; // Added editing state
}

const LOCAL_STORAGE_KEY_TASKS = 'studyQuestTasks';
const LOCAL_STORAGE_KEY_XP = 'studyQuestXP';
const LOCAL_STORAGE_KEY_LEVEL = 'studyQuestLevel';

const XP_PER_SECOND = 0.1; // XP gained per second of study
const XP_PER_TASK_COMPLETION = 15; // Increased Bonus XP
const LEVEL_UP_BASE_XP = 100;
const LEVEL_UP_FACTOR = 1.5;

export default function StudyTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [editingTaskText, setEditingTaskText] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(LEVEL_UP_BASE_XP);
  const [prevLevel, setPrevLevel] = useState<number>(1); // Track previous level for level-up toast
  const { toast } = useToast();

  const calculateXpToNextLevel = useCallback((currentLevel: number) => {
    return Math.floor(LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, currentLevel - 1));
  },[]);

   const dispatchStorageUpdateEvent = () => {
    window.dispatchEvent(new CustomEvent('taskUpdate'));
    window.dispatchEvent(new CustomEvent('xpUpdate'));
  };

  // Load data from localStorage
  useEffect(() => {
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (storedTasks) {
      const parsedTasks: Omit<Task, 'isEditing'>[] = JSON.parse(storedTasks);
      setTasks(parsedTasks.map(task => ({
        ...task,
        isActive: false,
        isEditing: false,
        priority: task.priority || 'medium'
      })));
    }

    const storedXp = localStorage.getItem(LOCAL_STORAGE_KEY_XP);
    if (storedXp) {
      setXp(parseFloat(storedXp));
    }

    const storedLevel = localStorage.getItem(LOCAL_STORAGE_KEY_LEVEL);
    if (storedLevel) {
      const parsedLevel = parseInt(storedLevel, 10);
      setLevel(parsedLevel);
      setPrevLevel(parsedLevel);
      setXpToNextLevel(calculateXpToNextLevel(parsedLevel));
    } else {
      setXpToNextLevel(calculateXpToNextLevel(1));
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // calculateXpToNextLevel is memoized

  // Save data to localStorage and dispatch update event
  useEffect(() => {
    const tasksToSave = tasks.map(({ isEditing, ...rest }) => rest);
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasksToSave));
    dispatchStorageUpdateEvent();
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, xp.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level.toString());

    if (level > prevLevel) {
      // Use setTimeout to ensure toast is called outside of the render cycle
      setTimeout(() => {
        toast({
          title: "Level Up!",
          description: `Congratulations! You've reached Level ${level}!`,
          variant: "default",
          className: "osrs-box border-accent text-foreground", // OSRS style toast
        });
      }, 0); // Delay of 0 ms pushes it to the next tick
      setPrevLevel(level);
    }
     dispatchStorageUpdateEvent(); // Dispatch event regardless of level up
  }, [xp, level, prevLevel, toast]); // Depend on xp, level, prevLevel

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
        // The level up toast is handled by the useEffect watching [level]
        return accumulatedXp; // Return the remaining XP after leveling up
      }

      return newXp; // Return the new XP if no level up
    });
  }, [level, xpToNextLevel, calculateXpToNextLevel]);


  const startTimer = useCallback((taskId: string) => {
    if (timer) clearInterval(timer);

    setActiveTaskId(taskId);
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isActive: true } : { ...task, isActive: false }
      )
    );

    const newTimer = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.id === taskId && task.isActive) {
            const newStudyTime = task.studyTime + 1;
            addXP(XP_PER_SECOND);
            return { ...task, studyTime: newStudyTime };
          }
          return task;
        })
      );
    }, 1000);
    setTimer(newTimer);
  }, [timer, addXP]);

  const stopTimer = useCallback(() => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === activeTaskId ? { ...task, isActive: false } : task
      )
    );
    setActiveTaskId(null);
  }, [timer, activeTaskId]);

  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  const addTask = () => {
    if (newTaskText.trim() === '') {
       setTimeout(() => toast({
        title: "Task cannot be empty",
        variant: "destructive",
         className: "osrs-box border-destructive", // OSRS style toast
      }), 0);
      return;
    };
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      studyTime: 0,
      isActive: false,
      priority: newTaskPriority,
      isEditing: false,
    };
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
    setNewTaskPriority('medium');
     setTimeout(() => toast({
        title: "Task Added",
        description: `"${newTask.text}" assigned ${newTask.priority} priority.`,
        className: "osrs-box border-primary text-foreground", // OSRS style toast
     }), 0);
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
            stopTimer();
          }

          if (updatedTask.completed) {
             addXP(XP_PER_TASK_COMPLETION);
          } else {
              // Optionally subtract XP if task is uncompleted? Decided against it for now.
          }
          return updatedTask;
        }
        return task;
      })
    );

    // Use setTimeout to avoid state update during render
     setTimeout(() => {
        if (completed) {
            toast({
                title: "Task Completed!",
                description: `+${XP_PER_TASK_COMPLETION} XP! "${taskText}"`,
                action: <CheckCircle className="text-accent" strokeWidth={1.5} />,
                className: "osrs-box border-accent text-foreground", // OSRS style toast
            });
        } else {
            toast({
                title: "Task Reopened",
                description: `"${taskText}" marked as incomplete.`,
                className: "osrs-box border-secondary text-foreground", // OSRS style toast
            });
        }
    }, 0);
  };

   const startEditing = (id: string) => {
    setTasks(tasks.map(task => {
        if (task.id === id) {
            setEditingTaskText(task.text);
            return { ...task, isEditing: true };
        }
        return { ...task, isEditing: false }; // Ensure other tasks are not editing
    }));
  };

  const cancelEditing = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, isEditing: false } : task));
    setEditingTaskText('');
  };

  const saveTask = (id: string) => {
     if (editingTaskText.trim() === '') {
        setTimeout(() => toast({
            title: "Task cannot be empty",
            variant: "destructive",
            className: "osrs-box border-destructive", // OSRS style toast
        }), 0);
        // Don't cancel editing, let user fix it
        return;
    };
     setTasks(tasks.map(task => task.id === id ? { ...task, text: editingTaskText, isEditing: false } : task));
     setEditingTaskText('');
      setTimeout(() => toast({
        title: "Task Updated",
         className: "osrs-box border-primary text-foreground", // OSRS style toast
     }), 0);
  };


  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete && taskToDelete.isActive) {
      stopTimer();
    }
    setTasks(tasks.filter(task => task.id !== id));
     setTimeout(() => toast({
      title: "Task Deleted",
      description: `"${taskToDelete?.text}" removed.`,
      variant: "destructive",
      className: "osrs-box border-destructive", // OSRS style toast
    }), 0);
  };

   const changePriority = (id: string, priority: TaskPriority) => {
     setTasks(tasks.map(task => task.id === id ? { ...task, priority } : task));
   };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'high': return 'border-l-destructive'; // Red border for high
      case 'medium': return 'border-l-accent'; // Yellow/Gold border for medium
      case 'low': return 'border-l-primary'; // Green border for low
      default: return 'border-l-border';
    }
  };

  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;


  const sortedTasks = [...tasks].sort((a, b) => {
     // Sort by completion status (incomplete first)
     if (a.completed !== b.completed) {
       return a.completed ? 1 : -1;
     }
     // Then sort by priority (high first)
     const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
     if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
       return priorityOrder[b.priority] - priorityOrder[a.priority];
     }
      // Finally, sort by creation time (newest first - higher ID)
     return parseInt(b.id, 10) - parseInt(a.id, 10);
   });

  return (
    <div className="space-y-4">
       {/* Progress Card */}
       <Card className="osrs-box">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-base font-semibold">Your Progress</CardTitle>
           <CardDescription>Level {level} - Keep going!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 osrs-inner-bevel p-2 mx-4 mb-3 rounded-sm">
            <div className="flex justify-between items-center mb-1 px-1">
                <span className="font-medium text-sm">Level {level}</span>
                 <span className="text-xs text-muted-foreground">{Math.round(xp)} / {xpToNextLevel} XP</span>
            </div>
          {/* OSRS-style progress bar */}
           <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
             <div
                className="h-full bg-gradient-to-b from-accent via-yellow-500 to-accent transition-all duration-300 ease-out rounded-full border-r border-black/30"
                style={{ width: `${levelProgress}%` }}
                role="progressbar"
                aria-valuenow={levelProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`XP progress: ${Math.round(levelProgress)}%`}
             />
           </div>
        </CardContent>
      </Card>

      {/* Task Management Card */}
      <Card className="osrs-box">
        <CardHeader className="pb-3 pt-3 px-4">
          <CardTitle className="text-base font-semibold">Manage Your Study Tasks</CardTitle>
          <CardDescription>Add, track, and complete your study goals.</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          {/* Add Task Form */}
          <div className="flex flex-col sm:flex-row gap-2 mb-3 border-b border-border/50 pb-3">
            <Input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter a new study task..."
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              aria-label="New Task Input"
              className="flex-grow osrs-inner-bevel" // OSRS style input
            />
             <div className="flex gap-2 flex-shrink-0">
                <Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)}>
                    <SelectTrigger className="w-[110px] osrs-inner-bevel text-xs">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="osrs-box">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={addTask} aria-label="Add Task" className="text-sm px-3">
                    <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={2.5} /> Add
                </Button>
             </div>
          </div>

          {/* Task List */}
          <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1 osrs-inner-bevel bg-black/10 p-1.5 rounded-sm">
            {sortedTasks.length === 0 && <p className="text-muted-foreground text-center py-8 text-sm italic">Your quest log is empty. Add a task to begin!</p>}
            {sortedTasks.map((task) => (
              <li
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-1.5 rounded-sm border-l-4 transition-colors duration-150 bg-card/80 hover:bg-card", // OSRS-like item background
                  getPriorityColor(task.priority),
                   task.completed ? 'border-muted/60 opacity-60 hover:opacity-80' : 'border-l', // Style completed tasks
                  task.isActive ? 'ring-1 ring-inset ring-accent/80 shadow-inner shadow-accent/10' : '' // Style active task
                )}
              >
                 <div className="flex items-center gap-2 flex-1 min-w-0">
                   <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    aria-label={`Mark task ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
                    className={cn(
                        "border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary/80 data-[state=checked]:text-primary-foreground mt-0.5",
                         task.completed && "border-muted/80 data-[state=checked]:bg-muted data-[state=checked]:border-muted/80 data-[state=checked]:text-muted-foreground/60" // Style completed checkbox
                    )}
                   />
                   {task.isEditing ? (
                        <Input
                           type="text"
                           value={editingTaskText}
                           onChange={(e) => setEditingTaskText(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && saveTask(task.id)}
                           //onBlur={() => cancelEditing(task.id)} // Optional: Cancel on blur
                           autoFocus
                           className={cn("h-7 flex-1 osrs-inner-bevel text-sm px-1.5", task.completed && "line-through text-muted-foreground/70")}
                         />
                   ) : (
                      <label
                         htmlFor={`task-${task.id}`}
                        className={cn(
                          "flex-1 truncate cursor-pointer text-sm font-medium", // Slightly bolder text
                           task.completed ? 'line-through text-muted-foreground/70' : 'text-foreground hover:text-foreground/90'
                         )}
                        title={task.text}
                      >
                        {task.text}
                      </label>
                   )}
                 </div>

                 <div className="flex items-center gap-1 sm:gap-1.5 ml-1 flex-shrink-0">
                    {task.isEditing ? (
                       <>
                        <Button variant="ghost" size="icon" onClick={() => saveTask(task.id)} aria-label="Save task" className="text-primary hover:text-primary hover:bg-primary/10 h-6 w-6">
                            <Save className="h-3.5 w-3.5" strokeWidth={2} />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => cancelEditing(task.id)} aria-label="Cancel editing" className="text-muted-foreground/70 hover:text-foreground hover:bg-muted/20 h-6 w-6">
                             <X className="h-3.5 w-3.5" strokeWidth={2} />
                         </Button>
                        </>
                    ) : (
                        <>
                           {/* Priority Flag - kept simple */}
                           <Flag size={11} strokeWidth={2} className={cn(
                               'hidden sm:inline-block opacity-70 flex-shrink-0',
                               task.completed && 'opacity-40',
                               task.priority === 'high' && 'text-destructive',
                               task.priority === 'medium' && 'text-accent/90',
                               task.priority === 'low' && 'text-primary/80'
                           )} />

                          {/* Study Time */}
                          <span className={cn(
                              "text-xs text-muted-foreground min-w-[50px] text-right flex items-center gap-0.5 tabular-nums mr-1",
                              task.completed && "opacity-60"
                          )}>
                            <Clock size={10} strokeWidth={1.5} /> {formatTime(task.studyTime)}
                          </span>

                          {/* Timer Buttons */}
                          {!task.completed && (
                            task.isActive ? (
                              <Button variant="outline" size="icon" onClick={stopTimer} aria-label={`Pause timer for task ${task.text}`} className="border-accent/70 text-accent/90 hover:bg-accent/10 hover:text-accent h-6 w-6">
                                <Pause className="h-3.5 w-3.5" strokeWidth={2.5} />
                              </Button>
                            ) : (
                              <Button variant="outline" size="icon" onClick={() => startTimer(task.id)} aria-label={`Start timer for task ${task.text}`} className="border-primary/60 text-primary/90 hover:bg-primary/10 hover:text-primary h-6 w-6">
                                <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
                              </Button>
                            )
                          )}

                          {/* Edit Button */}
                           <Button variant="ghost" size="icon" onClick={() => startEditing(task.id)} aria-label={`Edit task ${task.text}`} className="text-muted-foreground/70 hover:text-foreground hover:bg-muted/20 h-6 w-6">
                             <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
                           </Button>

                          {/* Delete Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-6 w-6" aria-label={`Delete task ${task.text}`}>
                                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="osrs-box">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the task "{task.text}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTask(task.id)} className={buttonVariants({ variant: "destructive" })}>
                                   Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </>
                   )}
                 </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
