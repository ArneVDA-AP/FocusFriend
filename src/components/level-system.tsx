// FILE: src/components/level-system.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { XPEvent } from '@/hooks/use-xp';
import { Timer, CheckCircle, BookOpenCheck, TestTube, BrainCircuit } from 'lucide-react';

interface LevelSystemProps {
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpHistory: XPEvent[];
}

// --- Helper Components (OsrsProgressBarWithText, LevelBox, getIconComponent) remain the same ---
// Custom OSRS-style progress bar component adapted for text overlay
const OsrsProgressBarWithText = ({ value, currentXp, requiredXp }: { value: number; currentXp: number, requiredXp: number }) => (
    <div className="relative w-full h-[16px] bg-black/80 rounded-sm overflow-hidden border border-black/60 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.6)]">
        <div
            className="absolute top-0 left-0 h-full bg-gradient-to-b from-yellow-500 via-yellow-400 to-yellow-500 transition-all duration-300 ease-out border-r-[1px] border-black/40"
            style={{ width: `${Math.min(value, 100)}%`}}
            role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`Level progress: ${Math.round(value)}%`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-[12px] font-medium text-white drop-shadow-[1px_1px_0_rgba(0,0,0,1)] px-2 leading-none">
                {Math.round(currentXp)} / {requiredXp} XP
             </span>
        </div>
    </div>
);

// Octagonal Level Box Component
const LevelBox = ({ level }: { level: number }) => (
    <div className="relative w-[64px] h-[64px] flex-shrink-0">
        <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full fill-black/80"> <path d="M20 0 L60 0 L80 20 L80 60 L60 80 L20 80 L0 60 L0 20 Z" /> </svg>
        <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full fill-[hsl(var(--card))] scale-[0.90]"> <path d="M20 0 L60 0 L80 20 L80 60 L60 80 L20 80 L0 60 L0 20 Z" /> </svg>
        <div className="absolute inset-0 flex items-center justify-center"> <span className="text-[40px] font-bold text-foreground drop-shadow-[2px_2px_0_rgba(0,0,0,0.7)] leading-none pt-1"> {level} </span> </div>
    </div>
);

// Icon mapping
const getIconComponent = (source: string) => {
    if (!source) return BrainCircuit;
    if (source.startsWith('Pomodoro')) return Timer;
    if (source.startsWith('Task:')) return BookOpenCheck;
    if (source.startsWith('Complete:')) return CheckCircle;
    if (source === 'Test XP') return TestTube;
    return BrainCircuit;
};
// --- End Helper Components ---


export default function LevelSystem({ xp, level, xpToNextLevel, xpHistory }: LevelSystemProps) {
  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;

  return (
    // Keep w-full here, the parent in page.tsx dictates the container
    <div className="w-full bg-card text-foreground border-t border-l border-r border-b border-black/80 p-px">
        <div className="border border-white/10">
            {/* Header Section */}
            <div className="h-[36px] flex items-center justify-center bg-black/60 border-b border-black/80 mb-4 shadow-inner shadow-black/30">
                 <h2 className="text-lg font-semibold text-accent tracking-wide">Level Progression</h2>
            </div>

            {/* Content Area - Use Grid Layout */}
            <div className="bg-card p-4 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                {/* Left Column (Level + Progress) - Span 1 column on medium screens */}
                <div className="md:col-span-1 space-y-3 flex flex-col items-center md:items-start">
                     <div className="flex items-center gap-3 w-full">
                         {/* Level Box */}
                         <LevelBox level={level} />
                         {/* Progress Info */}
                         <div className="flex-1 space-y-1">
                             <p className="text-base font-semibold text-foreground leading-tight">Level</p>
                             <OsrsProgressBarWithText
                                 value={levelProgress}
                                 currentXp={xp}
                                 requiredXp={xpToNextLevel}
                             />
                             <p className="text-xs text-muted-foreground/80 leading-tight pt-0.5">
                                 Next level unlocks at {xpToNextLevel} XP
                             </p>
                         </div>
                     </div>
                     {/* You could add other stats here if needed */}
                </div>

                {/* Right Column (XP History) - Span 2 columns on medium screens */}
                <div className="md:col-span-2 space-y-1.5">
                    <h4 className="text-base font-semibold text-foreground mb-1">XP History</h4>
                    {xpHistory.length === 0 ? (
                         <p className="text-xs text-muted-foreground italic text-center py-4">No recent XP gains.</p>
                    ) : (
                        <ul className="space-y-0.5 max-h-48 overflow-y-auto pr-1"> {/* Added max-height and scroll */}
                            {xpHistory.slice(0, 10).map((event: XPEvent) => { // Show more history items if available
                                const Icon = getIconComponent(event.source);
                                return (
                                    <li key={event.id} className="flex items-center justify-between text-xs p-0.5 hover:bg-white/5 rounded-sm">
                                       <div className="flex items-center gap-1.5">
                                            <Icon size={14} className="text-muted-foreground/70 flex-shrink-0" strokeWidth={2}/>
                                            <span className="text-foreground/80 truncate" title={event.description}>{event.description}</span>
                                        </div>
                                        <span className="font-medium text-foreground/90 tabular-nums whitespace-nowrap ml-2">
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
    </div>
  );
}