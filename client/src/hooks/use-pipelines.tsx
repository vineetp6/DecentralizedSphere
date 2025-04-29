import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pipeline, InsertPipeline } from "@shared/schema";
import { StoreNames, addItem, getAllItems, updateItem } from "@/lib/db";

export function usePipelines(repositoryId?: number) {
  const { toast } = useToast();
  
  const queryKey = repositoryId 
    ? ["/api/pipelines", { repositoryId }] 
    : ["/api/pipelines"];

  const {
    data: pipelines,
    isLoading,
    error,
  } = useQuery<Pipeline[]>({
    queryKey,
    onSuccess: async (fetchedPipelines) => {
      // Store in IndexedDB for offline access
      try {
        const existingPipelines = await getAllItems(StoreNames.PIPELINES);
        for (const pipeline of fetchedPipelines) {
          const exists = existingPipelines.some(p => p.id === pipeline.id);
          if (!exists) {
            await addItem(StoreNames.PIPELINES, pipeline);
          } else {
            await updateItem(StoreNames.PIPELINES, pipeline);
          }
        }
      } catch (err) {
        console.error("Failed to sync pipelines to local DB:", err);
      }
    },
  });

  const createPipelineMutation = useMutation({
    mutationFn: async (data: Omit<InsertPipeline, "id">) => {
      const res = await apiRequest("POST", "/api/pipelines", data);
      return await res.json();
    },
    onSuccess: (newPipeline: Pipeline) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pipelines"] });
      if (repositoryId) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/pipelines", { repositoryId }] 
        });
      }
      
      // Also add to IndexedDB
      addItem(StoreNames.PIPELINES, newPipeline).catch(console.error);
      
      toast({
        title: "Pipeline started",
        description: `Pipeline build #${newPipeline.buildNumber} has been initiated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start pipeline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pipelines,
    isLoading,
    error,
    createPipeline: createPipelineMutation.mutate,
    isPendingCreate: createPipelineMutation.isPending,
  };
}
