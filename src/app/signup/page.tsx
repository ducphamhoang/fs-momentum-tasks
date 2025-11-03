"use client";

import Link from "next/link";
import { SignUpForm } from "@/features/auth/presentation/SignUpForm";
import { AuthLayout } from "@/features/auth/presentation/AuthLayout";
import { useAuth } from "@/features/auth/presentation/use-auth.hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);


    if (loading || user) {
        return null;
    }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email below to create your account
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
