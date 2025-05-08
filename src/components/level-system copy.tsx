// FILE: src/components/level-system.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Keep Card import for structure if needed, but styling will be custom
import { cn } from '@/lib/utils';
import type { XPEvent } from '@/hooks/use-xp'; // Import XPEvent type
import { Timer, CheckCircle, BookOpenCheck, TestTube } from 'lucide-react'; // Import icons used in use-xp

interface LevelSystemProps {
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpHistory: XPEvent[]; // Pass xpHistory as a prop
}

// Custom OSRS-style progress bar component adapted for text overlay
const OsrsProgressBarWithText = ({ value, currentXp, requiredXp }: { value: number; currentXp: number, requiredXp: number }) => (
    <div className="relative w-full h-[18px] bg-black/70 rounded-sm overflow-hidden border border-black/50 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5)]">
        {/* Background fill */}
        <div
            className="absolute top-0 left-0 h-full bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-500 transition-all duration-300 ease-out border-r border-black/30"
            style={{ width: `${Math.min(value, 100)}%`}} // Ensure width doesn't exceed 100%
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level progress: ${Math.round(value)}%`}
        />
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-[13px] font-medium text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)] px-2 leading-none">
                {Math.round(currentXp)} / {requiredXp} XP
             </span>
        </div>
    </div>
);

// Octagonal Level Box Component
const LevelBox = ({ level }: { level: number }) => (
    <div className="relative w-[72px] h-[72px] flex-shrink-0">
        {/* Outer border */}
        <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full fill-black">
            <path d="M20 0 L60 0 L80 20 L80 60 L60 80 L20 80 L0 60 L0 20 Z" />
        </svg>
        {/* Inner background */}
        <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full fill-[hsl(var(--card))] scale-[0.92]">
            <path d="M20 0 L60 0 L80 20 L80 60 L60 80 L20 80 L0 60 L0 20 Z" />
        </svg>
        {/* Level Number */}
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-foreground drop-shadow-[2px_2px_0_rgba(0,0,0,0.6)] leading-none pt-1">
                {level}
            </span>
        </div>
    </div>
);

// Icon mapping based on source string prefix
const getIconComponent = (source: string) => {
    if (source.startsWith('Pomodoro')) return Timer;
    if (source.startsWith('Task:')) return BookOpenCheck; // Assuming 'Finished a study session' maps to this
    if (source.startsWith('Complete:')) return CheckCircle; // Assuming 'Completed a task' maps to this
    if (source === 'Test XP') return TestTube;
    return BookOpenCheck; // Default fallback icon
};


export default function LevelSystem({ xp, level, xpToNextLevel, xpHistory }: LevelSystemProps) {
  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;

  return (
    // Main container with OSRS box styling, using card background
    <div className="w-full osrs-box bg-card text-foreground border-2 border-black">

        {/* Header Section */}
        <div className="h-[40px] flex items-center justify-center bg-black/50 border-b-2 border-black mb-4">
             <h2 className="text-xl font-semibold text-accent tracking-wide">Level Progression</h2>
        </div>

        {/* Content Area - Lighter background */}
        <div className="bg-[hsl(var(--background))] p-4 pt-3 space-y-5"> {/* Use background for parchment feel */}

            {/* Top Section: Level and Progress Bar */}
            <div className="flex items-center gap-4">
                {/* Level Box */}
                <LevelBox level={level} />

                {/* Progress Info */}
                <div className="flex-1 space-y-1.5">
                    <p className="text-lg font-semibold text-foreground leading-tight">Level</p>
                    <OsrsProgressBarWithText
                        value={levelProgress}
                        currentXp={xp}
                        requiredXp={xpToNextLevel}
                    />
                    <p className="text-sm text-muted-foreground/90 leading-tight">
                        Next level unlocks at {xpToNextLevel} XP
                    </p>
                </div>
            </div>

            {/* XP History Section */}
            <div className="space-y-2 pt-2">
                <h4 className="text-lg font-semibold text-foreground">XP History</h4>
                {xpHistory.length === 0 ? (
                     <p className="text-sm text-muted-foreground italic text-center py-4">No recent XP gains.</p>
                ) : (
                    <ul className="space-y-1"> {/* Removed bevel and background */}
                        {xpHistory.slice(0, 5).map((event: XPEvent) => { // Limit displayed history if needed
                            const Icon = getIconComponent(event.source);
                            return (
                                <li key={event.id} className="flex items-center justify-between text-sm p-0.5">
                                   <div className="flex items-center gap-2">
                                        {/* Adjusted Icon styling */}
                                        <Icon size={18} className="text-muted-foreground/80 flex-shrink-0" strokeWidth={1.5}/>
                                        <span className="text-foreground/90">{event.description}</span>
                                    </div>
                                    <span className="font-medium text-foreground tabular-nums whitespace-nowrap">
                                        +{event.xp} XP
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    </div>
  );
}