import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function format(date: Date): string {
  if (date === null || date === undefined || isNaN(date.getTime())) {
      return "Invalid Date";
  }
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

const XP_LEVEL_BASE = 100;
const XP_LEVEL_FACTOR = 100;

export function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  let level = 1;
  let requiredXp = XP_LEVEL_BASE;
  while (xp >= requiredXp) {
    level++;
    requiredXp = XP_LEVEL_BASE;
    for (let i = 1; i < level; i++) {
      requiredXp += XP_LEVEL_FACTOR * i;
    }
  }
  return level;
}

export function calculateTotalXp(level: number): number {
  if (level <= 1) return 0;
  return ((level - 1) * level / 2) * 100;
}
export function calculateXpToNextLevel(level: number): number {
    if (level < 1) {
        return 100
    }
    return level * 100;
}
