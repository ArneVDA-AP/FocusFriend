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
  const { toast } = useToast();

  const calculateXpToNextLevel = (currentLevel: number) => {
    return Math.floor(LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, currentLevel - 1));
  };

   const dispatchStorageUpdateEvent = () => {
    window.dispatchEvent(new CustomEvent('taskUpdate'));
    window.dispatchEvent(new CustomEvent('xpUpdate'));
  };

  // Load data from localStorage
  useEffect(() => {
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (storedTasks) {
      const parsedTasks: Omit<Task, 'isEditing'>[] = JSON.parse(storedTasks);
      // Ensure tasks loaded from storage don't start active or editing, and have priority
      setTasks(parsedTasks.map(task => ({
        ...task,
        isActive: false,
        isEditing: false,
        priority: task.priority || 'medium' // Default priority if missing
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
      setXpToNextLevel(calculateXpToNextLevel(parsedLevel));
    } else {
      setXpToNextLevel(calculateXpToNextLevel(1));
    }
  }, []);

  // Save data to localStorage and dispatch update event
  useEffect(() => {
    // Don't save isEditing state to localStorage
    const tasksToSave = tasks.map(({ isEditing, ...rest }) => rest);
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasksToSave));
    dispatchStorageUpdateEvent(); // Notify other components
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, xp.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level.toString());
    dispatchStorageUpdateEvent(); // Notify other components
  }, [xp, level]);

  const addXP = useCallback((amount: number) => {
    setXp(prevXp => {
      const newXp = prevXp + amount;
      let currentLevel = level;
      let requiredXp = xpToNextLevel;
      let accumulatedXp = newXp;

      while (accumulatedXp >= requiredXp) {
        accumulatedXp -= requiredXp;
        currentLevel += 1;
        requiredXp = calculateXpToNextLevel(currentLevel);
        toast({
          title: "Level Up!",
          description: `Congratulations! You've reached Level ${currentLevel}!`,
          variant: "default", // Use gold accent potentially
           className: "border-accent text-foreground",
        });
      }

      if (currentLevel > level) {
        setLevel(currentLevel);
        setXpToNextLevel(requiredXp);
        return accumulatedXp; // Return remaining XP after level ups
      }

      return newXp; // Return updated XP if no level up
    });
  }, [level, xpToNextLevel, toast]);


  const startTimer = useCallback((taskId: string) => {
    if (timer) clearInterval(timer); // Clear existing timer

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
            addXP(XP_PER_SECOND); // Add XP every second
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

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);

  const addTask = () => {
    if (newTaskText.trim() === '') {
      toast({
        title: "Task cannot be empty",
        variant: "destructive",
      });
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
    setTasks([newTask, ...tasks]); // Add to the top
    setNewTaskText('');
    setNewTaskPriority('medium'); // Reset priority
    toast({
      title: "Task Added",
      description: `"${newTask.text}" assigned ${newTask.priority} priority.`,
      className: "border-primary text-foreground",
    });
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };
          if (updatedTask.completed) {
            if(task.isActive) {
              stopTimer();
            }
            addXP(XP_PER_TASK_COMPLETION);
            toast({
              title: "Task Completed!",
              description: `+${XP_PER_TASK_COMPLETION} XP! "${updatedTask.text}"`,
              action: <CheckCircle className="text-accent" />, // Accent color for success
               className: "border-accent text-foreground",
            });
          } else {
             toast({
              title: "Task Reopened",
              description: `"${updatedTask.text}" marked as incomplete.`,
               className: "border-secondary text-foreground",
            });
          }
          return updatedTask;
        }
        return task;
      })
    );
  };

   const startEditing = (id: string) => {
    setTasks(tasks.map(task => {
        if (task.id === id) {
            setEditingTaskText(task.text); // Set text for the input field
            return { ...task, isEditing: true };
        }
        return { ...task, isEditing: false }; // Ensure only one task is edited at a time
    }));
  };

  const cancelEditing = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, isEditing: false } : task));
    setEditingTaskText(''); // Clear editing text
  };

  const saveTask = (id: string) => {
     if (editingTaskText.trim() === '') {
      toast({
        title: "Task cannot be empty",
        variant: "destructive",
      });
      return;
    };
     setTasks(tasks.map(task => task.id === id ? { ...task, text: editingTaskText, isEditing: false } : task));
     setEditingTaskText('');
     toast({
        title: "Task Updated",
        className: "border-primary text-foreground",
     });
  };


  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete && taskToDelete.isActive) {
      stopTimer();
    }
    setTasks(tasks.filter(task => task.id !== id));
     toast({
      title: "Task Deleted",
      description: `"${taskToDelete?.text}" removed.`,
      variant: "destructive",
    });
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
      case 'high': return 'border-destructive'; // Red border for high
      case 'medium': return 'border-accent'; // Yellow/Gold border for medium
      case 'low': return 'border-primary'; // Green border for low
      default: return 'border-border';
    }
  };

  const levelProgress = (xp / xpToNextLevel) * 100;

  const sortedTasks = [...tasks].sort((a, b) => {
     // Sort by completion status first (incomplete first)
     if (a.completed !== b.completed) {
       return a.completed ? 1 : -1;
     }
     // Then sort by priority (high > medium > low)
     const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
     if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
       return priorityOrder[b.priority] - priorityOrder[a.priority];
     }
     // Finally, sort by creation time (newest first - assuming ID is timestamp based)
     return parseInt(b.id, 10) - parseInt(a.id, 10);
   });

  return (
    <div className="space-y-6">
       {/* Progress Card remains similar */}
       <Card className="shadow-md border border-border bg-card/80">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
           <CardDescription>Level {level} - Keep going!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">Level {level}</span>
                <span className="text-xs text-muted-foreground">{Math.round(currentXp)} / {xpToNextLevel} XP</span>
            </div>
          <Progress value={levelProgress} className="w-full h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-yellow-600" />
        </CardContent>
      </Card>

      <Card className="shadow-md border border-border bg-card/80">
        <CardHeader>
          <CardTitle>Manage Your Study Tasks</CardTitle>
          <CardDescription>Add, track, and complete your study goals.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add Task Form */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6 border-b border-border pb-4">
            <Input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter a new study task..."
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              aria-label="New Task Input"
              className="flex-grow bg-input border-input focus:border-primary"
            />
             <div className="flex gap-2">
                <Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)}>
                    <SelectTrigger className="w-[120px] bg-input border-input focus:border-primary">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={addTask} aria-label="Add Task" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
             </div>
          </div>

          {/* Task List */}
          <ul className="space-y-2">
            {sortedTasks.length === 0 && <p className="text-muted-foreground text-center py-6 text-sm">Your quest log is empty. Add a task to begin!</p>}
            {sortedTasks.map((task) => (
              <li
                key={task.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-sm border-l-4 transition-colors duration-200",
                  getPriorityColor(task.priority),
                  task.completed ? 'bg-muted/30 border-muted/50' : 'bg-card/90 hover:bg-card',
                  task.isActive ? 'ring-1 ring-accent shadow-md' : 'shadow-sm'
                )}
              >
                 {/* Drag Handle - Future Feature */}
                {/* <GripVertical className="h-5 w-5 text-muted-foreground mr-2 cursor-grab active:cursor-grabbing" /> */}

                 <div className="flex items-center gap-3 flex-1 min-w-0">
                   <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    aria-label={`Mark task ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                   />
                   {task.isEditing ? (
                        <Input
                           type="text"
                           value={editingTaskText}
                           onChange={(e) => setEditingTaskText(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && saveTask(task.id)}
                           onBlur={() => saveTask(task.id)} // Save on blur
                           autoFocus
                           className="h-8 flex-1 bg-input border-primary text-sm"
                         />
                   ) : (
                      <label
                         htmlFor={`task-${task.id}`}
                        className={cn(
                          "flex-1 truncate cursor-pointer text-sm",
                           task.completed ? 'line-through text-muted-foreground/70' : 'text-foreground'
                         )}
                        title={task.text}
                      >
                        {task.text}
                      </label>
                   )}
                 </div>

                 <div className="flex items-center gap-1 sm:gap-2 ml-2 flex-shrink-0">
                    {task.isEditing ? (
                       <>
                        <Button variant="ghost" size="icon" onClick={() => saveTask(task.id)} aria-label="Save task" className="text-primary hover:text-primary hover:bg-primary/10 h-7 w-7">
                            <Save className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => cancelEditing(task.id)} aria-label="Cancel editing" className="text-muted-foreground hover:text-foreground hover:bg-muted/20 h-7 w-7">
                             <X className="h-4 w-4" />
                         </Button>
                        </>
                    ) : (
                        <>
                           {/* Priority Indicator Icon (Optional) */}
                          <Flag size={14} className={cn(
                               'hidden sm:inline-block', // Hide on small screens for space
                               task.priority === 'high' && 'text-destructive',
                               task.priority === 'medium' && 'text-accent',
                               task.priority === 'low' && 'text-primary/80'
                           )} />

                          <span className="text-xs text-muted-foreground min-w-[55px] text-right flex items-center gap-1 tabular-nums">
                            <Clock size={11} /> {formatTime(task.studyTime)}
                          </span>

                          {!task.completed && (
                            task.isActive ? (
                              <Button variant="outline" size="icon" onClick={stopTimer} aria-label={`Pause timer for task ${task.text}`} className="border-accent text-accent hover:bg-accent/10 h-7 w-7">
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="outline" size="icon" onClick={() => startTimer(task.id)} aria-label={`Start timer for task ${task.text}`} className="border-primary text-primary hover:bg-primary/10 h-7 w-7">
                                <Play className="h-4 w-4" />
                              </Button>
                            )
                          )}

                           <Button variant="ghost" size="icon" onClick={() => startEditing(task.id)} aria-label={`Edit task ${task.text}`} className="text-muted-foreground hover:text-foreground hover:bg-muted/20 h-7 w-7">
                             <Edit2 className="h-4 w-4" />
                           </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-7 w-7" aria-label={`Delete task ${task.text}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
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
         {/* Optional Footer for bulk actions */}
        {/* <CardFooter className="pt-4 border-t border-border justify-end">
            <Button variant="outline" size="sm">Clear Completed</Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}

// Helper function to get buttonVariants class names (Keep as is)
import { cva } from "class-variance-authority";
// const buttonVariants = cva( ... ); // (Keep the definition)
