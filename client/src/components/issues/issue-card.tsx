import { useLocation } from "wouter";
import { Issue } from "@/lib/database";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface IssueCardProps {
  issue: Issue;
  showRepository?: boolean;
}

export function IssueCard({ issue, showRepository = false }: IssueCardProps) {
  const [, navigate] = useLocation();
  
  const handleClick = () => {
    navigate(`/repository/${issue.repositoryId}/issues/${issue.id}`);
  };
  
  // Determine badge color based on priority
  const getPriorityBadgeStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-destructive';
      case 'medium':
        return 'border-l-4 border-warning';
      case 'low':
        return 'border-l-4 border-muted';
      default:
        return 'border-l-4 border-muted';
    }
  };
  
  // Determine badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-primary/20 text-primary font-normal">
            New
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="outline" className="bg-warning/20 text-warning font-normal">
            In Progress
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="bg-muted/40 text-muted-foreground font-normal">
            Closed
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
    <Card 
      className={cn(
        "bg-card hover:bg-card/90 cursor-pointer transition-all",
        getPriorityBadgeStyles(issue.priority)
      )} 
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm">Issue #{issue.id}: {issue.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {showRepository && `Repository ${issue.repositoryId} • `}
              {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
            </p>
          </div>
          {getStatusBadge(issue.status)}
        </div>
      </CardContent>
    </Card>
  );
}
