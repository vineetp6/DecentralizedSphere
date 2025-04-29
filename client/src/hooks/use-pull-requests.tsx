import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PullRequest, InsertPullRequest } from "@shared/schema";
import { StoreNames, addItem, updateItem, getItemsByIndex } from "@/lib/db";

export function usePullRequests(repositoryId: number) {
  const { toast } = useToast();
  
  const {
    data: pullRequests,
    isLoading,
    error,
  } = useQuery<PullRequest[]>({
    queryKey: ['/api/repositories', repositoryId, 'pullrequests'],
    enabled: !!repositoryId,
    onSuccess: async (fetchedPRs) => {
      // Store in IndexedDB for offline access
      try {
        for (const pr of fetchedPRs) {
          await addItem(StoreNames.PULL_REQUESTS, pr);
        }
      } catch (err) {
        console.error("Failed to sync pull requests to local DB:", err);
      }
    },
    onError: async () => {
      // Fallback to IndexedDB on network error
      try {
        const localPRs = await getItemsByIndex(
          StoreNames.PULL_REQUESTS, 
          'by-repo', 
          repositoryId
        );
        return localPRs;
      } catch (err) {
        console.error("Failed to fetch pull requests from local DB:", err);
        return [];
      }
    }
  });

  const createPullRequestMutation = useMutation({
    mutationFn: async (data: Omit<InsertPullRequest, "repositoryId" | "authorId">) => {
      const res = await apiRequest(
        "POST", 
        `/api/repositories/${repositoryId}/pullrequests`, 
        data
      );
      return await res.json();
    },
    onSuccess: (newPR: PullRequest) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/repositories', repositoryId, 'pullrequests']
      });
      
      // Also add to IndexedDB
      addItem(StoreNames.PULL_REQUESTS, newPR).catch(console.error);
      
      toast({
        title: "Pull request created",
        description: `Pull request "${newPR.title}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create pull request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePullRequestMutation = useMutation({
    mutationFn: async (data: { id: number, status: string }) => {
      const { id, status } = data;
      
      const res = await apiRequest(
        "PATCH", 
        `/api/repositories/${repositoryId}/pullrequests/${id}`, 
        { status }
      );
      return await res.json();
    },
    onSuccess: (updatedPR: PullRequest) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/repositories', repositoryId, 'pullrequests']
      });
      
      // Update in IndexedDB
      updateItem(StoreNames.PULL_REQUESTS, updatedPR).catch(console.error);
      
      toast({
        title: "Pull request updated",
        description: `Pull request status changed to "${updatedPR.status}".`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update pull request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pullRequests,
    isLoading,
    error,
    createPullRequest: createPullRequestMutation.mutate,
    isPendingCreate: createPullRequestMutation.isPending,
    updatePullRequest: updatePullRequestMutation.mutate,
    isPendingUpdate: updatePullRequestMutation.isPending,
  };
}
