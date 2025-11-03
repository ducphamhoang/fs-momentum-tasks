"use client";

import { useOptimistic } from "react";
import { type Task } from "../domain/task";
import { TaskItem } from "./TaskItem";
import { toggleTaskCompletionAction, deleteTaskAction } from "../application/actions";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export function TaskList({ tasks, onEdit }: TaskListProps) {
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (state, { action, task, taskId }: { action: 'add' | 'update' | 'delete', task?: Task, taskId?: string }) => {
      switch (action) {
        case 'add':
          return task ? [task, ...state] : state;
        case 'update':
          return state.map(t => t.id === task?.id ? { ...t, ...task } : t);
        case 'delete':
            return state.filter(t => t.id !== taskId);
        default:
          return state;
      }
    }
  );

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if(task) {
        setOptimisticTasks({ action: 'update', task: { ...task, isCompleted } });
        await toggleTaskCompletionAction(taskId, isCompleted);
    }
  };

  const handleDelete = async (taskId: string) => {
    setOptimisticTasks({ action: 'delete', taskId });
    await deleteTaskAction(taskId);
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
      {optimisticTasks.map((task) => (
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
