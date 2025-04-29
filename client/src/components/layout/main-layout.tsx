import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  backPath?: string;
}

export function MainLayout({
  children,
  title,
  subtitle,
  actions,
  showBackButton = false,
  backPath
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <main className={cn(
        "flex-1 h-full overflow-y-auto transition-all duration-200",
        sidebarCollapsed ? "ml-16" : "ml-16" // Sidebar is fixed width
      )}>
        <Header 
          title={title} 
          subtitle={subtitle} 
          actions={actions} 
          showBackButton={showBackButton}
          backPath={backPath}
        />
        
        <div className="px-4 md:px-6 py-4 min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
