import { Commit } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { GitCommitIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "../ui/loading-spinner";
import { ScrollArea } from "../ui/scroll-area";

interface CommitsListProps {
  commits: Commit[];
  isLoading: boolean;
  className?: string;
  maxHeight?: string;
}

export function CommitsList({ 
  commits = [], 
  isLoading,
  className,
  maxHeight = "500px"
}: CommitsListProps) {
  return (
    <Card className={cn("bg-background-surface", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Recent Commits</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" text="Loading commits..." />
          </div>
        ) : commits.length > 0 ? (
          <ScrollArea className={`pr-4 ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
            <ul className="space-y-3 text-sm">
              {commits.map(commit => (
                <li key={commit.id} className="bg-background-elevated p-3 rounded-md">
                  <div className="flex items-start space-x-2">
                    <GitCommitIcon className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{commit.message}</div>
                      <div className="text-xs text-muted-foreground flex justify-between mt-1">
                        <span>
                          by {commit.author}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(commit.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      {commit.filesChanged && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="text-green-400">+{(commit.filesChanged as any).added || 0}</span>
                          {' '}
                          <span className="text-red-400">-{(commit.filesChanged as any).removed || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 border border-dashed rounded-lg">
            <p className="text-muted-foreground">No commits found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
