'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldQuestion, Trophy } from 'lucide-react';

// Placeholder data - replace with actual achievement logic later
const achievements = [
  { id: 1, name: "First Step", description: "Complete your first study task.", unlocked: true, icon: <Trophy size={24} className="text-accent"/> },
  { id: 2, name: "Focused Mind", description: "Complete a full Pomodoro work session.", unlocked: false, icon: <ShieldQuestion size={24} className="text-muted-foreground"/> },
  { id: 3, name: "Hour Hero", description: "Log 1 hour of study time.", unlocked: false, icon: <ShieldQuestion size={24} className="text-muted-foreground"/> },
  { id: 4, name: "Task Master", description: "Complete 10 study tasks.", unlocked: false, icon: <ShieldQuestion size={24} className="text-muted-foreground"/> },
  { id: 5, name: "Level 5 Reached", description: "Achieve level 5.", unlocked: false, icon: <ShieldQuestion size={24} className="text-muted-foreground"/> },
];

export default function Achievements() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Your Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">Unlock achievements by completing tasks and reaching milestones!</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <Card key={ach.id} className={`p-4 flex items-center gap-4 ${ach.unlocked ? 'border-accent bg-accent/10' : 'border-border bg-muted/30'}`}>
              <div className={`flex-shrink-0 ${ach.unlocked ? '' : 'opacity-50'}`}>
                {ach.icon}
              </div>
              <div>
                <h3 className={`font-semibold ${ach.unlocked ? 'text-accent-foreground' : 'text-foreground'}`}>{ach.name}</h3>
                <p className={`text-sm ${ach.unlocked ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>{ach.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
