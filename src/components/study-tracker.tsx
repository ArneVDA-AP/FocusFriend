
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Play, Pause, Edit2, Save, X, Clock, Flag } from 'lucide-react';
// Removed Progress import as the custom OSRS bar is used
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

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  studyTime: number; // in seconds
  isActive: boolean; // Controlled by parent
  priority: TaskPriority;
  isEditing: boolean; // UI state managed locally or by parent
}

interface StudyTrackerProps {
  tasks: Task[];
  xp: number;
  level: number;
  xpToNextLevel: number;
  addTask: (text: string, priority: TaskPriority) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, newText: string) => boolean; // Returns success/failure
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  startTaskTimer: (id: string) => void;
  stopTaskTimer: () => void;
  setTaskEditing: (id: string, isEditing: boolean) => void;
  activeTaskId: string | null; // To show correct play/pause state based on parent state
}

export default function StudyTracker({
  tasks,
  xp,
  level,
  xpToNextLevel,
  addTask,
  toggleTaskCompletion,
  deleteTask,
  editTask,
  updateTaskPriority,
  startTaskTimer,
  stopTaskTimer,
  setTaskEditing,
  activeTaskId, // Receive activeTaskId from parent
}: StudyTrackerProps) {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [editingTaskText, setEditingTaskText] = useState(''); // Local state for the input field during edit

  const handleAddTask = () => {
    addTask(newTaskText, newTaskPriority);
    setNewTaskText(''); // Reset local input state
    setNewTaskPriority('medium'); // Reset local priority state
  };

  const handleStartEditing = (task: Task) => {
    setEditingTaskText(task.text); // Populate local edit input state
    setTaskEditing(task.id, true); // Inform parent to set editing state
  };

  const handleSaveTask = (id: string) => {
      const success = editTask(id, editingTaskText); // Call parent's edit function
      if (success) {
          setEditingTaskText(''); // Clear local edit input state on success
      }
      // Parent's editTask function handles setting isEditing back to false
  };

  const handleCancelEditing = (id: string) => {
    setTaskEditing(id, false); // Inform parent to cancel editing
    setEditingTaskText(''); // Clear local edit input state
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
      case 'high': return 'border-l-destructive';
      case 'medium': return 'border-l-accent';
      case 'low': return 'border-l-primary';
      default: return 'border-l-border';
    }
  };

  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;

  const sortedTasks = [...tasks].sort((a, b) => {
     if (a.completed !== b.completed) {
       return a.completed ? 1 : -1;
     }
     const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
     if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
       return priorityOrder[b.priority] - priorityOrder[a.priority];
     }
     // Keep original insertion order for tasks with same completion and priority (older tasks lower)
     return parseInt(a.id, 10) - parseInt(b.id, 10);
   });

   // OSRS Progress Bar Component (moved inline for simplicity, could be separate)
   const OsrsProgressBar = ({ value, label }: { value: number; label: string }) => (
        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
            <div
                className="h-full bg-gradient-to-b from-accent via-yellow-500 to-accent transition-all duration-300 ease-out rounded-full border-r border-black/30"
                style={{ width: `${value}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
            />
        </div>
    );


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
            <OsrsProgressBar value={levelProgress} label={`XP progress: ${Math.round(levelProgress)}%`} />
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
              onKeyPress={(e) => e.key === 'Enter' && newTaskText.trim() && handleAddTask()} // Ensure text is not empty on Enter
              aria-label="New Task Input"
              className="flex-grow osrs-inner-bevel"
              disabled={!!activeTaskId} // Disable input if a task timer is running
            />
             <div className="flex gap-2 flex-shrink-0">
                <Select value={newTaskPriority} onValueChange={(value: TaskPriority) => setNewTaskPriority(value)} disabled={!!activeTaskId}>
                    <SelectTrigger className="w-[110px] osrs-inner-bevel text-xs" disabled={!!activeTaskId}>
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="osrs-box">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleAddTask} aria-label="Add Task" className="text-sm px-3" disabled={!newTaskText.trim() || !!activeTaskId}>
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
                  "flex items-center justify-between p-1.5 rounded-sm border-l-4 transition-colors duration-150 bg-card/80 hover:bg-card",
                  getPriorityColor(task.priority),
                  task.completed ? 'border-muted/60 opacity-60 hover:opacity-80' : 'border-l',
                  task.id === activeTaskId ? 'ring-1 ring-inset ring-accent/80 shadow-inner shadow-accent/10' : '' // Use activeTaskId for ring
                )}
              >
                 <div className="flex items-center gap-2 flex-1 min-w-0">
                   <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    aria-label={`Mark task ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`}
                    disabled={task.id === activeTaskId} // Disable checkbox if timer is active for this task
                    className={cn(
                        "border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary/80 data-[state=checked]:text-primary-foreground mt-0.5",
                        task.completed && "border-muted/80 data-[state=checked]:bg-muted data-[state=checked]:border-muted/80 data-[state=checked]:text-muted-foreground/60"
                    )}
                   />
                   {task.isEditing ? (
                        <Input
                           type="text"
                           value={editingTaskText} // Use local state for input value
                           onChange={(e) => setEditingTaskText(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && handleSaveTask(task.id)}
                           onBlur={() => handleCancelEditing(task.id)} // Cancel on blur
                           autoFocus
                           className={cn("h-7 flex-1 osrs-inner-bevel text-sm px-1.5", task.completed && "line-through text-muted-foreground/70")}
                         />
                   ) : (
                      <label
                         htmlFor={`task-${task.id}`}
                        className={cn(
                          "flex-1 truncate cursor-pointer text-sm font-medium",
                           task.completed ? 'line-through text-muted-foreground/70' : 'text-foreground hover:text-foreground/90',
                            task.id === activeTaskId ? 'cursor-default' : 'cursor-pointer' // Change cursor if active
                         )}
                        title={task.text}
                        onDoubleClick={() => !task.completed && !(task.id === activeTaskId) && handleStartEditing(task)} // Allow editing only if not completed and not active
                      >
                        {task.text}
                      </label>
                   )}
                 </div>

                 <div className="flex items-center gap-1 sm:gap-1.5 ml-1 flex-shrink-0">
                    {task.isEditing ? (
                       <>
                        <Button variant="ghost" size="icon" onClick={() => handleSaveTask(task.id)} aria-label="Save task" className="text-primary hover:text-primary hover:bg-primary/10 h-6 w-6" disabled={!editingTaskText.trim()}>
                            <Save className="h-3.5 w-3.5" strokeWidth={2} />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleCancelEditing(task.id)} aria-label="Cancel editing" className="text-muted-foreground/70 hover:text-foreground hover:bg-muted/20 h-6 w-6">
                             <X className="h-3.5 w-3.5" strokeWidth={2} />
                         </Button>
                        </>
                    ) : (
                        <>
                           {/* Priority Indicator & Select */}
                           <div className="flex items-center gap-1">
                               <Flag size={11} strokeWidth={2} className={cn(
                                   'hidden sm:inline-block opacity-70 flex-shrink-0',
                                   task.completed && 'opacity-40',
                                   task.priority === 'high' && 'text-destructive',
                                   task.priority === 'medium' && 'text-accent/90',
                                   task.priority === 'low' && 'text-primary/80'
                               )} />
                               <Select value={task.priority} onValueChange={(value: TaskPriority) => updateTaskPriority(task.id, value)} disabled={task.completed || !!activeTaskId}>
                                   <SelectTrigger className="w-[25px] h-5 p-0 border-0 bg-transparent osrs-inner-bevel text-xs focus:ring-0 focus:ring-offset-0 focus:bg-muted/20" disabled={task.completed || !!activeTaskId}>
                                        <SelectValue placeholder="" />
                                   </SelectTrigger>
                                   <SelectContent className="osrs-box min-w-[80px]">
                                       <SelectItem value="low">Low</SelectItem>
                                       <SelectItem value="medium">Medium</SelectItem>
                                       <SelectItem value="high">High</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>

                          {/* Study Time */}
                          <span className={cn(
                              "text-xs text-muted-foreground min-w-[50px] text-right flex items-center gap-0.5 tabular-nums mr-1",
                              task.completed && "opacity-60"
                          )}>
                            <Clock size={10} strokeWidth={1.5} /> {formatTime(task.studyTime)}
                          </span>

                          {/* Timer & Edit Buttons */}
                          {!task.completed && (
                            task.id === activeTaskId ? ( // Check if this task's timer is the active one
                              <Button variant="outline" size="icon" onClick={stopTaskTimer} aria-label={`Pause timer for task ${task.text}`} className="border-accent/70 text-accent/90 hover:bg-accent/10 hover:text-accent h-6 w-6">
                                <Pause className="h-3.5 w-3.5" strokeWidth={2.5} />
                              </Button>
                            ) : (
                              <Button variant="outline" size="icon" onClick={() => startTaskTimer(task.id)} aria-label={`Start timer for task ${task.text}`} className="border-primary/60 text-primary/90 hover:bg-primary/10 hover:text-primary h-6 w-6" disabled={!!activeTaskId}>
                                <Play className="h-3.5 w-3.5" strokeWidth={2.5} />
                              </Button>
                            )
                          )}

                          {/* Edit Button */}
                          <Button variant="ghost" size="icon" onClick={() => handleStartEditing(task)} aria-label={`Edit task ${task.text}`} className="text-muted-foreground/70 hover:text-foreground hover:bg-muted/20 h-6 w-6" disabled={task.completed || !!activeTaskId}>
                             <Edit2 className="h-3.5 w-3.5" strokeWidth={2} />
                           </Button>

                          {/* Delete Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 h-6 w-6" aria-label={`Delete task ${task.text}`} disabled={task.id === activeTaskId}>
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
