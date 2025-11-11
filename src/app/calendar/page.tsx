"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { CalendarView } from "./CalendarView";
import { Loader } from "@/components/ui/loader";
import { Header } from "@/shared/presentation/components/Header";
import { collection, query, orderBy } from "firebase/firestore";
import { type Task } from "@/features/tasks/domain/task";

export default function CalendarPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, "users", user.uid, "tasks"), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);

  if (isUserLoading || tasksLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader className="h-10 w-10" />
        </main>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <CalendarView initialTasks={tasks || []} />
      </main>
    </div>
  );
}
