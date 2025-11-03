"use client";

import { useUser, useFirestore } from "@/firebase";
import { type Task } from "../domain/task";
import { TaskItem } from "./TaskItem";
import { doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { revalidateTasks } from "../application/actions";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export function TaskList({ tasks, onEdit }: TaskListProps) {
    const { user } = useUser();
    const firestore = useFirestore();

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    if (!user) return;
    const taskRef = doc(firestore, "users", user.uid, "tasks", taskId);
    await updateDoc(taskRef, {
        isCompleted: isCompleted,
        updatedAt: serverTimestamp(),
    });
    await revalidateTasks();
  };

  const handleDelete = async (taskId: string) => {
    if (!user) return;
    const taskRef = doc(firestore, "users", user.uid, "tasks", taskId);
    await deleteDoc(taskRef);
    await revalidateTasks();
  }

  if (tasks.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 py-20 text-center">
            <h3 className="text-xl font-semibold tracking-tight text-muted-foreground">You have no tasks yet.</h3>
            <p className="mt-2 text-muted-foreground">Click "New Task" to get started.</p>
        </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
