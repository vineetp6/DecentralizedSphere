import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Database, GitBranch, Users, Calendar, Settings, Home } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  tooltip: string;
}

function SidebarLink({ href, icon, active, tooltip }: SidebarLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a 
          href={href} 
          className={cn(
            "sidebar-icon p-3 rounded-lg transition-all hover:translate-y-[-2px]",
            active 
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          )}
        >
          {icon}
        </a>
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className="w-16 bg-sidebar h-full flex flex-col items-center py-6 border-r border-sidebar-border">
      <div className="sidebar-icon mb-10">
        <Logo size="sm" />
      </div>
      
      <nav className="flex flex-col items-center space-y-8 flex-1">
        <SidebarLink 
          href="/" 
          icon={<Home className="h-5 w-5" />} 
          active={location === '/'} 
          tooltip="Dashboard"
        />
        
        <SidebarLink 
          href="/repositories" 
          icon={<GitBranch className="h-5 w-5" />} 
          active={location.startsWith('/repository')} 
          tooltip="Repositories"
        />
        
        <SidebarLink 
          href="/team" 
          icon={<Users className="h-5 w-5" />} 
          active={location.startsWith('/team')} 
          tooltip="Team"
        />
        
        <SidebarLink 
          href="/calendar" 
          icon={<Calendar className="h-5 w-5" />} 
          active={location.startsWith('/calendar')} 
          tooltip="Calendar"
        />
      </nav>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={handleLogout} 
            className="sidebar-icon p-3 rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-all mt-auto"
          >
            <Settings className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Logout</TooltipContent>
      </Tooltip>
    </aside>
  );
}
