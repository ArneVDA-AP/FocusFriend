'use client';

import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListTodo, Timer, Award, ShieldQuestion } from 'lucide-react';
import StudyTracker from '@/components/study-tracker';
import PomodoroTimer from '@/components/pomodoro-timer';
import LevelSystem from '@/components/level-system';
import Achievements from '@/components/achievements'; // Placeholder for future achievements component

export default function Home() {
  const [activeSection, setActiveSection] = useState('study');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-primary"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <h1 className="text-xl font-semibold">StudyQuest</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('study')}
                  isActive={activeSection === 'study'}
                  tooltip="Study Tracker"
                >
                  <ListTodo />
                  <span>Study Tracker</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('pomodoro')}
                  isActive={activeSection === 'pomodoro'}
                  tooltip="Pomodoro Timer"
                >
                  <Timer />
                  <span>Pomodoro Timer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('levels')}
                  isActive={activeSection === 'levels'}
                  tooltip="Level System"
                >
                  <Award />
                  <span>Level System</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('achievements')}
                  isActive={activeSection === 'achievements'}
                  tooltip="Achievements"
                >
                  <ShieldQuestion />
                  <span>Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            {/* Footer content if needed */}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-2xl font-semibold capitalize">
              {activeSection === 'study' && 'Study Tracker'}
              {activeSection === 'pomodoro' && 'Pomodoro Timer'}
              {activeSection === 'levels' && 'Level System'}
              {activeSection === 'achievements' && 'Achievements'}
            </h2>
            <div></div> {/* Placeholder for potential header actions */}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {activeSection === 'study' && <StudyTracker />}
            {activeSection === 'pomodoro' && <PomodoroTimer />}
            {activeSection === 'levels' && <LevelSystem />}
            {activeSection === 'achievements' && <Achievements />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
