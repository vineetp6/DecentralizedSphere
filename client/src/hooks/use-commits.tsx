import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Commit, InsertCommit } from "@shared/schema";
import { StoreNames, addItem, getItemsByIndex } from "@/lib/db";

export function useCommits(repositoryId: number, branchId?: number) {
  const { toast } = useToast();
  
  const enabled = !!repositoryId && !!branchId;
  
  const {
    data: commits,
    isLoading,
    error,
  } = useQuery<Commit[]>({
    queryKey: ['/api/repositories', repositoryId, 'commits', { branchId }],
    enabled,
    onSuccess: async (fetchedCommits) => {
      // Store in IndexedDB for offline access
      try {
        for (const commit of fetchedCommits) {
          await addItem(StoreNames.COMMITS, commit);
        }
      } catch (err) {
        console.error("Failed to sync commits to local DB:", err);
      }
    },
    onError: async () => {
      // Fallback to IndexedDB on network error
      if (!branchId) return [];
      
      try {
        const localCommits = await getItemsByIndex(
          StoreNames.COMMITS, 
          'by-branch', 
          branchId
        );
        return localCommits;
      } catch (err) {
        console.error("Failed to fetch commits from local DB:", err);
        return [];
      }
    }
  });

  const createCommitMutation = useMutation({
    mutationFn: async (data: Omit<InsertCommit, "repositoryId" | "branchId">) => {
      if (!branchId) throw new Error("Branch ID is required");
      
      const payload = {
        ...data,
        branchId,
      };
      
      const res = await apiRequest(
        "POST", 
        `/api/repositories/${repositoryId}/commits`, 
        payload
      );
      return await res.json();
    },
    onSuccess: (newCommit: Commit) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/repositories', repositoryId, 'commits']
      });
      if (branchId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/repositories', repositoryId, 'commits', { branchId }]
        });
      }
      
      // Also add to IndexedDB
      addItem(StoreNames.COMMITS, newCommit).catch(console.error);
      
      toast({
        title: "Commit created",
        description: `Commit "${newCommit.message}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create commit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    commits,
    isLoading,
    error,
    createCommit: createCommitMutation.mutate,
    isPendingCreate: createCommitMutation.isPending,
  };
}
