import { Loader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader className="h-12 w-12" />
    </div>
  );
}
