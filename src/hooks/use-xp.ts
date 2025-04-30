
import { useState, useCallback } from 'react';
import { Timer, CheckCircle, BookOpenCheck, BrainCircuit } from 'lucide-react'; // Added icons

// Define type for XP source icon
type XPIcon = typeof Timer | typeof CheckCircle | typeof BookOpenCheck | typeof BrainCircuit;

interface XPEvent {
  id: number;
  description: string;
  xp: number;
  timestamp: number;
  icon: XPIcon; // Add icon property
  source: string; // Added source property
}

const MAX_HISTORY = 10; // Limit the number of history items

const useXP = () => {
  const [xpHistory, setXPHistory] = useState<XPEvent[]>([]);

  // Map source strings to icons
  const getIconForSource = (source: string): XPIcon => {
     if (source.startsWith('Pomodoro')) return Timer;
     if (source.startsWith('Task:')) return BookOpenCheck;
     if (source.startsWith('Complete:')) return CheckCircle;
     // Add more specific checks if needed
     return BrainCircuit; // Default icon
  };

  const addXPEvent = useCallback((source: string, xp: number) => {
    setXPHistory((prevHistory) => {
       const newEvent: XPEvent = {
         id: Date.now() + Math.random(), // More unique ID
         description: source, // Use the source directly as description for now
         xp: xp,
         timestamp: Date.now(),
         icon: getIconForSource(source), // Get icon based on source
         source: source,
       };

       // Add new event and keep only the last MAX_HISTORY items
       const updatedHistory = [newEvent, ...prevHistory].slice(0, MAX_HISTORY);
       return updatedHistory;
    });
  }, []); // Empty dependency array because it relies on internal logic and state setter

  return { xpHistory, addXPEvent };
};

export default useXP;
