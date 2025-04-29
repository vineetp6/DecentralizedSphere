import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon } from "lucide-react";

interface DataMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
}

interface DataStatusCircleProps {
  score: number;
  metrics: DataMetric[];
}

export function DataStatusCircle({ score, metrics }: DataStatusCircleProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Data Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="h-36 w-36 rounded-full border-8 border-primary/30 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-semibold">{score.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Out of 10</div>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <LockIcon className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-muted p-3 rounded-md flex items-center space-x-2">
              {metric.icon}
              <div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
                <div className="text-sm font-medium">{metric.value.toFixed(1)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
