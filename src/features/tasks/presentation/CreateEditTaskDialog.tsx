"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useFirestore, useUser } from "@/firebase";
import { addDoc, collection, doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";

import { CreateTaskSchema, type Task, type CreateTaskInput } from "../domain/task";
import { revalidateTasks } from "../application/actions";


interface CreateEditTaskDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  taskToEdit?: Task | null;
}

export function CreateEditTaskDialog({
  isOpen,
  setIsOpen,
  taskToEdit,
}: CreateEditTaskDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!taskToEdit;

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: isEditMode && taskToEdit ? {
      title: taskToEdit.title,
      description: taskToEdit.description || "",
      importanceLevel: taskToEdit.importanceLevel,
      dueDate: taskToEdit.dueDate instanceof Date ? taskToEdit.dueDate : null,
      startTime: taskToEdit.startTime || "",
      endTime: taskToEdit.endTime || "",
      timeEstimate: taskToEdit.timeEstimate || "",
    } : {
      title: "",
      description: "",
      importanceLevel: "medium",
      dueDate: null, // Changed from undefined to null to match the schema
      startTime: "",
      endTime: "",
      timeEstimate: "",
    },
  });

  // When the dialog opens or task data changes, reset the form with the latest task data
  useEffect(() => {
    if (isOpen && isEditMode && taskToEdit) {
      form.reset({
        title: taskToEdit.title,
        description: taskToEdit.description || "",
        importanceLevel: taskToEdit.importanceLevel,
        dueDate: taskToEdit.dueDate instanceof Date ? taskToEdit.dueDate : null,
        startTime: taskToEdit.startTime || "",
        endTime: taskToEdit.endTime || "",
        timeEstimate: taskToEdit.timeEstimate || "",
      });
    } else if (isOpen && !isEditMode) {
        form.reset({
            title: "",
            description: "",
            importanceLevel: "medium",
            dueDate: null,
            startTime: "",
            endTime: "",
            timeEstimate: "",
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskToEdit, isEditMode]);
  
  const handleOpenChange = (open: boolean) => {
    if (!isLoading) {
      setIsOpen(open);
    }
  };

  async function onSubmit(values: CreateTaskInput) {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in." });
        return;
    }

    setIsLoading(true);

    const taskData: any = {
      ...values,
      userId: user.uid,
      updatedAt: serverTimestamp(),
      dueDate: values.dueDate ? Timestamp.fromDate(values.dueDate) : null,
    };

    try {
      if (isEditMode && taskToEdit) {
        const taskRef = doc(firestore, "users", user.uid, "tasks", taskToEdit.id);
        await setDoc(taskRef, taskData, { merge: true });
        toast({ title: "Task updated successfully!" });
      } else {
        taskData.isCompleted = false;
        taskData.createdAt = serverTimestamp();
        const collectionRef = collection(firestore, "users", user.uid, "tasks");
        await addDoc(collectionRef, taskData);
        toast({ title: "Task created successfully!" });
      }
      await revalidateTasks();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error saving task:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of your task." : "Add a new task to your list. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Finish project proposal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details about the task..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="importanceLevel"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Importance</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select importance" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Time (Optional)</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End Time (Optional)</FormLabel>
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="timeEstimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Estimate (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. 2 hours" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader className="mr-2 h-4 w-4" />}
                {isEditMode ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
