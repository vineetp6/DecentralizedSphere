import { formatDistanceToNow } from "date-fns";
import { PullRequest } from "@/lib/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GitCommit, Code } from "lucide-react";

interface PullRequestCardProps {
  pullRequest: PullRequest;
}

export function PullRequestCard({ pullRequest }: PullRequestCardProps) {
  // Format dates
  const createdAt = formatDistanceToNow(new Date(pullRequest.createdAt), { addSuffix: true });
  
  // Determine badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge className="bg-primary text-white px-2 py-1 text-xs">
            New
          </Badge>
        );
      case 'merged':
        return (
          <Badge className="bg-success text-white px-2 py-1 text-xs">
            Merged
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-muted text-muted-foreground px-2 py-1 text-xs">
            Closed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground px-2 py-1 text-xs">
            {status}
          </Badge>
        );
    }
  };
  
  return (
    <Card className="bg-card hover:bg-card/90 transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{pullRequest.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              by {pullRequest.author} • {pullRequest.status === 'merged' ? 'Merged' : pullRequest.status}
            </p>
          </div>
          {getStatusBadge(pullRequest.status)}
        </div>
        
        <div className="flex items-center space-x-3 mt-4 text-xs">
          <div className="flex items-center space-x-1">
            <GitCommit className="h-3 w-3" />
            <span>5 commits</span>
          </div>
          <div className="flex items-center space-x-1">
            <Code className="h-3 w-3" />
            <span>+234 -56</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
