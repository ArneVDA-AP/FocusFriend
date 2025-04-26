'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Play, Pause, CheckCircle, Clock } from 'lucide-react';
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

interface Task {
  id: string;
  text: string;
  completed: boolean;
  studyTime: number; // in seconds
  isActive: boolean;
}

const LOCAL_STORAGE_KEY_TASKS = 'studyQuestTasks';
const LOCAL_STORAGE_KEY_XP = 'studyQuestXP';
const LOCAL_STORAGE_KEY_LEVEL = 'studyQuestLevel';

const XP_PER_SECOND = 0.1; // XP gained per second of study
const XP_PER_TASK_COMPLETION = 10; // Bonus XP for completing a task
const LEVEL_UP_BASE_XP = 100;
const LEVEL_UP_FACTOR = 1.5;

export default function StudyTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(LEVEL_UP_BASE_XP);
  const { toast } = useToast();

  const calculateXpToNextLevel = (currentLevel: number) => {
    return Math.floor(LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_FACTOR, currentLevel - 1));
  };

  // Load data from localStorage
  useEffect(() => {
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS);
    if (storedTasks) {
      const parsedTasks: Task[] = JSON.parse(storedTasks);
      // Ensure tasks loaded from storage don't start active
      setTasks(parsedTasks.map(task => ({ ...task, isActive: false })));
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

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_XP, xp.toString());
    localStorage.setItem(LOCAL_STORAGE_KEY_LEVEL, level.toString());
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
    };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
    toast({
      title: "Task Added",
      description: `"${newTask.text}" has been added.`,
    });
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed };
          if (updatedTask.completed) {
             // If task is marked complete, stop the timer if it was active for this task
            if(task.isActive) {
              stopTimer();
            }
            addXP(XP_PER_TASK_COMPLETION); // Add bonus XP for completion
            toast({
              title: "Task Completed!",
              description: `"${updatedTask.text}" marked as complete. +${XP_PER_TASK_COMPLETION} XP!`,
              action: <CheckCircle className="text-green-500" />,
            });
          } else {
            // If task is marked incomplete, potentially remove bonus XP if needed (optional)
             toast({
              title: "Task Incomplete",
              description: `"${updatedTask.text}" marked as incomplete.`,
            });
          }
          return updatedTask;
        }
        return task;
      })
    );
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (taskToDelete && taskToDelete.isActive) {
      stopTimer(); // Stop timer if the deleted task was active
    }
    setTasks(tasks.filter(task => task.id !== id));
     toast({
      title: "Task Deleted",
      description: `"${taskToDelete?.text}" has been deleted.`,
      variant: "destructive",
    });
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
  };

  const levelProgress = (xp / xpToNextLevel) * 100;

  return (
    <div className="space-y-6">
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Level {level}</span>
                <span className="text-sm text-muted-foreground">{Math.round(xp)} / {xpToNextLevel} XP</span>
            </div>
          <Progress value={levelProgress} className="w-full h-2 [&>div]:bg-accent" />
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Manage Your Study Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter a new study task"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              aria-label="New Task Input"
            />
            <Button onClick={addTask} aria-label="Add Task">
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
          <ul className="space-y-3">
            {tasks.length === 0 && <p className="text-muted-foreground text-center py-4">No tasks yet. Add some to get started!</p>}
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${task.completed ? 'bg-muted/50 border-dashed' : 'bg-card'} ${task.isActive ? 'border-primary ring-2 ring-primary/50' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    aria-label={`Mark task ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
                  />
                  <label
                     htmlFor={`task-${task.id}`}
                    className={`flex-1 truncate cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                    title={task.text}
                  >
                    {task.text}
                  </label>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                   <span className="text-xs text-muted-foreground min-w-[60px] text-right flex items-center gap-1">
                     <Clock size={12} /> {formatTime(task.studyTime)}
                   </span>
                  {!task.completed && (
                    task.isActive ? (
                      <Button variant="outline" size="icon" onClick={stopTimer} aria-label={`Pause timer for task ${task.text}`}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="icon" onClick={() => startTimer(task.id)} aria-label={`Start timer for task ${task.text}`}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )
                  )}
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label={`Delete task ${task.text}`}>
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
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get buttonVariants class names
import { cva } from "class-variance-authority";
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);