import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const { toast } = useToast();

  const initiateSync = async (repositoryId?: number) => {
    if (syncStatus === "syncing") return;
    
    try {
      setSyncStatus("syncing");
      
      // Simulate network delay for P2P sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call the mock sync endpoint
      const payload = repositoryId ? { repositoryId } : undefined;
      await apiRequest("POST", "/api/sync", payload);
      
      setSyncStatus("success");
      
      toast({
        title: "Sync completed",
        description: "Your data was successfully synchronized with peers",
      });
    } catch (error) {
      setSyncStatus("error");
      
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    syncStatus,
    initiateSync,
    isSyncing: syncStatus === "syncing"
  };
}
