import { Notification } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { CheckCheck } from "lucide-react";

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: number) => void;
  onSelect?: (notification: Notification) => void;
  isSelected?: boolean;
}

export function NotificationCard({ 
  notification, 
  onRead, 
  onSelect,
  isSelected = false
}: NotificationCardProps) {
  const { id, title, message, read, created, type } = notification;
  
  const getIcon = (type: string) => {
    return type.charAt(0).toUpperCase();
  };
  
  const getAvatarColor = (type: string) => {
    switch (type) {
      case 'issue':
        return 'bg-error text-white';
      case 'pr':
        return 'bg-primary text-white';
      case 'commit':
        return 'bg-green-600 text-white';
      case 'pipeline':
        return 'bg-warning text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <Card 
      className={`bg-background-elevated p-4 ${isSelected ? 'border-l-4 border-primary' : ''} ${read ? 'opacity-70' : ''} ${onSelect ? 'cursor-pointer hover:bg-muted/20 transition-colors' : ''}`}
      onClick={onSelect ? () => onSelect(notification) : undefined}
    >
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <Avatar className={getAvatarColor(type)}>
            <AvatarFallback>{getIcon(type)}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="font-medium">{title}</h3>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(created), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          <div className="flex mt-2 space-x-2">
            {!read && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="text-xs px-3 py-1 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(id);
                }}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark as read
              </Button>
            )}
            <Badge variant="outline" className="text-xs">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
