import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Notification, InsertNotification } from "@shared/schema";
import { StoreNames, addItem, getAllItems, updateItem } from "@/lib/db";

export function useNotifications() {
  const { toast } = useToast();

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    onSuccess: async (fetchedNotifications) => {
      // Store in IndexedDB for offline access
      try {
        const existingNotifications = await getAllItems(StoreNames.NOTIFICATIONS);
        for (const notification of fetchedNotifications) {
          const exists = existingNotifications.some(n => n.id === notification.id);
          if (!exists) {
            await addItem(StoreNames.NOTIFICATIONS, notification);
          } else {
            await updateItem(StoreNames.NOTIFICATIONS, notification);
          }
        }
      } catch (err) {
        console.error("Failed to sync notifications to local DB:", err);
      }
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`, {});
      return await res.json();
    },
    onSuccess: (updatedNotification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      // Update in IndexedDB
      updateItem(StoreNames.NOTIFICATIONS, updatedNotification).catch(console.error);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to mark notification as read",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    isPendingMarkAsRead: markAsReadMutation.isPending,
  };
}
