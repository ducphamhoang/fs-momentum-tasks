"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeBlockPickerProps {
  startTime?: string;
  endTime?: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * TimeBlockPicker Component
 *
 * A component for selecting start and end times for time blocking.
 * Features:
 * - Validates that end time is after start time
 * - Calculates and displays duration
 * - Shows visual feedback for invalid time ranges
 */
export function TimeBlockPicker({
  startTime = "",
  endTime = "",
  onStartTimeChange,
  onEndTimeChange,
  className,
  disabled = false,
}: TimeBlockPickerProps) {
  const [duration, setDuration] = useState<string>("");
  const [isValidRange, setIsValidRange] = useState<boolean>(true);

  // Calculate duration whenever start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      const result = calculateDuration(startTime, endTime);
      setDuration(result.duration);
      setIsValidRange(result.isValid);
    } else {
      setDuration("");
      setIsValidRange(true);
    }
  }, [startTime, endTime]);

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStartTimeChange(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEndTimeChange(e.target.value);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Schedule time block</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={handleStartTimeChange}
            disabled={disabled}
            className={cn(
              !isValidRange && startTime && endTime && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-time">End Time</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={handleEndTimeChange}
            disabled={disabled}
            className={cn(
              !isValidRange && startTime && endTime && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>
      </div>

      {/* Duration display */}
      {duration && (
        <div className="flex items-center gap-2">
          {isValidRange ? (
            <Badge variant="secondary" className="text-xs">
              Duration: {duration}
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Invalid: End time must be after start time
            </Badge>
          )}
        </div>
      )}

      {/* Helper text */}
      {!startTime && !endTime && (
        <p className="text-xs text-muted-foreground">
          Set start and end times to block time on your calendar
        </p>
      )}
    </div>
  );
}

/**
 * Calculate duration between two time strings (HH:MM format)
 * @returns Object with duration string and validity flag
 */
function calculateDuration(startTime: string, endTime: string): {
  duration: string;
  isValid: boolean;
} {
  try {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    const diffMinutes = endTotalMinutes - startTotalMinutes;

    if (diffMinutes <= 0) {
      return { duration: "", isValid: false };
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    let durationStr = "";
    if (hours > 0) {
      durationStr += `${hours}h`;
    }
    if (minutes > 0) {
      durationStr += ` ${minutes}m`;
    }

    return {
      duration: durationStr.trim(),
      isValid: true,
    };
  } catch {
    return { duration: "", isValid: false };
  }
}
