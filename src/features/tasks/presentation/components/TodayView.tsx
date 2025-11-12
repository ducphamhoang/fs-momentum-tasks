"use client";

import { useMemo } from "react";
import { format, startOfDay, isToday as isTodayFn } from "date-fns";
import { Clock, CalendarCheck } from "lucide-react";
import { type Task } from "../../domain/task";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface TodayViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => void;
  className?: string;
}

interface TimeBlock {
  task: Task;
  hasConflict: boolean;
}

/**
 * TodayView Component
 *
 * A compact view showing today's scheduled tasks.
 * Features:
 * - Shows only tasks scheduled for today
 * - Groups tasks chronologically
 * - Highlights current or upcoming time block
 * - Shows completion status
 * - Detects conflicts
 */
export function TodayView({
  tasks,
  onTaskClick,
  onToggleComplete,
  className,
}: TodayViewProps) {
  // Filter and sort today's tasks
  const todaysTasks = useMemo(() => {
    const today = startOfDay(new Date());

    return tasks
      .filter((task) => {
        if (!task.startTime || !task.endTime || !task.dueDate) {
          return false;
        }

        const taskDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        const taskDayStart = startOfDay(taskDate);

        return taskDayStart.getTime() === today.getTime();
      })
      .sort((a, b) => {
        // Sort by start time
        const timeA = a.startTime || "00:00";
        const timeB = b.startTime || "00:00";
        return timeA.localeCompare(timeB);
      });
  }, [tasks]);

  // Detect conflicts
  const timeBlocks = useMemo((): TimeBlock[] => {
    return todaysTasks.map((task) => {
      let hasConflict = false;

      // Check if this task conflicts with any other task
      for (const otherTask of todaysTasks) {
        if (otherTask.id !== task.id && hasTimeConflict(task, otherTask)) {
          hasConflict = true;
          break;
        }
      }

      return { task, hasConflict };
    });
  }, [todaysTasks]);

  // Determine current/next task
  const currentTime = new Date();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const currentOrNextTaskIndex = useMemo(() => {
    for (let i = 0; i < timeBlocks.length; i++) {
      const task = timeBlocks[i].task;
      const [endHours, endMinutes] = task.endTime!.split(":").map(Number);
      const endTotalMinutes = endHours * 60 + endMinutes;

      // If task hasn't ended yet, it's current or upcoming
      if (endTotalMinutes > currentMinutes) {
        return i;
      }
    }
    return -1;
  }, [timeBlocks, currentMinutes]);

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" />
          Today's Schedule
        </CardTitle>
        <CardDescription>
          {format(new Date(), "EEEE, MMMM d, yyyy")} • {timeBlocks.length} scheduled task
          {timeBlocks.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timeBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No scheduled tasks today</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Enjoy your free day or schedule some time blocks
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeBlocks.map(({ task, hasConflict }, index) => {
              const isCurrent = index === currentOrNextTaskIndex;
              const isPast = currentOrNextTaskIndex > index;
              const duration = calculateDuration(task.startTime!, task.endTime!);

              return (
                <button
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all",
                    isCurrent && "ring-2 ring-primary border-primary bg-primary/5",
                    isPast && !task.isCompleted && "opacity-60",
                    task.isCompleted && "opacity-50 bg-muted/50",
                    !isCurrent && !task.isCompleted && "hover:bg-accent",
                    hasConflict && "border-destructive bg-destructive/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    {onToggleComplete && (
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={(checked) => {
                          onToggleComplete(task.id, !!checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                      />
                    )}

                    {/* Time */}
                    <div className="flex flex-col items-center text-xs font-medium text-muted-foreground w-16 flex-shrink-0">
                      <span>{task.startTime}</span>
                      <span className="text-[10px]">to</span>
                      <span>{task.endTime}</span>
                    </div>

                    {/* Vertical line */}
                    <div
                      className={cn(
                        "w-1 rounded-full self-stretch",
                        isCurrent && "bg-primary",
                        hasConflict && "bg-destructive",
                        !isCurrent && !hasConflict && "bg-border"
                      )}
                    />

                    {/* Task details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4
                          className={cn(
                            "font-semibold text-sm",
                            task.isCompleted && "line-through"
                          )}
                        >
                          {task.title}
                        </h4>
                        <Badge
                          variant={
                            task.importanceLevel === "high"
                              ? "destructive"
                              : task.importanceLevel === "medium"
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs capitalize flex-shrink-0"
                        >
                          {task.importanceLevel}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {duration}
                        </Badge>

                        {hasConflict && (
                          <Badge variant="destructive" className="text-xs">
                            Time Conflict
                          </Badge>
                        )}

                        {isCurrent && !task.isCompleted && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}

                        {isPast && !task.isCompleted && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
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

  // Check for overlap
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
