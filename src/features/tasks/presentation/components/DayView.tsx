"use client";

import { useState, useMemo } from "react";
import { format, startOfDay, addHours } from "date-fns";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { type Task } from "../../domain/task";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DayViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

interface TimeSlot {
  hour: number;
  label: string;
  tasks: Task[];
}

/**
 * DayView Component
 *
 * Displays tasks in a calendar day view with hourly time slots.
 * Features:
 * - Shows 24-hour day view with hourly slots
 * - Displays scheduled tasks in their time blocks
 * - Detects and highlights conflicting time blocks
 * - Allows navigation between dates
 * - Shows current time indicator
 */
export function DayView({ tasks, onTaskClick, className }: DayViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter tasks for selected date with time blocks
  const scheduledTasks = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = addHours(dayStart, 24);

    return tasks.filter((task) => {
      if (!task.startTime || !task.endTime || !task.dueDate) {
        return false;
      }

      const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      const taskDayStart = startOfDay(taskDate);

      return taskDayStart.getTime() === dayStart.getTime();
    });
  }, [tasks, selectedDate]);

  // Generate time slots (24 hours)
  const timeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const label = format(addHours(startOfDay(new Date()), hour), "ha");
      const slotTasks = scheduledTasks.filter((task) => {
        const [startHour] = task.startTime!.split(":").map(Number);
        return startHour === hour;
      });

      slots.push({
        hour,
        label,
        tasks: slotTasks,
      });
    }

    return slots;
  }, [scheduledTasks]);

  // Detect conflicts
  const conflicts = useMemo(() => {
    const conflictSet = new Set<string>();

    for (let i = 0; i < scheduledTasks.length; i++) {
      for (let j = i + 1; j < scheduledTasks.length; j++) {
        const task1 = scheduledTasks[i];
        const task2 = scheduledTasks[j];

        if (hasTimeConflict(task1, task2)) {
          conflictSet.add(task1.id);
          conflictSet.add(task2.id);
        }
      }
    }

    return conflictSet;
  }, [scheduledTasks]);

  const handlePreviousDay = () => {
    setSelectedDate((prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = startOfDay(selectedDate).getTime() === startOfDay(new Date()).getTime();
  const currentHour = isToday ? new Date().getHours() : -1;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Day View
            </CardTitle>
            <CardDescription>
              {scheduledTasks.length} scheduled task{scheduledTasks.length !== 1 ? "s" : ""} for{" "}
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {format(selectedDate, "MMM d")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday && (
              <Button variant="default" size="sm" onClick={handleToday}>
                Today
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto">
          {timeSlots.map((slot) => (
            <div
              key={slot.hour}
              className={cn(
                "flex border-b transition-colors",
                slot.hour === currentHour && "bg-primary/5"
              )}
            >
              {/* Time label */}
              <div className="w-20 flex-shrink-0 border-r p-3 text-sm font-medium text-muted-foreground">
                {slot.label}
              </div>

              {/* Task area */}
              <div className="flex-1 min-h-[60px] p-2">
                {slot.tasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    {slot.hour === currentHour && isToday && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Current time</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slot.tasks.map((task) => {
                      const hasConflict = conflicts.has(task.id);
                      const duration = calculateDuration(task.startTime!, task.endTime!);

                      return (
                        <button
                          key={task.id}
                          onClick={() => onTaskClick?.(task)}
                          className={cn(
                            "w-full text-left p-3 rounded-md border transition-all hover:shadow-md",
                            task.isCompleted && "opacity-50",
                            hasConflict
                              ? "border-destructive bg-destructive/10"
                              : "border-primary bg-primary/10 hover:bg-primary/20"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4
                                className={cn(
                                  "font-medium text-sm truncate",
                                  task.isCompleted && "line-through"
                                )}
                              >
                                {task.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {task.startTime} - {task.endTime}
                                </span>
                                <span className="text-muted-foreground">({duration})</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={
                                  task.importanceLevel === "high"
                                    ? "destructive"
                                    : task.importanceLevel === "medium"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-xs capitalize"
                              >
                                {task.importanceLevel}
                              </Badge>
                              {hasConflict && (
                                <Badge variant="destructive" className="text-xs">
                                  Conflict
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {scheduledTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No scheduled tasks</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Add time blocks to your tasks to see them here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Check if two tasks have overlapping time blocks
 */
function hasTimeConflict(task1: Task, task2: Task): boolean {
  if (!task1.startTime || !task1.endTime || !task2.startTime || !task2.endTime) {
    return false;
  }

  const [start1Hours, start1Minutes] = task1.startTime.split(":").map(Number);
  const [end1Hours, end1Minutes] = task1.endTime.split(":").map(Number);
  const [start2Hours, start2Minutes] = task2.startTime.split(":").map(Number);
  const [end2Hours, end2Minutes] = task2.endTime.split(":").map(Number);

  const start1 = start1Hours * 60 + start1Minutes;
  const end1 = end1Hours * 60 + end1Minutes;
  const start2 = start2Hours * 60 + start2Minutes;
  const end2 = end2Hours * 60 + end2Minutes;

  // Check for overlap: task1 starts before task2 ends AND task2 starts before task1 ends
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate duration string from start and end time
 */
function calculateDuration(startTime: string, endTime: string): string {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  const diffMinutes = endTotalMinutes - startTotalMinutes;

  if (diffMinutes <= 0) {
    return "0m";
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

  return durationStr.trim();
}
