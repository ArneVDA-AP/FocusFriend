
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FocusCrystalProps {
    progress: number; // 0-100
    isGrowing: boolean;
    isWithered: boolean;
}

// SVG paths for different growth stages (simplified)
const crystalStages = [
    // Stage 0: Seed (Small dot) - 0%
    <circle key="0" cx="50" cy="85" r="3" fill="hsl(var(--accent)/0.6)" />,
    // Stage 1: Small Sprout - 1-25%
    <path key="1" d="M50 85 Q 48 80 50 75 Q 52 80 50 85 Z" fill="hsl(var(--accent)/0.7)" />,
    // Stage 2: Growing Crystal Shard - 26-50%
    <path key="2" d="M50 85 L 45 70 L 50 65 L 55 70 Z" fill="hsl(var(--accent)/0.8)" />,
    // Stage 3: Medium Crystal - 51-75%
    <path key="3" d="M50 85 L 40 65 L 45 60 L 50 55 L 55 60 L 60 65 Z" fill="hsl(var(--accent)/0.9)" />,
    // Stage 4: Fully Grown Crystal - 76-100%
    <path key="4" d="M50 85 L 35 60 L 40 50 L 50 45 L 60 50 L 65 60 Z M 48 60 L 50 55 L 52 60 Z" fill="hsl(var(--accent))" />,
];

// Withered Crystal SVG
const witheredCrystal = (
    <path d="M50 85 L 45 70 L 50 75 L 55 70 Z M 48 75 L 50 80 L 52 75 Z" fill="hsl(var(--muted-foreground)/0.5)" stroke="hsl(var(--muted-foreground)/0.3)" strokeWidth="0.5" />
);

const FocusCrystal: React.FC<FocusCrystalProps> = ({ progress, isGrowing, isWithered }) => {
    const stageIndex = Math.min(Math.floor(progress / (100 / (crystalStages.length -1))), crystalStages.length - 1);
    const currentStageSvg = isWithered ? witheredCrystal : crystalStages[stageIndex];

    // Determine glow intensity based on growth and progress
    let glowIntensity = 0;
    if (isGrowing) {
        glowIntensity = 0.1 + (progress / 100) * 0.4; // Glow increases with progress
    } else if (!isWithered && progress === 100) {
        glowIntensity = 0.5; // Max glow when fully grown and not active
    } else if (isWithered) {
        glowIntensity = 0; // No glow if withered
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Optional: Subtle background circle */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="url(#grad)"
                    stroke="hsl(var(--border)/0.3)"
                    strokeWidth="0.5"
                />
                <defs>
                    <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: 'hsl(var(--card)/0.5)', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'hsl(var(--card)/0.1)', stopOpacity: 1 }} />
                    </radialGradient>
                </defs>
            </svg>

            {/* Crystal SVG Container */}
            <svg
                viewBox="0 0 100 100"
                className="relative z-10 w-[70%] h-[70%] overflow-visible" // Adjust size as needed
                style={{ filter: `drop-shadow(0 0 ${glowIntensity * 20}px hsl(var(--accent)/0.7))` }}
            >
                {/* Base/Ground */}
                <ellipse cx="50" cy="88" rx="18" ry="5" fill="hsl(var(--secondary)/0.8)" />

                 {/* Animated growing crystal */}
                 <g style={{
                     transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out',
                     transformOrigin: '50% 85%', // Base of the crystal
                     transform: isGrowing ? 'scale(1)' : 'scale(0.95)', // Subtle pulse when growing
                     opacity: isWithered ? 0.5 : 1,
                 }}>
                     {currentStageSvg}
                </g>

                 {/* Optional: Sparkle effect when growing */}
                 {isGrowing && progress > 10 && (progress % 20 < 5) && ( // Simple sparkle condition
                     <circle
                         cx={45 + Math.random() * 10}
                         cy={50 + Math.random() * 20}
                         r={0.5 + Math.random() * 1}
                         fill="hsl(var(--accent-foreground))"
                         className="animate-ping opacity-75"
                         style={{ animationDuration: '1.5s' }}
                      />
                 )}

            </svg>
        </div>
    );
};

export default FocusCrystal;
