import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

export function LoadingSpinner({ 
  className, 
  size = 'md', 
  fullScreen = false, 
  text 
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeMap[size],
        className
      )} />
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
