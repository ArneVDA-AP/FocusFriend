
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number; // rounds
  enableNotifications: boolean;
  enableAutostart: boolean;
}

export const FOCUSFRIEND_SETTINGS_KEY = 'focusFriendSettings';

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  enableNotifications: true,
  enableAutostart: false,
};

export default function Settings() {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem(FOCUSFRIEND_SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge with defaults to ensure all keys are present
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        setSettings(defaultSettings); // Reset to defaults on error
      }
    } else {
        setSettings(defaultSettings); // Set defaults if nothing is stored
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FOCUSFRIEND_SETTINGS_KEY, JSON.stringify(settings));
     // Optional: Dispatch an event if live updates are needed in other components
     // window.dispatchEvent(new CustomEvent('settingsUpdate'));
  }, [settings]);

  const handleSliderChange = (key: keyof PomodoroSettings, value: number[]) => {
    setSettings((prev) => ({ ...prev, [key]: value[0] }));
  };

  const handleSwitchChange = (key: keyof PomodoroSettings, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <Card className="osrs-box">
      <CardHeader className="pb-4 pt-3 px-4">
        <CardTitle className="text-base font-semibold">Pomodoro Timer Settings</CardTitle>
        <CardDescription className="text-xs">Customize your focus sessions and breaks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        {/* Work Duration */}
        <div className="space-y-2">
          <Label htmlFor="workDuration" className="flex justify-between items-center text-sm">
            <span>Work Duration</span>
            <span className="text-muted-foreground">{settings.workDuration} min</span>
          </Label>
          <Slider
            id="workDuration"
            min={5}
            max={60}
            step={5}
            value={[settings.workDuration]}
            onValueChange={(value) => handleSliderChange('workDuration', value)}
            aria-label="Work Duration"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 min</span>
            <span>60 min</span>
          </div>
        </div>

        {/* Short Break Duration */}
        <div className="space-y-2">
          <Label htmlFor="shortBreakDuration" className="flex justify-between items-center text-sm">
            <span>Short Break Duration</span>
            <span className="text-muted-foreground">{settings.shortBreakDuration} min</span>
          </Label>
          <Slider
            id="shortBreakDuration"
            min={1}
            max={30}
            step={1}
            value={[settings.shortBreakDuration]}
            onValueChange={(value) => handleSliderChange('shortBreakDuration', value)}
            aria-label="Short Break Duration"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 min</span>
            <span>30 min</span>
          </div>
        </div>

        {/* Long Break Duration */}
        <div className="space-y-2">
          <Label htmlFor="longBreakDuration" className="flex justify-between items-center text-sm">
            <span>Long Break Duration</span>
            <span className="text-muted-foreground">{settings.longBreakDuration} min</span>
          </Label>
          <Slider
            id="longBreakDuration"
            min={5}
            max={45}
            step={5}
            value={[settings.longBreakDuration]}
            onValueChange={(value) => handleSliderChange('longBreakDuration', value)}
            aria-label="Long Break Duration"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 min</span>
            <span>45 min</span>
          </div>
        </div>

         {/* Sessions Before Long Break (Rounds) */}
        <div className="space-y-2">
          <Label htmlFor="sessionsBeforeLongBreak" className="flex justify-between items-center text-sm">
            <span>Sessions Before Long Break</span>
            <span className="text-muted-foreground">{settings.sessionsBeforeLongBreak} sessions</span>
          </Label>
          <Slider
            id="sessionsBeforeLongBreak"
            min={2}
            max={12} // Adjusted max rounds
            step={1}
            value={[settings.sessionsBeforeLongBreak]}
            onValueChange={(value) => handleSliderChange('sessionsBeforeLongBreak', value)}
            aria-label="Sessions Before Long Break"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2</span>
            <span>12</span>
          </div>
        </div>

        {/* Notification Toggle */}
        <div className="flex items-center justify-between space-x-2 pt-2">
          <Label htmlFor="enableNotifications" className="text-sm">
            Enable Notifications
          </Label>
          <Switch
            id="enableNotifications"
            checked={settings.enableNotifications}
            onCheckedChange={(checked) => handleSwitchChange('enableNotifications', checked)}
            aria-label="Enable Notifications"
          />
        </div>

        {/* Autostart Toggle */}
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="enableAutostart" className="text-sm">
            Autostart Timers
          </Label>
          <Switch
            id="enableAutostart"
            checked={settings.enableAutostart}
            onCheckedChange={(checked) => handleSwitchChange('enableAutostart', checked)}
            aria-label="Autostart Timers"
          />
        </div>

        {/* Dark Mode Toggle - Example Only, functional implementation depends on theme setup */}
         {/* <div className="flex items-center justify-between space-x-2">
           <Label htmlFor="darkMode" className="text-sm">
             Dark Mode (Visual Only)
           </Label>
           <Switch
             id="darkMode"
             // checked={isDarkMode} // Replace with your dark mode state logic
             // onCheckedChange={toggleDarkMode} // Replace with your dark mode toggle function
             aria-label="Toggle Dark Mode"
             disabled // Disable if not functionally implemented
           />
         </div> */}

         {/* Additional settings like Notification Sound and Week Starts On are omitted */}
         {/* as they require more complex implementation (audio handling, date logic) */}

      </CardContent>
    </Card>
  );
}
