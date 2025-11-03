"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { PrioritizeTasksOutput } from "@/ai/flows/ai-prioritize-tasks";
import { Lightbulb, CalendarX2 } from "lucide-react";

interface AIPrioritizationDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  prioritizationResult: PrioritizeTasksOutput | null;
}

export function AIPrioritizationDialog({
  isOpen,
  setIsOpen,
  prioritizationResult,
}: AIPrioritizationDialogProps) {
    const sortedTasks = prioritizationResult?.prioritizedTasks.sort((a,b) => a.suggestedPriority - b.suggestedPriority) ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Prioritization Suggestions</DialogTitle>
          <DialogDescription>
            Here is what our AI suggests for your task list. Tasks are ordered from highest to lowest priority.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
            {sortedTasks.length > 0 ? sortedTasks.map((task, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge>Priority: {task.suggestedPriority}</Badge>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
                        <p><span className="font-medium text-foreground">Reasoning:</span> {task.reasoning}</p>
                    </div>

                    {task.rescheduleSuggestion && (
                        <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
                             <CalendarX2 className="mt-1 h-4 w-4 shrink-0" />
                            <p><span className="font-medium text-foreground">Suggestion:</span> {task.rescheduleSuggestion}</p>
                        </div>
                    )}
                </div>
            )) : <p className="text-center text-muted-foreground">No tasks to prioritize.</p>}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
