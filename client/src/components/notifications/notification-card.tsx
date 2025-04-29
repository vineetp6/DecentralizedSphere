import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  avatarUrl?: string;
  avatarFallback: string;
  read: boolean;
}

interface NotificationCardProps {
  notification: Notification;
  onSelect: (id: number) => void;
  isSelected: boolean;
}

export function NotificationCard({ notification, onSelect, isSelected }: NotificationCardProps) {
  const [isRead, setIsRead] = useState(notification.read);
  
  const handleClick = () => {
    onSelect(notification.id);
    if (!isRead) {
      setIsRead(true);
    }
  };
  
  return (
    <Card
      className={cn(
        "bg-card transition-all cursor-pointer",
        isSelected ? "border-l-4 border-primary" : "",
        isRead ? "" : "bg-card/80"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <div className="mt-1">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-medium">{notification.title}</h3>
              <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
            <div className="flex justify-end mt-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={notification.avatarUrl} />
                <AvatarFallback>{notification.avatarFallback}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationDetailProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function NotificationDetail({ title, onClose, children }: NotificationDetailProps) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-md h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <span className="sr-only">Close</span>
          <span className="text-lg text-muted-foreground">&times;</span>
        </Button>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface NotificationMetaItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

export function NotificationMetaItem({ icon, label, value }: NotificationMetaItemProps) {
  return (
    <div className="flex items-center space-x-3 bg-muted p-3 rounded-md">
      {icon}
      <span>{label}</span>
      <span className="ml-auto">{value}</span>
    </div>
  );
}

export type { Notification };
