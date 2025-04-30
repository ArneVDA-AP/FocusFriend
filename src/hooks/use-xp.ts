
import { useState, useCallback } from 'react';
import { Timer, CheckCircle, BookOpenCheck, BrainCircuit, LucideIcon, TestTube } from 'lucide-react'; // Added LucideIcon and TestTube

// Define type for XP source icon
type XPIcon = typeof Timer | typeof CheckCircle | typeof BookOpenCheck | typeof BrainCircuit | typeof TestTube; // Added TestTube

export interface XPEvent { // Export the interface
  id: number;
  description: string;
  xp: number;
  timestamp: number;
  icon: LucideIcon; // Use LucideIcon type
  source: string; // Added source property
}

const MAX_HISTORY = 10; // Limit the number of history items

const useXP = () => {
  const [xpHistory, setXPHistory] = useState<XPEvent[]>([]);

  // Map source strings to icons
  const getIconForSource = (source: string): XPIcon => {
     // Add check for undefined or null source
     if (!source) return BrainCircuit; // Return default if source is invalid

     if (source.startsWith('Pomodoro')) return Timer;
     if (source.startsWith('Task:')) return BookOpenCheck;
     if (source.startsWith('Complete:')) return CheckCircle;
     if (source === 'Test XP') return TestTube; // Handle Test XP source
     // Add more specific checks if needed
     return BrainCircuit; // Default icon
  };

  const addXPEvent = useCallback((source: string, xp: number) => {
    setXPHistory((prevHistory) => {
       const newEvent: XPEvent = {
         id: Date.now() + Math.random(), // More unique ID
         description: source || 'Unknown XP Source', // Use source or default description
         xp: xp,
         timestamp: Date.now(),
         icon: getIconForSource(source), // Get icon based on source
         source: source || 'unknown', // Ensure source is always a string
       };

       // Add new event and keep only the last MAX_HISTORY items
       const updatedHistory = [newEvent, ...prevHistory].slice(0, MAX_HISTORY);
       return updatedHistory;
    });
  }, []); // Empty dependency array because it relies on internal logic and state setter

  return { xpHistory, addXPEvent };
};

export default useXP;
