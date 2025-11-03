"use client";

import { Clock, MoreHorizontal, Trash2, Edit, Calendar } from "lucide-react";
import { format } from "date-fns";
import { type Task } from "../domain/task";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onDelete: (taskId:string) => void;
  onEdit: (task: Task) => void;
}

const importanceVariantMap: { [key: string]: "destructive" | "secondary" | "default" } = {
    high: "destructive",
    medium: "secondary",
    low: "default",
};

export function TaskItem({ task, onToggleComplete, onDelete, onEdit }: TaskItemProps) {
  const isMeeting = task.startTime && task.endTime;

  return (
    <Card className={cn("transition-opacity", task.isCompleted && "opacity-50")}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.isCompleted}
          onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
          className="mt-1"
        />
        <div className="grid gap-1.5 flex-1">
          <CardTitle className={cn("text-lg", task.isCompleted && "line-through")}>
            {task.title}
          </CardTitle>
          {task.description && (
            <CardDescription className="leading-relaxed">
              {task.description}
            </CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {(task.dueDate || isMeeting || task.importanceLevel) && (
        <CardFooter className="flex-wrap gap-2 p-4 pt-0">
            <Badge variant={importanceVariantMap[task.importanceLevel] || 'default'} className="capitalize">{task.importanceLevel}</Badge>
            {task.dueDate && (
                <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.dueDate), "MMM d")}
                </Badge>
            )}
            {isMeeting && (
                <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {task.startTime} - {task.endTime}
                </Badge>
            )}
        </CardFooter>
      )}
    </Card>
  );
}
