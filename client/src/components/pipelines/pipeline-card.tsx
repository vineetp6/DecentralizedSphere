import { Pipeline } from "@/lib/database";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PipelineCardProps {
  pipeline: Pipeline;
  showRepository?: boolean;
}

export function PipelineCard({ pipeline, showRepository = false }: PipelineCardProps) {
  // Format the creation date
  const timeAgo = formatDistanceToNow(new Date(pipeline.createdAt), { addSuffix: true });
  
  // Get badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-success/20 text-success font-normal">
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-destructive/20 text-destructive font-normal">
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="outline" className="bg-warning/20 text-warning font-normal">
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted/40 text-muted-foreground font-normal">
            {status}
          </Badge>
        );
    }
  };
  
  return (
    <Card className="bg-card hover:bg-card/90 transition-all">
      <CardContent className="p-3 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-sm">Pipeline Build #{pipeline.buildNumber}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {showRepository && `Repository ${pipeline.repositoryId} • `}
            {timeAgo}
          </p>
        </div>
        {getStatusBadge(pipeline.status)}
      </CardContent>
    </Card>
  );
}
