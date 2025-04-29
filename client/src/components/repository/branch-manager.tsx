import { Branch } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranchIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchManagerProps {
  branches: Branch[];
  currentBranchId: number;
  onBranchSwitch: (branchId: number) => void;
  className?: string;
}

export function BranchManager({ 
  branches, 
  currentBranchId, 
  onBranchSwitch,
  className 
}: BranchManagerProps) {
  return (
    <Card className={cn("bg-background-surface", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Branch Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {branches.map(branch => (
          <div 
            key={branch.id} 
            className="bg-background-elevated p-4 rounded-md flex justify-between items-center"
          >
            <div className="flex items-center space-x-3">
              <GitBranchIcon className={cn(
                "h-4 w-4",
                branch.id === currentBranchId ? "text-primary" : "text-muted-foreground"
              )} />
              <div>
                <h3 className="font-medium">{branch.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {branch.isDefault ? 'Default branch' : branch.aheadCount > 0 
                    ? `${branch.aheadCount} commit${branch.aheadCount > 1 ? 's' : ''} ahead of ${branch.baseBranch || 'main'}`
                    : `Based on ${branch.baseBranch || 'main'}`
                  }
                </p>
              </div>
            </div>
            <Button 
              variant={branch.id === currentBranchId ? "default" : "secondary"}
              size="sm"
              onClick={() => onBranchSwitch(branch.id)}
              disabled={branch.id === currentBranchId}
              className="px-3 text-xs"
            >
              {branch.id === currentBranchId ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Current
                </>
              ) : "Switch"}
            </Button>
          </div>
        ))}
        
        {branches.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No branches found. Create one to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
