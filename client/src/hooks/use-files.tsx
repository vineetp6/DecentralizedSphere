import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { File, InsertFile } from "@shared/schema";
import { StoreNames, addItem, updateItem, getItemsByIndex } from "@/lib/db";

export function useFiles(repositoryId: number, branchId?: number) {
  const { toast } = useToast();
  
  const enabled = !!repositoryId && !!branchId;
  
  const {
    data: files,
    isLoading,
    error,
  } = useQuery<File[]>({
    queryKey: ['/api/repositories', repositoryId, 'files', { branchId }],
    enabled,
    onSuccess: async (fetchedFiles) => {
      // Store in IndexedDB for offline access
      try {
        for (const file of fetchedFiles) {
          await addItem(StoreNames.FILES, file);
        }
      } catch (err) {
        console.error("Failed to sync files to local DB:", err);
      }
    },
    onError: async () => {
      // Fallback to IndexedDB on network error
      if (!branchId) return [];
      
      try {
        const localFiles = await getItemsByIndex(
          StoreNames.FILES, 
          'by-branch', 
          branchId
        );
        return localFiles;
      } catch (err) {
        console.error("Failed to fetch files from local DB:", err);
        return [];
      }
    }
  });

  const createFileMutation = useMutation({
    mutationFn: async (data: Omit<InsertFile, "repositoryId" | "branchId">) => {
      if (!branchId) throw new Error("Branch ID is required");
      
      const payload = {
        ...data,
        branchId,
      };
      
      const res = await apiRequest(
        "POST", 
        `/api/repositories/${repositoryId}/files`, 
        payload
      );
      return await res.json();
    },
    onSuccess: (newFile: File) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/repositories', repositoryId, 'files']
      });
      if (branchId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/repositories', repositoryId, 'files', { branchId }]
        });
      }
      
      // Also add to IndexedDB
      addItem(StoreNames.FILES, newFile).catch(console.error);
      
      toast({
        title: "File created",
        description: `File "${newFile.path}" has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFileMutation = useMutation({
    mutationFn: async (data: { id: number, content: string, lastCommitMessage: string }) => {
      const { id, ...payload } = data;
      
      const res = await apiRequest(
        "PATCH", 
        `/api/repositories/${repositoryId}/files/${id}`, 
        payload
      );
      return await res.json();
    },
    onSuccess: (updatedFile: File) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/repositories', repositoryId, 'files']
      });
      if (branchId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/repositories', repositoryId, 'files', { branchId }]
        });
      }
      
      // Update in IndexedDB
      updateItem(StoreNames.FILES, updatedFile).catch(console.error);
      
      toast({
        title: "File updated",
        description: `File "${updatedFile.path}" has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    files,
    isLoading,
    error,
    createFile: createFileMutation.mutate,
    isPendingCreate: createFileMutation.isPending,
    updateFile: updateFileMutation.mutate,
    isPendingUpdate: updateFileMutation.isPending,
  };
}
