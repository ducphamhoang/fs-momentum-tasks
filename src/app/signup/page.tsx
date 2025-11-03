"use client";

import Link from "next/link";
import { SignUpForm } from "@/features/auth/presentation/SignUpForm";
import { AuthLayout } from "@/features/auth/presentation/AuthLayout";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/loader";

export default function SignUpPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);


    if (isUserLoading || user) {
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
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a sign up method below
        </p>
      </div>
      <SignUpForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Log In
        </Link>
      </p>
    </AuthLayout>
  );
}
