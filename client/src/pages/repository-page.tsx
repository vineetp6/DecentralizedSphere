import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileExplorer } from "@/components/repositories/file-explorer";
import { BranchManagement } from "@/components/repositories/branch-management";
import { PullRequestCard } from "@/components/repositories/pull-request-card";
import { DataCard } from "@/components/ui/data-card";
import { useToast } from "@/hooks/use-toast";
import { p2pClient } from "@/lib/p2p-mock";
import { Repository, Branch, File, PullRequest, branches, files, pullRequests, repositories } from "@/lib/database";
import { Loader2, GitBranch, GitCommit, GitPullRequest, Folder, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RepositoryPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const repositoryId = parseInt(id);

  const [activeTab, setActiveTab] = useState("files");
  const [currentBranchId, setCurrentBranchId] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Fetch repository data
  const { data: repository, isLoading: isLoadingRepo } = useQuery({
    queryKey: [`/api/repositories/${repositoryId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/repositories/${repositoryId}`, { credentials: 'include' });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch repository from API:', error);
      }
      
      // Fallback to local data
      return await repositories.getById(repositoryId);
    }
  });

  // Fetch repository branches
  const { data: repoBranches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: [`/repository/${repositoryId}/branches`],
    queryFn: async () => {
      const branchList = await branches.getByRepository(repositoryId);
      
      // If no branches exist, create default ones
      if (branchList.length === 0 && repository) {
        const defaultBranches: Omit<Branch, 'id'>[] = [
          {
            repositoryId,
            name: 'main',
            isDefault: true,
            isCurrent: true,
            aheadOfDefault: 0
          },
          {
            repositoryId,
            name: 'development',
            isDefault: false,
            isCurrent: false,
            aheadOfDefault: 2
          },
          {
            repositoryId,
            name: 'feature/login',
            isDefault: false,
            isCurrent: false,
            aheadOfDefault: 5
          }
        ];
        
        const createdBranches: Branch[] = [];
        for (const branch of defaultBranches) {
          const id = await branches.add(branch);
          createdBranches.push({ ...branch, id });
        }
        
        return createdBranches;
      }
      
      return branchList;
    },
    enabled: !!repository
  });

  // Fetch repository files
  const { data: repoFiles = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: [`/repository/${repositoryId}/files`, currentBranchId],
    queryFn: async () => {
      const currentBranch = currentBranchId || repoBranches.find(b => b.isCurrent)?.id;
      
      if (!currentBranch) return [];
      
      const fileList = await files.getByBranch(currentBranch);
      
      // If no files exist, create default ones
      if (fileList.length === 0 && repository) {
        const defaultFiles: Omit<File, 'id'>[] = [
          {
            repositoryId,
            branchId: currentBranch,
            path: '/src',
            type: 'directory',
            lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            repositoryId,
            branchId: currentBranch,
            path: '/README.md',
            type: 'file',
            content: `# ${repository.name}\n\nA privacy-first, decentralized repository with local data storage.`,
            lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          {
            repositoryId,
            branchId: currentBranch,
            path: '/package.json',
            type: 'file',
            content: `{\n  "name": "${repository.name.toLowerCase().replace(/\s+/g, '-')}",\n  "version": "0.1.0"\n}`,
            lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            repositoryId,
            branchId: currentBranch,
            path: '/src/index.js',
            type: 'file',
            content: 'console.log("Hello, DataHub!");',
            lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          }
        ];
        
        const createdFiles: File[] = [];
        for (const file of defaultFiles) {
          const id = await files.add(file);
          createdFiles.push({ ...file, id });
        }
        
        return createdFiles;
      }
      
      return fileList;
    },
    enabled: repoBranches.length > 0
  });

  // Fetch pull requests
  const { data: repoPullRequests = [], isLoading: isLoadingPRs } = useQuery({
    queryKey: [`/repository/${repositoryId}/pull-requests`],
    queryFn: async () => {
      const prList = await pullRequests.getByRepository(repositoryId);
      
      // If no PRs exist, create default ones
      if (prList.length === 0 && repository) {
        const defaultPRs: Omit<PullRequest, 'id'>[] = [
          {
            repositoryId,
            title: 'Add user authentication feature',
            description: 'Implements user login and registration functionality',
            sourceBranch: 'feature/login',
            targetBranch: 'development',
            status: 'open',
            author: 'Morgan Taylor',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            repositoryId,
            title: 'Improve API documentation',
            description: 'Updates API docs with examples and better explanations',
            sourceBranch: 'docs/api',
            targetBranch: 'main',
            status: 'merged',
            author: 'Jamie Smith',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        ];
        
        const createdPRs: PullRequest[] = [];
        for (const pr of defaultPRs) {
          const id = await pullRequests.add(pr);
          createdPRs.push({ ...pr, id });
        }
        
        return createdPRs;
      }
      
      return prList;
    },
    enabled: !!repository
  });

  // Initialize current branch ID when branches are loaded
  useEffect(() => {
    if (repoBranches.length > 0 && !currentBranchId) {
      const defaultBranch = repoBranches.find(b => b.isCurrent) || repoBranches[0];
      setCurrentBranchId(defaultBranch.id);
    }
  }, [repoBranches, currentBranchId]);

  // Set up P2P sync event listeners
  useEffect(() => {
    const progressListener = (status: any) => {
      if (status.repositoryId === repositoryId) {
        setSyncProgress(status.progress);
      }
    };
    
    const completedListener = (status: any) => {
      if (status.repositoryId === repositoryId) {
        setSyncProgress(100);
        setIsSyncing(false);
        
        toast({
          title: "Sync complete",
          description: `Repository "${repository?.name}" has been successfully synced.`
        });
      }
    };
    
    p2pClient.on('syncProgress', progressListener);
    p2pClient.on('syncCompleted', completedListener);
    
    return () => {
      p2pClient.off('syncProgress', progressListener);
      p2pClient.off('syncCompleted', completedListener);
    };
  }, [repositoryId, repository, toast]);

  // Handle branch switching
  const handleBranchChange = async (branchId: string) => {
    const numericId = parseInt(branchId);
    setCurrentBranchId(numericId);
    await branches.setCurrentBranch(numericId, repositoryId);
  };

  // Handle file selection
  const handleFileClick = (file: File) => {
    // In a real application, this would show file content or navigate to a file view
    toast({
      title: "File selected",
      description: `Selected ${file.path}`
    });
  };

  // Handle sync repository
  const handleSyncRepo = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      await p2pClient.syncRepository(repositoryId);
    } catch (error) {
      setIsSyncing(false);
      toast({
        title: "Sync failed",
        description: "Failed to sync repository with peers.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingRepo) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading repository...</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-xl font-semibold">Repository not found</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 h-full overflow-y-auto">
        <div className="px-6 py-4">
          <Header 
            title={repository.name} 
            showBackButton={true}
            backButtonUrl="/"
            actions={
              <Button 
                onClick={handleSyncRepo} 
                disabled={isSyncing}
                className="flex items-center space-x-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Syncing {syncProgress.toFixed(0)}%</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">Sync Now</span>
                  </>
                )}
              </Button>
            }
          />
          
          <div className="mb-6">
            <Tabs defaultValue="files" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="files" className="flex items-center">
                  <Folder className="mr-2 h-4 w-4" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="commits" className="flex items-center">
                  <GitCommit className="mr-2 h-4 w-4" />
                  Commits
                </TabsTrigger>
                <TabsTrigger value="branches" className="flex items-center">
                  <GitBranch className="mr-2 h-4 w-4" />
                  Branches
                </TabsTrigger>
                <TabsTrigger value="pullRequests" className="flex items-center">
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Pull Requests
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="space-y-6">
                {isLoadingFiles || isLoadingBranches ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <FileExplorer 
                    repository={repository}
                    files={repoFiles}
                    branches={repoBranches}
                    currentBranch={currentBranchId.toString()}
                    onBranchChange={handleBranchChange}
                    onFileClick={handleFileClick}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="commits" className="space-y-6">
                <DataCard title="Recent Commits">
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-md flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <GitCommit className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Fix bug in authentication flow</h3>
                        <p className="text-sm text-muted-foreground">by Alex Johnson • 2 hours ago</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        View Changes
                      </Button>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-md flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <GitCommit className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Update README with installation steps</h3>
                        <p className="text-sm text-muted-foreground">by Jamie Smith • 1 day ago</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        View Changes
                      </Button>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-md flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <GitCommit className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Refactor user profile component</h3>
                        <p className="text-sm text-muted-foreground">by Chris Lee • 3 days ago</p>
                      </div>
                      <Button variant="outline" size="sm" className="ml-auto">
                        View Changes
                      </Button>
                    </div>
                  </div>
                </DataCard>
              </TabsContent>
              
              <TabsContent value="branches" className="space-y-6">
                {isLoadingBranches ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <BranchManagement 
                    branches={repoBranches}
                    onSwitchBranch={id => handleBranchChange(id.toString())}
                    currentBranchId={currentBranchId}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="pullRequests" className="space-y-6">
                <DataCard 
                  title="Active Pull Requests"
                  actions={
                    <Button size="sm">
                      <GitPullRequest className="mr-2 h-4 w-4" />
                      New Pull Request
                    </Button>
                  }
                >
                  {isLoadingPRs ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {repoPullRequests.map(pr => (
                        <PullRequestCard key={pr.id} pullRequest={pr} />
                      ))}
                      
                      {repoPullRequests.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No pull requests found</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            Create your first pull request
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </DataCard>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <DataCard title="Repository Details">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1">
                    {repository.description || 'No description provided'}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Visibility</h3>
                  <p className="mt-1 flex items-center">
                    {repository.isPrivate ? (
                      <>
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Private</span>
                        <span className="ml-2 text-sm">Only you can access this repository</span>
                      </>
                    ) : (
                      <>
                        <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-full">Public</span>
                        <span className="ml-2 text-sm">Anyone can access this repository</span>
                      </>
                    )}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Peer Connections</h3>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="relative flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs text-primary font-medium">P1</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs text-primary font-medium">P2</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs text-primary font-medium">+3</span>
                      </div>
                    </div>
                    <span className="text-sm">5 peers connected</span>
                  </div>
                </div>
              </div>
            </DataCard>
            
            <DataCard 
              title="Activity" 
              actions={
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  View All
                </Button>
              }
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <GitBranch className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">You created branch <span className="font-medium">feature/login</span></p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <GitCommit className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">You pushed 3 new commits to <span className="font-medium">main</span></p>
                    <p className="text-xs text-muted-foreground">5 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <GitPullRequest className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm">You merged pull request <span className="font-medium">#4</span></p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
              </div>
            </DataCard>
          </div>
        </div>
      </main>
    </div>
  );
}
