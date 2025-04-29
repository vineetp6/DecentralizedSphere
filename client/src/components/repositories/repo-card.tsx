import { useState } from "react";
import { useLocation } from "wouter";
import { Repository } from "@/lib/database";
import { p2pClient } from "@/lib/p2p-mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircleCheckIcon, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RepoCardProps {
  repository: Repository;
}

export function RepoCard({ repository }: RepoCardProps) {
  const [, navigate] = useLocation();
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  const handleViewDetails = () => {
    navigate(`/repository/${repository.id}`);
  };
  
  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (syncing) return;
    
    setSyncing(true);
    try {
      await p2pClient.syncRepository(repository.id);
      
      // Set up progress listener
      const progressListener = (status: any) => {
        if (status.repositoryId === repository.id) {
          setSyncProgress(status.progress);
          
          if (status.progress >= 100) {
            p2pClient.off('syncProgress', progressListener);
            p2pClient.off('syncCompleted', completedListener);
            setSyncing(false);
          }
        }
      };
      
      const completedListener = (status: any) => {
        if (status.repositoryId === repository.id) {
          setSyncProgress(100);
          setSyncing(false);
          p2pClient.off('syncProgress', progressListener);
          p2pClient.off('syncCompleted', completedListener);
        }
      };
      
      p2pClient.on('syncProgress', progressListener);
      p2pClient.on('syncCompleted', completedListener);
    } catch (error) {
      console.error('Failed to sync repository:', error);
      setSyncing(false);
    }
  };
  
  // Format the last updated date
  const lastUpdatedText = repository.lastUpdated 
    ? formatDistanceToNow(new Date(repository.lastUpdated), { addSuffix: true })
    : 'Unknown';
  
  return (
    <Card className="repo-card transition-all hover:translate-y-[-2px] cursor-pointer" onClick={handleViewDetails}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{repository.name}</h3>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdatedText}</p>
          </div>
          <div className="flex items-center space-x-1">
            {syncing ? (
              <Badge variant="outline" className="bg-yellow-900/30 text-yellow-300 font-normal">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Syncing {syncProgress.toFixed(0)}%
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-900/30 text-green-300 font-normal">
                <CircleCheckIcon className="h-3 w-3 mr-1" />
                Synced
              </Badge>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <Button variant="secondary" size="sm" onClick={handleViewDetails}>
            View Details
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : 'Sync Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
