# **App Name**: FocusFriend

*(Originally conceived as StudyQuest)*

## Core Features:

*   **Study Tracker:** Task management (add, complete, edit, delete, prioritize) with integrated time tracking per task. Awards overall XP for time spent and task completion.
*   **Pomodoro Timer:** Customizable Pomodoro timer (work/short/long breaks) featuring a visual "Focus Crystal" that grows during active work sessions and resets/withers if paused. Awards overall XP and grows a crystal upon successful work session completion.
*   **Overall Level System:** Gamified overall user level based on XP earned from study time (via task timer or Pomodoro work sessions) and task/Pomodoro completion bonuses. Includes a display of recent XP gains (XP History).
*   **Achievements:** Unlockable milestones based on user statistics (tasks completed, total study time, overall level reached, Pomodoro sessions, crystals grown).
*   **Overview Dashboard:** Displays key statistics (total study time, tasks completed/rate, current level progress, Pomodoro sessions, grown crystals) and a chart visualizing the top 5 tasks by study time.
*   **Settings:** Configuration panel for Pomodoro timer durations (work, short/long break), sessions before long break, and behavior (autostart timers, notifications - *notification logic not fully implemented yet*).

## Style Guidelines:

*   **Theme:** Old School RuneScape (OSRS) inspired visual aesthetic.
*   **Palette:** Utilizes a custom OSRS-themed palette defined in `globals.css` (e.g., dark background, parchment foreground, green primary, gold accent, brown secondary).
*   **Font:** `VT323` pixel font applied globally.
*   **Rendering:** `image-rendering: pixelated` for sharp pixel art look.
*   **Layout:** Structured layout featuring a collapsible icon-based sidebar (`@/components/ui/sidebar.tsx`) and a main content area.
*   **Components:** Leverages Shadcn/ui components heavily customized with Tailwind CSS, including specific OSRS styles like `osrs-box` and `osrs-inner-bevel`. Sharp corners (`radius: 0.125rem`) are used.
*   **Icons:** Uses Lucide React icons, styled consistently (often with `strokeWidth={1.5}`).
*   **Animations:** Subtle transitions for UI elements (e.g., toasts, accordions, sidebar collapse). Focus Crystal has growth visualization.

## Original User Request:

App to track my studying with task management, pomodoro timer, gamified XP and loot system and achievements. *(Note: Loot system is not currently implemented)*.