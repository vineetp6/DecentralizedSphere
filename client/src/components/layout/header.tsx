import { useNavigate, useLocation } from "wouter";
import { Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backButtonUrl?: string;
  actions?: React.ReactNode;
}

export function Header({ title, showBackButton = false, backButtonUrl = "/", actions }: HeaderProps) {
  const [, navigate] = useNavigate();
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleBack = () => {
    navigate(backButtonUrl);
  };
  
  const handleNotificationClick = () => {
    navigate("/notifications");
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get first letter of username for avatar fallback
  const userInitial = user?.username.charAt(0).toUpperCase() || "U";
  
  return (
    <header className="flex justify-between items-center mb-8 pt-2">
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {actions}
        
        {location !== "/notifications" && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNotificationClick}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            <Badge 
              className="absolute top-0 right-0 h-2 w-2 p-0 bg-primary rounded-full"
              variant="default"
            />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-2 cursor-pointer">
              <span className="text-sm hidden sm:inline-block">
                Welcome, {user?.username}!
              </span>
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${userInitial}&background=6C63FF&color=fff`} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
