import { Repository } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CalendarIcon, GitBranchIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RepositoryCardProps {
  repository: Repository;
  onSync?: (id: number) => void;
  isSyncing?: boolean;
}

export function RepositoryCard({ 
  repository, 
  onSync, 
  isSyncing = false 
}: RepositoryCardProps) {
  const { id, name, description, lastUpdated, syncStatus } = repository;
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-900/30 text-green-300';
      case 'syncing':
        return 'bg-yellow-900/30 text-yellow-300';
      case 'error':
        return 'bg-red-900/30 text-red-300';
      default:
        return 'bg-secondary/30 text-secondary-foreground';
    }
  };

  return (
    <Card className="bg-background-elevated hover:translate-y-[-2px] transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">
            {name}
          </CardTitle>
          <Badge className={statusColor(syncStatus)}>
            {syncStatus === 'syncing' ? 'Syncing' : syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground pb-4">
        {description ? (
          <p className="line-clamp-2">{description}</p>
        ) : (
          <p className="text-muted-foreground/60 italic">No description provided</p>
        )}
        <div className="flex items-center mt-3 text-xs space-x-4">
          <div className="flex items-center">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span>Updated {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center">
            <GitBranchIcon className="h-3 w-3 mr-1" />
            <span>Main</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/repositories/${id}`}>View Details</Link>
        </Button>
        {onSync && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onSync(id)}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              "P2P Sync"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
