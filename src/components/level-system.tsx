
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Circle, BookOpenCheck, CheckCircle, BrainCircuit, Timer, LucideIcon } from 'lucide-react'; // Import LucideIcon
import { cn } from '@/lib/utils';
import useXP from '@/hooks/use-xp';

interface LevelSystemProps {
  xp: number;
  level: number;
  xpToNextLevel: number;
}

// Define type for XP History Item from the hook
interface XPHistoryItem {
    id: number;
    icon: LucideIcon; // Use LucideIcon type
    description: string;
    xp: number; // Changed to number for calculations if needed, format later
    timestamp: number;
    source: string;
}

// Custom OSRS-style progress bar component adapted for text overlay
const OsrsProgressBarWithText = ({ value, currentXp, requiredXp, label }: { value: number; currentXp: number, requiredXp: number, label: string }) => (
    <div className="relative w-full h-5 bg-black/60 rounded-sm overflow-hidden border border-black/50 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5)]">
        {/* Background fill */}
        <div
            className="absolute top-0 left-0 h-full bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 transition-all duration-300 ease-out border-r border-black/30"
            style={{ width: `${Math.min(value, 100)}%`}} // Ensure width doesn't exceed 100%
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
        />
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-xs font-medium text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.9)] px-2">
                {Math.round(currentXp)} / {requiredXp} XP
             </span>
        </div>
    </div>
);


export default function LevelSystem({ xp, level, xpToNextLevel }: LevelSystemProps) {
  const { xpHistory } = useXP(); // Only need xpHistory here
  const levelProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;

  return (
    <Card className="w-full osrs-box"> {/* Apply osrs-box style */}
      <CardHeader className="pb-4 pt-3 px-4 border-b-2 border-black"> {/* Add bottom border */}
         <CardTitle className="text-center text-lg font-semibold tracking-wide text-accent">Level Progression</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6"> {/* Add more vertical spacing */}

         {/* Top Section: Level and Progress Bar */}
         <div className="flex items-center gap-4">
             {/* Level Box */}
             <div className="flex-shrink-0 w-16 h-16 bg-black/30 border-2 border-black flex items-center justify-center rounded-md shadow-[inset_2px_2px_0_0_rgba(255,255,255,0.1),inset_-2px_-2px_0_0_rgba(0,0,0,0.3)]">
                <span className="text-4xl font-bold text-foreground drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">{level}</span>
             </div>

             {/* Progress Info */}
             <div className="flex-1 space-y-1.5">
                 <p className="text-base font-semibold text-foreground">Level</p>
                 <OsrsProgressBarWithText
                     value={levelProgress}
                     currentXp={xp}
                     requiredXp={xpToNextLevel}
                     label={`Level progress: ${Math.round(levelProgress)}%`}
                 />
                 <p className="text-xs text-muted-foreground">
                     Next level unlocks at {xpToNextLevel} XP
                 </p>
             </div>
         </div>

         {/* XP History Section */}
         <div className="space-y-3">
             <h4 className="text-base font-semibold text-foreground">XP History</h4>
             {xpHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No recent XP gains.</p>
             ) : (
                 <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1 osrs-inner-bevel bg-black/10 p-1.5 rounded-sm"> {/* Add scroll */}
                     {xpHistory.map((event: XPHistoryItem) => {
                         const Icon = event.icon; // Get the icon component from the event
                         return (
                             <li key={event.id} className="flex items-center justify-between text-sm p-1 rounded-sm hover:bg-foreground/5">
                                <div className="flex items-center gap-2">
                                     <Icon size={14} className="text-muted-foreground/80" strokeWidth={1.5}/>
                                     <span className="text-foreground/90 truncate" title={event.description}>{event.description}</span>
                                 </div>
                                 <span className="font-medium text-foreground tabular-nums whitespace-nowrap">
                                     +{event.xp} XP {/* Format XP */}
                                 </span>
                             </li>
                         );
                     })}
                 </ul>
             )}
         </div>

      </CardContent>
    </Card>
  );
}
