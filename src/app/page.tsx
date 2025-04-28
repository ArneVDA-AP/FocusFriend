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
import { ListTodo, Timer, Award, Trophy, LayoutDashboard, BookOpen, Settings as SettingsIcon } from 'lucide-react'; // Use BookOpen temporarily, replace later if needed
import StudyTracker from '@/components/study-tracker';
import PomodoroTimer from '@/components/pomodoro-timer';
import LevelSystem from '@/components/level-system';
import Achievements from '@/components/achievements';
import Overview from '@/components/overview';
import Settings from '@/components/settings'; // Import Settings component
import { cn } from '@/lib/utils';

// Simple Pixel Scroll SVG Icon
const PixelScrollIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-accent">
    <path style={{ imageRendering: 'pixelated' }} d="M6 2H18V4H6V2ZM5 5V19H7V18H8V17H9V16H15V17H16V18H17V19H19V5H17V6H16V7H15V8H9V7H8V6H7V5H5ZM6 20H18V22H6V20Z" />
    <path style={{ imageRendering: 'pixelated', fill: 'hsl(var(--foreground)/0.8)' }} d="M7 5H17V6H16V7H15V8H9V7H8V6H7V5ZM7 18V19H17V18H16V17H15V16H9V17H8V18H7Z" />
  </svg>
);


export default function Home() {
  const [activeSection, setActiveSection] = useState('overview'); // Default to overview

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar styling uses theme vars from globals.css */}
        <Sidebar collapsible='icon' variant='inset'>
          <SidebarHeader>
            <div className="flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
              <PixelScrollIcon />
              <h1 className="text-xl font-semibold group-data-[collapsible=icon]:hidden tracking-wider">FocusFriend</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
               <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('overview')}
                  isActive={activeSection === 'overview'}
                  tooltip="Overview"
                  className="text-sm"
                >
                  <LayoutDashboard strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('study')}
                  isActive={activeSection === 'study'}
                  tooltip="Study Tracker"
                  className="text-sm"
                >
                  <ListTodo strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Study Tracker</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('pomodoro')}
                  isActive={activeSection === 'pomodoro'}
                  tooltip="Pomodoro Timer"
                  className="text-sm"
                >
                  <Timer strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Pomodoro Timer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('levels')}
                  isActive={activeSection === 'levels'}
                  tooltip="Level System"
                   className="text-sm"
                >
                  <Award strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Level System</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('achievements')}
                  isActive={activeSection === 'achievements'}
                  tooltip="Achievements"
                   className="text-sm"
                >
                  <Trophy strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('settings')}
                  isActive={activeSection === 'settings'}
                  tooltip="Settings"
                   className="text-sm"
                >
                  <SettingsIcon strokeWidth={1.5}/>
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter className="group-data-[collapsible=icon]:hidden">
             <p className="text-xs text-muted-foreground text-center opacity-70">OSRS Inspired</p>
           </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className={cn(
            "flex-1 p-3 md:p-4 bg-background text-foreground",
            // "osrs-box" // Optional: Apply OSRS box style to the whole inset area
            )}>
          <div className="flex items-center justify-between mb-4 md:mb-6">
             <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden border border-input hover:bg-muted" />
                 <h2 className="text-lg font-semibold capitalize tracking-wide">
                    {activeSection === 'overview' && 'Dashboard Overview'}
                    {activeSection === 'study' && 'Study Task Manager'}
                    {activeSection === 'pomodoro' && 'Pomodoro Timer'}
                    {activeSection === 'levels' && 'Level Progression'}
                    {activeSection === 'achievements' && 'Achievements Log'}
                    {activeSection === 'settings' && 'Pomodoro Settings'}
                 </h2>
             </div>
            <div></div> {/* Placeholder for potential header actions */}
          </div>

          {/* Apply OSRS box styling to the content container */}
          <div className="grid grid-cols-1 gap-4 osrs-box p-3 md:p-4">
            {activeSection === 'overview' && <Overview />}
            {activeSection === 'study' && <StudyTracker />}
            {activeSection === 'pomodoro' && <PomodoroTimer />}
            {activeSection === 'levels' && <LevelSystem />}
            {activeSection === 'achievements' && <Achievements />}
            {activeSection === 'settings' && <Settings />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
