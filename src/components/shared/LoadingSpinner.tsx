import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <Loader2 
      className={cn("animate-spin text-primary", className)} 
      size={size} 
    />
  );
}

export function FullPageLoading() {
  return (
    <div className="h-full w-full min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner size={48} />
    </div>
  );
}
