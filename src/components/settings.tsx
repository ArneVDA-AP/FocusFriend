'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

interface SettingsProps {
    settings: PomodoroSettings;
    onSettingsChange: (newSettings: PomodoroSettings) => void;
}


export default function Settings({ settings: initialSettings, onSettingsChange }: SettingsProps) {
  // Use local state to manage form inputs immediately, debouncing or updating parent on change
  const [localSettings, setLocalSettings] = useState<PomodoroSettings>(initialSettings);

  // Sync local state if the prop changes from the parent
  useEffect(() => {
    setLocalSettings(initialSettings);
  }, [initialSettings]);


  // Callback to update local state and notify parent
  const handleChange = useCallback(<K extends keyof PomodoroSettings>(key: K, value: PomodoroSettings[K]) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings); // Notify parent immediately or use debounce/save button
  }, [localSettings, onSettingsChange]);

  const handleSliderChange = (key: keyof PomodoroSettings, value: number[]) => {
     handleChange(key, value[0]);
  };

  const handleSwitchChange = (key: keyof PomodoroSettings, checked: boolean) => {
     handleChange(key, checked);
  };


  return (
    <Card className="osrs-box mx-auto">
      <CardHeader className="pb-4 pt-3 px-4">
        <CardTitle className="text-base font-semibold">Pomodoro Timer Settings</CardTitle>
        <CardDescription className="text-xs">Customize your focus sessions and breaks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        {/* Work Duration */}
        <div className="space-y-2">
          <Label htmlFor="workDuration" className="flex justify-between items-center text-sm">
            <span>Work Duration</span>
            <span className="text-muted-foreground">{localSettings.workDuration} min</span>
          </Label>
          <Slider
            id="workDuration"
            min={5}
            max={60}
            step={5}
            value={[localSettings.workDuration]}
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
            <span className="text-muted-foreground">{localSettings.shortBreakDuration} min</span>
          </Label>
          <Slider
            id="shortBreakDuration"
            min={1}
            max={30}
            step={1}
            value={[localSettings.shortBreakDuration]}
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
            <span className="text-muted-foreground">{localSettings.longBreakDuration} min</span>
          </Label>
          <Slider
            id="longBreakDuration"
            min={5}
            max={45}
            step={5}
            value={[localSettings.longBreakDuration]}
            onValueChange={(value) => handleSliderChange('longBreakDuration', value)}
            aria-label="Long Break Duration"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 min</span>
            <span>45 min</span>
          </div>
        </div>

         {/* Sessions Before Long Break */}
        <div className="space-y-2">
          <Label htmlFor="sessionsBeforeLongBreak" className="flex justify-between items-center text-sm">
            <span>Sessions Before Long Break</span>
            <span className="text-muted-foreground">{localSettings.sessionsBeforeLongBreak} sessions</span>
          </Label>
          <Slider
            id="sessionsBeforeLongBreak"
            min={2}
            max={12}
            step={1}
            value={[localSettings.sessionsBeforeLongBreak]}
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
            checked={localSettings.enableNotifications}
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
            checked={localSettings.enableAutostart}
            onCheckedChange={(checked) => handleSwitchChange('enableAutostart', checked)}
            aria-label="Autostart Timers"
          />
        </div>

      </CardContent>
    </Card>
  );
}
