import { PullRequest } from "@shared/schema";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitMergeIcon, GitCommitIcon, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullRequestCardProps {
  pullRequest: PullRequest;
  onSelect?: (pr: PullRequest) => void;
  className?: string;
}

export function PullRequestCard({ 
  pullRequest, 
  onSelect,
  className 
}: PullRequestCardProps) {
  const { title, status, sourceBranch, targetBranch, author, commitCount, changesCount } = pullRequest;
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-primary text-white';
      case 'merged':
        return 'bg-success text-white';
      case 'closed':
        return 'bg-error text-white';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Card 
      className={cn(
        "bg-background-elevated",
        onSelect && "cursor-pointer hover:bg-muted/20 transition-colors",
        className
      )}
      onClick={onSelect ? () => onSelect(pullRequest) : undefined}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs mt-1">
              from <span className="font-medium">{sourceBranch}</span> to <span className="font-medium">{targetBranch}</span>
            </CardDescription>
          </div>
          <Badge className={getStatusBadge(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <GitCommitIcon className="h-3 w-3" />
            <span>{commitCount} commit{commitCount !== 1 ? 's' : ''}</span>
          </div>
          {changesCount && (
            <div className="flex items-center space-x-1">
              <Code className="h-3 w-3" />
              <span>+{changesCount.added || 0} -{changesCount.removed || 0}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          by {author}
        </div>
        
        {status === 'open' && (
          <Button 
            variant="outline" 
            size="sm"
            className="h-7 text-xs"
          >
            <GitMergeIcon className="h-3 w-3 mr-1" />
            Merge
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
