import { Repository } from "@shared/schema";
import { RepositoryCard } from "./repository-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RepositoriesGridProps {
  repositories: Repository[];
  isLoading: boolean;
  onSync?: (id: number) => void;
  syncingRepoId?: number | null;
}

export function RepositoriesGrid({ 
  repositories = [], 
  isLoading, 
  onSync,
  syncingRepoId 
}: RepositoriesGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredRepositories = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button asChild>
          <Link href="/repositories/new">
            <Plus className="h-4 w-4 mr-2" />
            New Repository
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" text="Loading repositories..." />
        </div>
      ) : filteredRepositories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepositories.map(repo => (
            <RepositoryCard 
              key={repo.id} 
              repository={repo} 
              onSync={onSync}
              isSyncing={syncingRepoId === repo.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-lg bg-background-surface">
          <h3 className="text-lg font-medium mb-2">No repositories found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No results match your search criteria.' : 'Create your first repository to get started.'}
          </p>
          {!searchTerm && (
            <Button asChild>
              <Link href="/repositories/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Repository
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
