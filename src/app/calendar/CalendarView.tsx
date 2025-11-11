"use client";

import { useState } from "react";
import { type Task } from "@/features/tasks/domain/task";
import { DayView } from "@/features/tasks/presentation/components/DayView";
import { TodayView } from "@/features/tasks/presentation/components/TodayView";
import { CreateEditTaskDialog } from "@/features/tasks/presentation/CreateEditTaskDialog";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { revalidateTasks } from "@/features/tasks/application/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CalendarViewProps {
  initialTasks: Task[];
}

export function CalendarView({ initialTasks }: CalendarViewProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setTaskToEdit(task);
    setIsDialogOpen(true);
  };

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    if (!user) return;

    const taskRef = doc(firestore, "users", user.uid, "tasks", taskId);
    await updateDoc(taskRef, {
      isCompleted: isCompleted,
      updatedAt: serverTimestamp(),
    });
    await revalidateTasks();
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your time-blocked tasks
        </p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="day">Day View</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <TodayView
            tasks={initialTasks}
            onTaskClick={handleTaskClick}
            onToggleComplete={handleToggleComplete}
          />
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <DayView tasks={initialTasks} onTaskClick={handleTaskClick} />
        </TabsContent>
      </Tabs>

      <CreateEditTaskDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
