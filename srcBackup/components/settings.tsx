
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label} from '@/components/ui/label';
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
    // Remove onSettingsChange as it causes updates during render
    // onSettingsChange: (newSettings: PomodoroSettings, manualSave: boolean) => void;
    onManualSave: (newSettings: PomodoroSettings, manualSave: boolean) => void;
}


export function Settings({ settings: initialSettings, onManualSave }: SettingsProps) {
  // Use local state to manage form inputs immediately
  const [localSettings, setLocalSettings] = useState<PomodoroSettings>(initialSettings);
  const [isModified, setIsModified] = useState(false); // Track if settings have changed

  // Sync local state only if the initialSettings prop changes from the parent
  useEffect(() => {
    // Only update local state if the incoming prop is different from the current local state
    if (JSON.stringify(localSettings) !== JSON.stringify(initialSettings)) {
      setLocalSettings(initialSettings);
      setIsModified(false); // Reset modified state when synced from parent
    }
  }, [initialSettings]); // Only depend on initialSettings from props

  // Callback to update local state and mark as modified
  const handleChange = useCallback(<K extends keyof PomodoroSettings>(key: K, value: PomodoroSettings[K]) => {
    setLocalSettings(prev => {
        const newSettings = { ...prev, [key]: value };
        // Check if the new setting is different from the initial prop setting AFTER the state update
        // We need to compare the *newly created* newSettings with initialSettings
        if (JSON.stringify(newSettings) !== JSON.stringify(initialSettings)) {
            setIsModified(true);
        } else {
            setIsModified(false);
        }
        // DO NOT call the parent's state update function here.
        // This was causing the "Cannot update a component while rendering..." error.
        // onSettingsChange(newSettings, false); // REMOVED
        return newSettings; // Return the updated local state
    });
  }, [initialSettings]); // Remove onSettingsChange dependency

  const handleSliderChange = (key: keyof PomodoroSettings, value: number[]) => {
     handleChange(key, value[0]);
  };

  const handleSwitchChange = (key: keyof PomodoroSettings, checked: boolean) => {
     handleChange(key, checked);
  };

  // Handle manual save button click
   const handleSaveClick = () => {
       // Call the specific manual save handler passed from the parent
       // Pass true for manualSave flag here
       onManualSave(localSettings, true);
       setIsModified(false); // Reset modified state after saving
   };


  return (
    <Card className="osrs-box max-w-lg mx-auto"> {/* Ensure max-width */}
      <CardHeader className="pb-4 pt-3 px-4">
         <CardTitle className="text-lg font-semibold">Pomodoro Settings</CardTitle> {/* Added Title */}
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
          <Label htmlFor="enableNotifications" className="text-sm flex-1">
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
          <Label htmlFor="enableAutostart" className="text-sm flex-1">
            Autostart Timers (Breaks & Next Work)
          </Label>
          <Switch
            id="enableAutostart"
            checked={localSettings.enableAutostart}
            onCheckedChange={(checked) => handleSwitchChange('enableAutostart', checked)}
            aria-label="Autostart Timers"
          />
        </div>
         {/* Save Button */}
            <div className={cn("mt-4 flex justify-end transition-opacity duration-300", isModified ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <Button onClick={handleSaveClick} className="w-full md:w-auto" variant="default"> {/* Changed variant */}
                    Save Settings
                </Button>
            </div>
      </CardContent>
    </Card>
  );
}

export default Settings;
