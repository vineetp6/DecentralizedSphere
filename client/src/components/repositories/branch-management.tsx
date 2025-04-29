import { Branch } from "@/lib/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

interface BranchManagementProps {
  branches: Branch[];
  onSwitchBranch: (branchId: number) => void;
  currentBranchId: number;
}

export function BranchManagement({ branches, onSwitchBranch, currentBranchId }: BranchManagementProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Branch Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {branches.map(branch => (
            <div 
              key={branch.id} 
              className="bg-muted p-4 rounded-md flex justify-between items-center"
            >
              <div className="flex items-center space-x-3">
                <GitBranch 
                  className={branch.id === currentBranchId ? "text-primary" : "text-muted-foreground"} 
                  size={16} 
                />
                <div>
                  <h3 className="font-medium">{branch.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {branch.isDefault ? "Default branch" : 
                     branch.aheadOfDefault > 0 ? `${branch.aheadOfDefault} commits ahead of main` : 
                     "Up to date with main"}
                  </p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onSwitchBranch(branch.id)}
                disabled={branch.id === currentBranchId}
              >
                {branch.id === currentBranchId ? "Current" : "Switch"}
              </Button>
            </div>
          ))}
          
          <Button variant="outline" className="w-full mt-3">
            <GitBranch className="mr-2" size={16} />
            Create New Branch
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
