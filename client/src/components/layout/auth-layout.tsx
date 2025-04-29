import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DatabaseIcon } from "@/icons/database-icon";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center space-y-4 max-w-md w-full">
        <div className="flex flex-col items-center space-y-2 mb-2">
          <DatabaseIcon className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">DataHub</h1>
          <p className="text-muted-foreground text-sm text-center">
            Privacy-first, decentralized repository platform
          </p>
        </div>
        
        <Card className="w-full bg-background-surface">
          <CardContent className="pt-6">
            {children}
          </CardContent>
        </Card>
        
        <p className="text-xs text-muted-foreground text-center">
          By continuing, you agree to DataHub's Privacy Policy and Terms of Service
        </p>
      </div>
    </div>
  );
}
