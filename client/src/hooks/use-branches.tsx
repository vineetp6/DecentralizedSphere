import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Branch, InsertBranch } from "@shared/schema";
import { StoreNames, addItem, getAllItems, updateItem, getItemsByIndex } from "@/lib/db";

export function useBranches(repositoryId: number) {
  const { toast } = useToast();
  
  const {
    data: branches,
    isLoading,
    error,
  } = useQuery<Branch[]>({
    queryKey: ['/api/repositories', repositoryId, 'branches'],
    enabled: !!repositoryId,
    onSuccess: async (fetchedBranches) => {
      // Store in IndexedDB for offline access
      try {
        const existingBranches = await getAllItems(StoreNames.BRANCHES);
        for (const branch of fetchedBranches) {
          const exists = existingBranches.some(b => b.id === branch.id);
          if (!exists) {
            await addItem(StoreNames.BRANCHES, branch);
          } else {
            await updateItem(StoreNames.BRANCHES, branch);
          }
        }
      } catch (err) {
        console.error("Failed to sync branches to local DB:", err);
      }
    },
    onError: async () => {
      // Fallback to IndexedDB on network error
      try {
        const localBranches = await getItemsByIndex(
          StoreNames.BRANCHES, 
          'by-repo', 
          repositoryId
        );
        return localBranches;
      } catch (err) {
        console.error("Failed to fetch branches from local DB:", err);
        return [];
      }
    }
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: Omit<InsertBranch, "repositoryId">) => {
      const res = await apiRequest("POST", `/api/repositories/${repositoryId}/branches`, data);
      return await res.json();
    },
    onSuccess: (newBranch: Branch) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/repositories', repositoryId, 'branches'] 
      });
      
      // Also add to IndexedDB
      addItem(StoreNames.BRANCHES, newBranch).catch(console.error);
      
      toast({
        title: "Branch created",
        description: `Branch "${newBranch.name}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create branch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDefaultBranch = () => {
    if (!branches) return undefined;
    return branches.find(branch => branch.isDefault);
  };

  return {
    branches,
    isLoading,
    error,
    createBranch: createBranchMutation.mutate,
    isPendingCreate: createBranchMutation.isPending,
    getDefaultBranch,
  };
}
