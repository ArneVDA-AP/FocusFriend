"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import {
  BookOpen,
  CheckCircle,
  ChevronsUpDown,
  Edit,
  Flag,
  FlagOff,
  ListTodo,
  LucideIcon,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// --------------------------------------------------
//  TYPES
// --------------------------------------------------

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  studyTime?: number;
  isActive: boolean;
  priority: TaskPriority;
  isEditing: boolean;
  skillId: string;
}

// --------------------------------------------------
//  TASK LIST COMPONENT
// --------------------------------------------------

const TaskList = ({
  tasks,
  toggleTaskCompletion,
  deleteTask,
  editTask,
  updateTaskPriority,
  startTaskTimer,
  stopTaskTimer,
  setTaskEditing,
  activeTaskId,
}: {
  tasks: Task[];
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, newText: string, skillId?: string) => boolean;
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  startTaskTimer: (taskId: string) => void;
  stopTaskTimer: () => void;
  setTaskEditing: (id: string, isEditing: boolean) => void;
  activeTaskId: string | null;
}) => {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-2">
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          No tasks yet! Add one below.
        </p>
      )}
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          toggleTaskCompletion={toggleTaskCompletion}
          deleteTask={deleteTask}
          editTask={editTask}
          updateTaskPriority={updateTaskPriority}
          startTaskTimer={startTaskTimer}
          stopTaskTimer={stopTaskTimer}
          setTaskEditing={setTaskEditing}
          activeTaskId={activeTaskId}
        />
      ))}
    </div>
  );
};

// --------------------------------------------------
//  TASK ITEM COMPONENT
// --------------------------------------------------

const TaskItem = ({
  task,
  toggleTaskCompletion,
  deleteTask,
  editTask,
  updateTaskPriority,
  startTaskTimer,
  stopTaskTimer,
  setTaskEditing,
  activeTaskId,
}: {
  task: Task;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, newText: string, newSkillId?: string) => boolean;
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  startTaskTimer: (taskId: string) => void;
  stopTaskTimer: () => void;
  setTaskEditing: (id: string, isEditing: boolean) => void;
  activeTaskId: string | null;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editedSkill, setEditedSkill] = useState<string>(task.skillId); // Track edited skill

  const { toast } = useToast();

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setTaskEditing(task.id, true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [task.id, setTaskEditing]);

  // Cancel edit if the escape key is pressed
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setTaskEditing(task.id, false);
    setEditValue(task.text);
  }, [task.text, task.id, setTaskEditing]);

  // Save edit if the enter key is pressed
  const handleSaveEdit = useCallback(() => {
    const success = editTask(task.id, editValue, editedSkill);
    if (success) {
      setIsEditing(false);
      setTaskEditing(task.id, false);
    }
  }, [task.id, editValue, editTask, editedSkill, setTaskEditing]);

  // Focus on edit when edit starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Timer
  useEffect(() => {
    if (task.id === activeTaskId) {
      startTaskTimer(task.id);
    } else {
      // Stop timer if task is not active and was previously active
      if (task.isActive) {
        stopTaskTimer();
      }
    }
  }, [activeTaskId, startTaskTimer, stopTaskTimer, task.id]);

  return (
    <div
      className={cn(
        "flex items-center justify-between border border-input p-3 rounded-md",
        task.completed && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleTaskCompletion(task.id)}
          aria-label={
            task.completed ? "Mark task as incomplete" : "Mark task as complete"
          }
        >
          <CheckCircle
            className={cn("stroke-1", task.completed && "text-green-500")}
          />
        </button>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleCancelEdit();
                } else if (e.key === "Enter") {
                  handleSaveEdit();
                }
              }}
              className="h-8"
            />

            {/* Dropdown for skill selection */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <BookOpen size={16} />
                  <span className="ml-2">
                    {editedSkill ? editedSkill : "Skill"}
                  </span>
                  <ChevronsUpDown size={16} className="ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select Skill</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditedSkill("reading")}>
                  Reading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditedSkill("writing")}>
                  Writing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditedSkill("coding")}>
                  Coding
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditedSkill("math")}>
                  Math
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCancelEdit}
              aria-label="Cancel edit"
            >
              <X className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSaveEdit}
              aria-label="Save edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span
            className={cn(
              "text-sm",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.text}
          </span>
        )}

        {/* Priority Display */}
        {task.priority === "high" && (
          <Flag className="h-4 w-4 text-red-500" />
        )}
        {task.priority === "low" && <FlagOff className="h-4 w-4" />}
      </div>

      <div className="flex items-center gap-2">
        {/* Display Timer if Active */}
        {task.isActive && task.studyTime !== undefined && (
          <span className="text-sm">
            {formatTime(task.studyTime)}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Edit Task">
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Change Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateTaskPriority(task.id, "low")}>
              Low
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateTaskPriority(task.id, "medium")}
            >
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateTaskPriority(task.id, "high")}
            >
              High
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Button */}
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            aria-label="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// --------------------------------------------------
//  NEW TASK COMPONENT
// --------------------------------------------------

const NewTask = ({ addTask }: { addTask: (text: string, priority: TaskPriority) => void }) => {
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const { toast } = useToast();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newTask.trim() === "") {
        toast({
          title: "Error",
          description: "Task text cannot be empty.",
        });
        return;
      }
      addTask(newTask, priority);
      setNewTask("");
      setPriority("medium");
    },
    [addTask, newTask, priority, toast]
  );

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Add a new task"
        className="h-8"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Flag size={16} />
            <span className="ml-2 capitalize">{priority}</span>
            <ChevronsUpDown size={16} className="ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Select Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPriority("low")}>
            Low
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPriority("medium")}>
            Medium
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPriority("high")}>
            High
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="submit" size="sm" className="h-8">
        <Plus size={16} />
      </Button>
    </form>
  );
};

// --------------------------------------------------
//  STUDY TRACKER MAIN COMPONENT
// --------------------------------------------------

const StudyTracker = ({
  tasks,
  addTask,
  toggleTaskCompletion,
  deleteTask,
  editTask,
  updateTaskPriority,
  startTaskTimer,
  stopTaskTimer,
  setTaskEditing,
  activeTaskId,
  skillDefinitions,
}: {
  tasks: Task[];
  addTask: (text: string, priority: TaskPriority) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, newText: string, newSkillId?: string) => boolean;
  updateTaskPriority: (id: string, priority: TaskPriority) => void;
  startTaskTimer: (taskId: string) => void;
  stopTaskTimer: () => void;
  setTaskEditing: (id: string, isEditing: boolean) => void;
  activeTaskId: string | null;
    skillDefinitions: {id: string, name: string}[];
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* List of all tasks */}
      <TaskList
        tasks={tasks}
        toggleTaskCompletion={toggleTaskCompletion}
        deleteTask={deleteTask}
        editTask={editTask}
        updateTaskPriority={updateTaskPriority}
        startTaskTimer={startTaskTimer}
        stopTaskTimer={stopTaskTimer}
        setTaskEditing={setTaskEditing}
        activeTaskId={activeTaskId}
      />

      {/* Add new task */}
      <NewTask addTask={addTask} />
    </div>
  );
};

export default StudyTracker;

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