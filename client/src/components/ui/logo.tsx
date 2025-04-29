import { cn } from "@/lib/utils";
import { Database } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      <Database className={cn("text-primary", sizeClasses[size])} />
      {showText && (
        <span className={cn("ml-2 font-semibold", sizeClasses[size])}>
          DataHub
        </span>
      )}
    </div>
  );
}
