import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Issue, InsertIssue } from "@shared/schema";
import { StoreNames, addItem, getAllItems, updateItem } from "@/lib/db";

export function useIssues(repositoryId?: number) {
  const { toast } = useToast();
  
  const queryKey = repositoryId 
    ? ["/api/issues", { repositoryId }] 
    : ["/api/issues"];

  const {
    data: issues,
    isLoading,
    error,
  } = useQuery<Issue[]>({
    queryKey,
    onSuccess: async (fetchedIssues) => {
      // Store in IndexedDB for offline access
      try {
        const existingIssues = await getAllItems(StoreNames.ISSUES);
        for (const issue of fetchedIssues) {
          const exists = existingIssues.some(i => i.id === issue.id);
          if (!exists) {
            await addItem(StoreNames.ISSUES, issue);
          } else {
            await updateItem(StoreNames.ISSUES, issue);
          }
        }
      } catch (err) {
        console.error("Failed to sync issues to local DB:", err);
      }
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: Omit<InsertIssue, "authorId">) => {
      const res = await apiRequest("POST", "/api/issues", data);
      return await res.json();
    },
    onSuccess: (newIssue: Issue) => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      if (repositoryId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/issues", { repositoryId }] 
        });
      }
      
      // Also add to IndexedDB
      addItem(StoreNames.ISSUES, newIssue).catch(console.error);
      
      toast({
        title: "Issue created",
        description: `Issue "${newIssue.title}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async (data: { id: number, status: string }) => {
      const { id, status } = data;
      const res = await apiRequest("PATCH", `/api/issues/${id}`, { status });
      return await res.json();
    },
    onSuccess: (updatedIssue: Issue) => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues"] });
      if (repositoryId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/issues", { repositoryId }] 
        });
      }
      
      // Update in IndexedDB
      updateItem(StoreNames.ISSUES, updatedIssue).catch(console.error);
      
      toast({
        title: "Issue updated",
        description: `Issue status has been updated to ${updatedIssue.status}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    issues,
    isLoading,
    error,
    createIssue: createIssueMutation.mutate,
    isPendingCreate: createIssueMutation.isPending,
    updateIssue: updateIssueMutation.mutate,
    isPendingUpdate: updateIssueMutation.isPending,
  };
}
