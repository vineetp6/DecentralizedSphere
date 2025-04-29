import { Pipeline } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PipelineStatusProps {
  pipeline: Pipeline;
  onClick?: (pipeline: Pipeline) => void;
  className?: string;
}

export function PipelineStatus({ pipeline, onClick, className }: PipelineStatusProps) {
  const { buildNumber, status, startTime, repositoryId } = pipeline;
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-success/20 text-success';
      case 'failed':
        return 'bg-error/20 text-error';
      case 'running':
        return 'bg-primary/20 text-primary';
      case 'pending':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-secondary/20 text-secondary-foreground';
    }
  };

  return (
    <Card 
      className={cn(
        "bg-background-elevated p-3 flex justify-between items-center", 
        onClick && "cursor-pointer hover:bg-muted/20 transition-colors",
        className
      )}
      onClick={onClick ? () => onClick(pipeline) : undefined}
    >
      <div>
        <h3 className="font-medium text-sm">Pipeline Build #{buildNumber}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Repository #{repositoryId} • {formatDistanceToNow(new Date(startTime), { addSuffix: true })}
        </p>
      </div>
      <Badge className={getStatusBadge(status)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    </Card>
  );
}
