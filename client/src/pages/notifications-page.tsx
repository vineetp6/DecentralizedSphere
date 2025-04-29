import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  NotificationCard, 
  NotificationDetail,
  NotificationMetaItem,
  type Notification 
} from "@/components/notifications/notification-card";
import { 
  User, 
  Clock, 
  ListChecks, 
  Star, 
  CircleAlert, 
  Link2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: 1,
    title: "CI/CD pipelines",
    description: "User added a new issue.",
    timestamp: "Just now",
    avatarUrl: "https://ui-avatars.com/api/?name=P&background=6C63FF&color=fff",
    avatarFallback: "P",
    read: false
  },
  {
    id: 2,
    title: "Bug fixes",
    description: "User resolved the issue.",
    timestamp: "2 hours ago",
    avatarUrl: "https://ui-avatars.com/api/?name=B&background=6C63FF&color=fff",
    avatarFallback: "B",
    read: false
  },
  {
    id: 3,
    title: "Feature brainstorming",
    description: "User resolved the issue.",
    timestamp: "Yesterday",
    avatarUrl: "https://ui-avatars.com/api/?name=F&background=6C63FF&color=fff",
    avatarFallback: "F",
    read: true
  },
  {
    id: 4,
    title: "Enhanced security features",
    description: "User put the issue on hold.",
    timestamp: "3 days ago",
    avatarUrl: "https://ui-avatars.com/api/?name=S&background=6C63FF&color=fff",
    avatarFallback: "S",
    read: true
  },
  {
    id: 5,
    title: "Data analysis",
    description: "User resolved the issue.",
    timestamp: "1 week ago",
    avatarUrl: "https://ui-avatars.com/api/?name=D&background=6C63FF&color=fff",
    avatarFallback: "D",
    read: true
  }
];

export default function NotificationsPage() {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Query notifications
  const { data, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications', { credentials: 'include' });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch notifications from API:', error);
      }
      
      // Fallback to mock data
      return mockNotifications;
    }
  });

  // Update notifications when data changes
  useEffect(() => {
    if (data) {
      setNotifications(data);
      
      // Select first notification if none selected
      if (!selectedNotification && data.length > 0) {
        setSelectedNotification(data[0]);
      }
    }
  }, [data, selectedNotification]);
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.read;
    return true;
  });

  // Handle notification selection
  const handleNotificationSelect = (id: number) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      setSelectedNotification(notification);
      
      // Mark as read
      if (!notification.read) {
        const updatedNotifications = notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
  };

  // Close notification detail
  const handleCloseDetail = () => {
    setSelectedNotification(null);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 h-full overflow-y-auto">
        <div className="px-6 py-4">
          <Header 
            title="Notifications" 
            showBackButton={true}
            backButtonUrl="/"
            actions={
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={handleMarkAllAsRead}>
                  Mark all as read
                </Button>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All notifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All notifications</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
          
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 mt-6">
            {/* Notifications List */}
            <div className="md:w-1/2">
              <div className="bg-card p-6 rounded-lg shadow-md h-full">
                <h2 className="text-xl font-medium mb-6 flex justify-between items-center">
                  <span>New updates available</span>
                  {filteredNotifications.filter(n => !n.read).length > 0 && (
                    <Badge variant="outline" className="bg-primary/20 text-primary font-normal">
                      {filteredNotifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </h2>
                
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-pulse">Loading notifications...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map(notification => (
                        <NotificationCard 
                          key={notification.id}
                          notification={notification}
                          onSelect={handleNotificationSelect}
                          isSelected={selectedNotification?.id === notification.id}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No notifications found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Notification Detail */}
            <div className="md:w-1/2">
              {selectedNotification ? (
                <NotificationDetail
                  title={selectedNotification.title}
                  onClose={handleCloseDetail}
                >
                  <NotificationMetaItem
                    icon={<User className="h-4 w-4 text-muted-foreground" />}
                    label="Collaborator"
                    value={<Badge className="bg-primary text-white text-xs font-normal">Myself</Badge>}
                  />
                  
                  <NotificationMetaItem
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                    label="Due date"
                    value={<Badge className="bg-muted-foreground text-background text-xs font-normal">Now</Badge>}
                  />
                  
                  <NotificationMetaItem
                    icon={<ListChecks className="h-4 w-4 text-muted-foreground" />}
                    label="Tasks"
                    value={<Badge className="bg-muted-foreground text-background text-xs font-normal">Confidential work</Badge>}
                  />
                  
                  <NotificationMetaItem
                    icon={<Star className="h-4 w-4 text-muted-foreground" />}
                    label="Importance"
                    value={<Badge className="bg-muted-foreground text-background text-xs font-normal">Moderate</Badge>}
                  />
                  
                  <div>
                    <h3 className="font-medium mb-3">Files</h3>
                    <div className="bg-muted p-4 rounded-md flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <CircleAlert className="h-4 w-4 text-muted-foreground" />
                        <span>No files attached</span>
                      </div>
                      <Button variant="secondary" size="sm">
                        Attach file
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Web links</h3>
                    <div className="bg-muted p-4 rounded-md flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <span>No hyperlinks</span>
                      </div>
                      <Button variant="secondary" size="sm">
                        Include
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between space-x-4 pt-4">
                    <Button className="w-1/2">
                      Store Issue
                    </Button>
                    <Button variant="secondary" className="w-1/2">
                      Discard Issue
                    </Button>
                  </div>
                </NotificationDetail>
              ) : (
                <div className="bg-card p-6 rounded-lg shadow-md h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Select a notification to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
