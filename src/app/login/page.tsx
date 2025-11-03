"use client";

import Link from "next/link";
import { LoginForm } from "@/features/auth/presentation/LoginForm";
import { AuthLayout } from "@/features/auth/presentation/AuthLayout";
import { useAuth } from "@/features/auth/presentation/use-auth.hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/loader";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);


    if (loading || user) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader className="h-12 w-12" />
        </div>
      );
    }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a sign in method below
        </p>
      </div>
      <LoginForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
