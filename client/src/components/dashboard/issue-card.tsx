import { Issue } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: Issue;
  onClick?: (issue: Issue) => void;
  className?: string;
}

export function IssueCard({ issue, onClick, className }: IssueCardProps) {
  const { title, status, priority, repositoryId, id } = issue;
  
  const getBorderColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'border-l-error';
      case 'medium':
        return 'border-l-warning';
      case 'low':
        return 'border-l-primary';
      default:
        return 'border-l-accent';
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-secondary/40 text-foreground';
      case 'in progress':
        return 'bg-primary/20 text-primary';
      case 'resolved':
        return 'bg-green-900/20 text-green-300';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary/40 text-foreground';
    }
  };

  return (
    <Card 
      className={cn(
        "bg-background-elevated p-3 border-l-4", 
        getBorderColor(priority),
        onClick && "cursor-pointer hover:bg-muted transition-colors",
        className
      )}
      onClick={onClick ? () => onClick(issue) : undefined}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-sm">Issue #{id}: {title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Repository #{repositoryId} • {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </p>
        </div>
        <Badge className={getStatusBadgeVariant(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
    </Card>
  );
}
