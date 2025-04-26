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
import { ListTodo, Timer, Award, Trophy, LayoutDashboard } from 'lucide-react'; // Changed ShieldQuestion to Trophy, added LayoutDashboard
import StudyTracker from '@/components/study-tracker';
import PomodoroTimer from '@/components/pomodoro-timer';
import LevelSystem from '@/components/level-system';
import Achievements from '@/components/achievements';
import Overview from '@/components/overview'; // Import the new Overview component

export default function Home() {
  const [activeSection, setActiveSection] = useState('overview'); // Default to overview

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible='icon' variant='inset'>
          <SidebarHeader>
            <div className="flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
              {/* OSRS-style icon placeholder - Consider replacing with an actual pixel art icon */}
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-accent">
                 <path fillRule="evenodd" d="M2 4.75A2.75 2.75 0 014.75 2h10.5A2.75 2.75 0 0118 4.75v10.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25V4.75zm6.75.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zm-3 3.5a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9zm0 3a.75.75 0 000 1.5h9a.75.75 0 000-1.5h-9z" clipRule="evenodd" />
               </svg>

              <h1 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">StudyQuest</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
               <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('overview')}
                  isActive={activeSection === 'overview'}
                  tooltip="Overview"
                >
                  <LayoutDashboard />
                  <span className="group-data-[collapsible=icon]:hidden">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('study')}
                  isActive={activeSection === 'study'}
                  tooltip="Study Tracker"
                >
                  <ListTodo />
                  <span className="group-data-[collapsible=icon]:hidden">Study Tracker</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('pomodoro')}
                  isActive={activeSection === 'pomodoro'}
                  tooltip="Pomodoro Timer"
                >
                  <Timer />
                  <span className="group-data-[collapsible=icon]:hidden">Pomodoro Timer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('levels')}
                  isActive={activeSection === 'levels'}
                  tooltip="Level System"
                >
                  <Award />
                  <span className="group-data-[collapsible=icon]:hidden">Level System</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setActiveSection('achievements')}
                  isActive={activeSection === 'achievements'}
                  tooltip="Achievements"
                >
                  <Trophy /> {/* Changed icon */}
                  <span className="group-data-[collapsible=icon]:hidden">Achievements</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter className="group-data-[collapsible=icon]:hidden">
             {/* Footer content if needed */}
             <p className="text-xs text-muted-foreground text-center">OSRS Inspired</p>
           </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 p-4 md:p-6 bg-background text-foreground">
          <div className="flex items-center justify-between mb-4 md:mb-6">
             <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden" />
                 <h2 className="text-xl font-semibold capitalize">
                    {activeSection === 'overview' && 'Dashboard Overview'}
                    {activeSection === 'study' && 'Study Task Manager'}
                    {activeSection === 'pomodoro' && 'Pomodoro Timer'}
                    {activeSection === 'levels' && 'Level Progression'}
                    {activeSection === 'achievements' && 'Achievements Log'}
                 </h2>
             </div>
            <div></div> {/* Placeholder for potential header actions */}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {activeSection === 'overview' && <Overview />}
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
