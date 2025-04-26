"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// Keep the Progress primitive root but remove default styling
// Custom styling will be applied directly where used (e.g., osrs-progress-bar)
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative w-full overflow-hidden", // Minimal base styles
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
       className="h-full w-full flex-1 bg-transparent transition-all" // Transparent indicator, actual style applied elsewhere
       style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
