"use client";

import { Loader as LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({ className }: { className?: string }) {
  return <LoaderIcon className={cn("animate-spin", className)} />;
}
