"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { type Task } from "../domain/task";
import { Button } from "@/components/ui/button";
import { TaskList } from "./TaskList";
import { CreateEditTaskDialog } from "./CreateEditTaskDialog";
import { AIPrioritizationDialog } from "./AIPrioritizationDialog";
import { prioritizeTasksAction } from "../application/actions";
import { useToast } from "@/hooks/use-toast";
import type { PrioritizeTasksOutput } from "@/ai/flows/ai-prioritize-tasks";
import { Loader } from "@/components/ui/loader";

interface DashboardProps {
  initialTasks: Task[];
}

export function Dashboard({ initialTasks }: DashboardProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResult, setAiResult] = useState<PrioritizeTasksOutput | null>(null);
  const { toast } = useToast();

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsCreateOpen(true);
  };

  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsCreateOpen(true);
  }

  const handleAIPrioritize = async () => {
    setIsAILoading(true);
    try {
        const result = await prioritizeTasksAction();
        setAiResult(result);
        setIsAIOpen(true);
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "AI Prioritization Failed",
            description: error.message || "Could not fetch AI suggestions."
        })
    } finally {
        setIsAILoading(false);
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Momentum</h1>
        <div className="flex items-center gap-2">
            <Button onClick={handleAIPrioritize} variant="outline" disabled={isAILoading}>
                {isAILoading ? <Loader className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Prioritize with AI
            </Button>
            <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
        </div>
      </div>
      
      <TaskList tasks={initialTasks} onEdit={handleEdit} />

      <CreateEditTaskDialog
        isOpen={isCreateOpen}
        setIsOpen={setIsCreateOpen}
        taskToEdit={taskToEdit}
      />
      
      <AIPrioritizationDialog 
        isOpen={isAIOpen}
        setIsOpen={setIsAIOpen}
        prioritizationResult={aiResult}
      />
    </div>
  );
}
