
'use client';

import { cn } from '@/lib/utils';
import React, { useEffect } from 'react'; // Import useEffect from 'react'

interface FocusCrystalProps {
    stage: number; // 0-24 represents growth stage
    isGrowing: boolean;
    isWithered: boolean;
}

// Generate 25 SVG paths representing crystal growth stages
const crystalStages: React.ReactNode[] = Array.from({ length: 25 }, (_, i) => {
    const progress = (i / 24) * 100; // Calculate progress percentage for stage i
    const baseSize = 3;
    const growthFactor = progress / 100;
    const size = baseSize + 20 * growthFactor; // Crystal size grows
    const complexity = Math.floor(growthFactor * 5); // Number of facets increases
    const hue = 45; // Accent color hue
    const saturation = 85; // Accent color saturation
    const lightness = 60 - 10 * growthFactor; // Gets slightly darker/more intense

    // Simple representation: a growing polygon
    // Stage 0: Small Seed
    if (i === 0) return <circle key={i} cx="50" cy="85" r="2" fill={`hsl(${hue} ${saturation}% ${lightness+5}%)`} />;

    // Calculate points for a polygon that grows and gets more complex
    const points = [];
    const numPoints = 3 + complexity; // From triangle to octagon
    const radiusX = size * 0.5;
    const radiusY = size;
    for (let p = 0; p < numPoints; p++) {
        const angle = (p / numPoints) * 2 * Math.PI - Math.PI / 2; // Start from top
        const x = 50 + radiusX * Math.cos(angle) * (0.8 + Math.random() * 0.2); // Add some irregularity
        const y = 80 - radiusY * Math.abs(Math.sin(angle)) * (0.8 + Math.random() * 0.2); // Grow upwards
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    // Add base points
    points.push(`55,85`);
    points.push(`45,85`);

    return (
        <polygon
            key={i}
            points={points.join(' ')}
            fill={`hsl(${hue} ${saturation}% ${lightness}%)`}
             stroke={`hsl(${hue} ${saturation-10}% ${lightness-10}%)`}
             strokeWidth={0.3 + growthFactor * 0.4}
        />
    );
});


// Withered Crystal SVG (simple representation)
const witheredCrystal = (
    <path d="M50 85 L 48 78 L 50 80 L 52 78 Z M 49 80 L 50 82 L 51 80 Z" fill="hsl(var(--muted-foreground)/0.5)" stroke="hsl(var(--muted-foreground)/0.3)" strokeWidth="0.5" />
);

const FocusCrystal: React.FC<FocusCrystalProps> = ({ stage, isGrowing, isWithered }) => {
    // Moved useEffect to the top level of the functional component
    useEffect(() => {
        // Empty effect, kept structure if needed later
    }, []);

    // Ensure stage is within bounds 0-24
    const currentStageIndex = Math.max(0, Math.min(24, Math.floor(stage)));
    const currentStageSvg = isWithered ? witheredCrystal : crystalStages[currentStageIndex];

    // Determine glow intensity based on growth
    let glowIntensity = 0;
    if (isGrowing) {
        glowIntensity = 0.2 + (currentStageIndex / 24) * 0.4; // Glow increases with stage
    } else if (!isWithered && currentStageIndex === 24) {
        glowIntensity = 0.6; // Max glow when fully grown and not active
    } else if (isWithered) {
        glowIntensity = 0; // No glow if withered
    }

    return (
        <>
           {/* Removed invalid useEffect placement from here */}
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
                    style={{ filter: `drop-shadow(0 0 ${glowIntensity * 15}px hsl(var(--accent)/0.6))` }} // Slightly reduced glow size
                >
                    {/* Base/Ground */}
                    <ellipse cx="50" cy="88" rx="18" ry="5" fill="hsl(var(--secondary)/0.8)" />

                     {/* Animated growing crystal */}
                     <g style={{
                         transition: 'opacity 0.5s ease-in-out', // Removed transform transition for stage-based updates
                         opacity: isWithered ? 0.5 : 1,
                     }}>
                         {currentStageSvg}
                    </g>

                     {/* Optional: Sparkle effect when growing */}
                     {isGrowing && currentStageIndex > 2 && (currentStageIndex % 4 === 0) && ( // Simple sparkle condition based on stage
                         <circle
                             cx={45 + Math.random() * 10}
                             cy={50 + Math.random() * 25} // More vertical range for sparkles
                             r={0.4 + Math.random() * 0.8} // Slightly smaller sparkles
                             fill="hsl(var(--accent-foreground)/0.8)"
                             className="animate-ping opacity-70"
                             style={{ animationDuration: '1.8s' }}
                          />
                     )}
                </svg>
            </div>
        </>
    );
};

export default FocusCrystal;
