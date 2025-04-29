import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Repository, InsertRepository } from "@shared/schema";
import { useState } from "react";
import { StoreNames, addItem, getAllItems, updateItem, deleteItem } from "@/lib/db";

export function useRepositories() {
  const { toast } = useToast();
  const [syncingRepo, setSyncingRepo] = useState<number | null>(null);

  const {
    data: repositories,
    isLoading,
    error,
  } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
    onSuccess: async (repos) => {
      // Also store in IndexedDB for offline access
      try {
        const existingRepos = await getAllItems(StoreNames.REPOSITORIES);
        for (const repo of repos) {
          const exists = existingRepos.some(r => r.id === repo.id);
          if (!exists) {
            await addItem(StoreNames.REPOSITORIES, repo);
          } else {
            await updateItem(StoreNames.REPOSITORIES, repo);
          }
        }
      } catch (err) {
        console.error("Failed to sync repositories to local DB:", err);
      }
    },
  });

  const createRepositoryMutation = useMutation({
    mutationFn: async (data: Omit<InsertRepository, "ownerId">) => {
      const res = await apiRequest("POST", "/api/repositories", data);
      return await res.json();
    },
    onSuccess: (newRepo: Repository) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      // Also add to IndexedDB
      addItem(StoreNames.REPOSITORIES, newRepo).catch(console.error);
      
      toast({
        title: "Repository created",
        description: `Repository "${newRepo.name}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncRepositoryMutation = useMutation({
    mutationFn: async (id: number) => {
      setSyncingRepo(id);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate sync process
      const res = await apiRequest("POST", "/api/sync", { repositoryId: id });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setSyncingRepo(null);
      
      toast({
        title: "Repository synced",
        description: "Repository has been successfully synced with peers.",
      });
    },
    onError: (error: Error) => {
      setSyncingRepo(null);
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    repositories,
    isLoading,
    error,
    createRepository: createRepositoryMutation.mutate,
    isPendingCreate: createRepositoryMutation.isPending,
    syncRepository: syncRepositoryMutation.mutate,
    isSyncing: syncRepositoryMutation.isPending,
    syncingRepoId: syncingRepo,
  };
}

export function useRepositoryDetails(id: number | undefined) {
  const { toast } = useToast();
  
  const enabled = id !== undefined;
  
  const {
    data: repository,
    isLoading,
    error,
  } = useQuery<Repository>({
    queryKey: ['/api/repositories', id],
    enabled,
  });

  return {
    repository,
    isLoading,
    error,
  };
}
