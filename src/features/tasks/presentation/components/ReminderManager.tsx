"use client";

import { useState } from "react";
import { Plus, Trash2, Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { type Reminder } from "../../domain/task";

interface ReminderManagerProps {
  reminders: Reminder[];
  onRemindersChange: (reminders: Reminder[]) => void;
  startTime?: string;
  dueDate?: Date | null;
}

export function ReminderManager({
  reminders,
  onRemindersChange,
  startTime,
  dueDate,
}: ReminderManagerProps) {
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);

  const handleDeleteReminder = (reminderId: string) => {
    const updatedReminders = reminders.filter((r) => r.id !== reminderId);
    onRemindersChange(updatedReminders);
    setDeleteReminderId(null);
  };

  const handleAddCustomReminder = () => {
    // For now, we'll rely on auto-generated reminders from time blocks
    // Custom reminder picker can be added in the future
  };

  const formatReminderTime = (reminder: Reminder) => {
    const triggerDate =
      reminder.triggerTime instanceof Timestamp
        ? reminder.triggerTime.toDate()
        : reminder.triggerTime;

    return format(triggerDate, "MMM d, yyyy 'at' h:mm a");
  };

  const getReminderStatus = (reminder: Reminder): "pending" | "notified" | "past" => {
    if (reminder.notified) return "notified";

    const triggerDate =
      reminder.triggerTime instanceof Timestamp
        ? reminder.triggerTime.toDate()
        : reminder.triggerTime;

    if (triggerDate < new Date()) return "past";

    return "pending";
  };

  const getStatusBadge = (status: "pending" | "notified" | "past") => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="default" className="text-xs">
            <Bell className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "notified":
        return (
          <Badge variant="secondary" className="text-xs">
            <BellOff className="h-3 w-3 mr-1" />
            Notified
          </Badge>
        );
      case "past":
        return (
          <Badge variant="outline" className="text-xs">
            <BellOff className="h-3 w-3 mr-1" />
            Past
          </Badge>
        );
    }
  };

  const hasTimeBlock = startTime && dueDate;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Reminders</label>
        {/* Removed custom reminder button - reminders are auto-generated from time blocks */}
      </div>

      {!hasTimeBlock && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <Bell className="h-4 w-4 inline mr-2" />
          Set a time block to automatically generate reminders (15 min & 5 min before)
        </div>
      )}

      {reminders.length === 0 && hasTimeBlock && (
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          No reminders configured. Time block reminders will be added automatically when you save.
        </div>
      )}

      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((reminder) => {
            const status = getReminderStatus(reminder);
            return (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 border rounded-md bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatReminderTime(reminder)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => setDeleteReminderId(reminder.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {hasTimeBlock && (
        <p className="text-xs text-muted-foreground">
          Reminders will be automatically updated when you change the time block.
        </p>
      )}

      <AlertDialog
        open={deleteReminderId !== null}
        onOpenChange={(open) => !open && setDeleteReminderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReminderId && handleDeleteReminder(deleteReminderId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
