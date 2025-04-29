import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  className?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DataCard({ title, className, children, actions }: DataCardProps) {
  return (
    <Card className={cn("shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
