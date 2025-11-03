"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/shared/presentation/components/Header";
import { getTasksAction } from "@/features/tasks/application/actions";
import { type Task } from "@/features/tasks/domain/task";
import { Dashboard } from "@/features/tasks/presentation/Dashboard";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icons } from "@/shared/presentation/components/icons";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && user) {
      getTasksAction()
        .then(setTasks)
        .finally(() => setTasksLoading(false));
    }
    if (!isUserLoading && !user) {
        setTasksLoading(false);
    }
  }, [user, isUserLoading, router]);


  const renderContent = () => {
    if (isUserLoading || (user && tasksLoading)) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader className="h-10 w-10" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex-1">
            <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                    <Icons.logo className="h-20 w-20 text-primary" />
                    <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
                        Gain Momentum on Your Tasks
                    </h1>
                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        An intelligent to-do list that helps you organize, focus, and manage your time effectively.
                    </p>
                    <div className="space-x-4">
                        <Button asChild size="lg">
                            <Link href="/signup">Get Started</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/login">Login</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
      );
    }

    return <Dashboard initialTasks={tasks} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
}
