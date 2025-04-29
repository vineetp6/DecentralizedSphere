import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DataCard } from "@/components/ui/data-card";
import { RepoCard } from "@/components/repositories/repo-card";
import { IssueCard } from "@/components/issues/issue-card";
import { PipelineCard } from "@/components/pipelines/pipeline-card";
import { DataStatusCircle } from "@/components/data-status/data-status-circle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Repository, branches, commits, files, issues, pipelines, pullRequests, repositories } from "@/lib/database";
import { p2pClient } from "@/lib/p2p-mock";
import { Shield, Link2Off, UserCog, Lock, Database, ChevronRight } from "lucide-react";
import { format } from "date-fns";

// Types
import type { Issue, Pipeline } from "@/lib/database";
import type { SyncStatus } from "@/lib/p2p-mock";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [syncs, setSyncs] = useState<SyncStatus[]>([]);
  
  // Mock repositories data
  const { data: userRepositories = [] } = useQuery({
    queryKey: ['/api/repositories'],
    queryFn: async () => {
      // First try to get from API
      try {
        const response = await fetch('/api/repositories', { credentials: 'include' });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch repositories from API:', error);
      }
      
      // Fallback to local data
      const localRepos = await repositories.getAll();
      
      // If no local repos, create demo data
      if (localRepos.length === 0 && user) {
        // Create mock repositories
        const mockRepos: Repository[] = [
          {
            id: 1,
            name: 'Project Alpha',
            description: 'A decentralized data syncing application',
            lastUpdated: new Date(2023, 9, 15), // Oct 15, 2023
            isPrivate: false,
            branches: [],
            files: []
          },
          {
            id: 2,
            name: 'Beta Repo',
            description: 'Experimental P2P synchronization lib',
            lastUpdated: new Date(2023, 9, 12), // Oct 12, 2023
            isPrivate: true,
            branches: [],
            files: []
          }
        ];
        
        // Add repositories to IndexedDB
        for (const repo of mockRepos) {
          await repositories.add(repo);
        }
        
        return mockRepos;
      }
      
      return localRepos;
    }
  });
  
  // Mock issues data
  const { data: userIssues = [] } = useQuery({
    queryKey: ['/api/issues'],
    queryFn: async () => {
      // First try to get from API
      try {
        const response = await fetch('/api/issues', { credentials: 'include' });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Failed to fetch issues from API:', error);
      }
      
      // Get all issues from local DB
      const repoIds = userRepositories.map((repo: Repository) => repo.id);
      let allIssues: Issue[] = [];
      
      for (const repoId of repoIds) {
        const repoIssues = await issues.getByRepository(repoId);
        allIssues = [...allIssues, ...repoIssues];
      }
      
      // If no issues, create demo data
      if (allIssues.length === 0 && userRepositories.length > 0) {
        const mockIssues: Omit<Issue, 'id'>[] = [
          {
            title: 'Fix login bug',
            description: 'Users are unable to login after session timeout',
            repositoryId: userRepositories[0].id,
            status: 'open',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            title: 'Update README',
            description: 'Add installation steps to README file',
            repositoryId: userRepositories.length > 1 ? userRepositories[1].id : userRepositories[0].id,
            status: 'open',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        // Add issues to IndexedDB
        for (const issue of mockIssues) {
          await issues.add(issue);
        }
        
        // Reload issues
        allIssues = [];
        for (const repoId of repoIds) {
          const repoIssues = await issues.getByRepository(repoId);
          allIssues = [...allIssues, ...repoIssues];
        }
      }
      
      return allIssues;
    },
    enabled: userRepositories.length > 0
  });
  
  // Mock pipelines data
  const { data: userPipelines = [] } = useQuery({
    queryKey: ['/api/pipelines'],
    queryFn: async () => {
      // Aggregate pipelines from all user repositories
      const repoIds = userRepositories.map((repo: Repository) => repo.id);
      let allPipelines: Pipeline[] = [];
      
      for (const repoId of repoIds) {
        const repoPipelines = await pipelines.getByRepository(repoId);
        allPipelines = [...allPipelines, ...repoPipelines];
      }
      
      // If no pipelines, create demo data
      if (allPipelines.length === 0 && userRepositories.length > 0) {
        const mockPipelines = [
          {
            repositoryId: userRepositories[0].id,
            buildNumber: 45,
            status: 'success',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            repositoryId: userRepositories[0].id,
            buildNumber: 44,
            status: 'failed',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
          }
        ];
        
        // Add pipelines to IndexedDB
        for (const pipeline of mockPipelines) {
          await pipelines.add(pipeline);
        }
        
        // Reload pipelines
        allPipelines = [];
        for (const repoId of repoIds) {
          const repoPipelines = await pipelines.getByRepository(repoId);
          allPipelines = [...allPipelines, ...repoPipelines];
        }
      }
      
      return allPipelines;
    },
    enabled: userRepositories.length > 0
  });
  
  // Listen for sync events
  useEffect(() => {
    const updateSyncs = () => {
      setSyncs(p2pClient.getAllSyncs());
    };
    
    p2pClient.on('syncStarted', updateSyncs);
    p2pClient.on('syncProgress', updateSyncs);
    p2pClient.on('syncCompleted', updateSyncs);
    
    // Connect to P2P network
    p2pClient.connect();
    
    return () => {
      p2pClient.off('syncStarted', updateSyncs);
      p2pClient.off('syncProgress', updateSyncs);
      p2pClient.off('syncCompleted', updateSyncs);
    };
  }, []);
  
  // Handle creating new repository
  const handleNewRepo = () => {
    // For demonstration, navigate to a form or modal would open
    // In a real app, this would open a form to create a new repository
    navigate("/new-repository");
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 h-full overflow-y-auto">
        <div className="px-6 py-4">
          <Header 
            title="DataHub" 
            actions={
              <Button onClick={handleNewRepo}>
                New Repo
              </Button>
            }
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Repositories Section */}
            <DataCard 
              title="Repositories" 
              actions={
                <Button variant="outline" size="sm" onClick={handleNewRepo}>
                  New Repo
                </Button>
              }
            >
              <div className="space-y-4">
                {userRepositories.map((repo: Repository) => (
                  <RepoCard key={repo.id} repository={repo} />
                ))}
                
                {userRepositories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No repositories found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleNewRepo}
                    >
                      Create your first repository
                    </Button>
                  </div>
                )}
              </div>
            </DataCard>
            
            {/* Issues Section */}
            <DataCard 
              title="Open Issues" 
              actions={
                <Button variant="outline" size="sm" onClick={() => navigate("/issues")}>
                  View All
                </Button>
              }
            >
              <div className="space-y-3">
                {userIssues.slice(0, 3).map((issue: Issue) => (
                  <IssueCard key={issue.id} issue={issue} showRepository />
                ))}
                
                {userIssues.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No open issues</p>
                  </div>
                )}
              </div>
            </DataCard>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Active Syncs / Notifications Section */}
            <DataCard 
              title={syncs.length > 0 ? "Active Syncs" : "New notification"} 
              actions={syncs.length > 0 ? undefined : (
                <Badge>3</Badge>
              )}
            >
              {syncs.length > 0 ? (
                <div className="space-y-4">
                  {syncs.map((sync) => (
                    <div key={sync.repositoryId} className="bg-muted p-4 rounded-md">
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <Database className="h-10 w-10 text-primary rounded-full p-2 bg-primary/10" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{sync.repositoryName}</h3>
                            <span className="text-xs text-muted-foreground">
                              {sync.timeRemaining ? `${sync.timeRemaining}s remaining` : 'Just now'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Syncing with {sync.peerCount} peers ({Math.round(sync.progress)}%)
                          </p>
                          <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${sync.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <Database className="h-10 w-10 text-primary rounded-full p-2 bg-primary/10" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">Decentralize</h3>
                          <span className="text-xs text-muted-foreground">Just now</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">P2P synced via peer-to-peer</p>
                        <div className="flex mt-2 space-x-2">
                          <Button variant="secondary" size="sm">Open</Button>
                          <Button variant="outline" size="sm">Respond</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <Database className="h-10 w-10 text-primary rounded-full p-2 bg-primary/10" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">Data</h3>
                          <span className="text-xs text-muted-foreground">Today</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Data synchronization lead</p>
                        <div className="flex mt-2 space-x-2">
                          <Button variant="secondary" size="sm">Open</Button>
                          <Button variant="outline" size="sm">Respond</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DataCard>
            
            {/* CI/CD Pipelines Section */}
            <DataCard 
              title="CI/CD Pipelines" 
              actions={
                <Button variant="outline" size="sm" onClick={() => navigate("/pipelines")}>
                  View All
                </Button>
              }
            >
              <div className="space-y-3">
                {userPipelines.slice(0, 3).map((pipeline: Pipeline) => (
                  <PipelineCard key={pipeline.id} pipeline={pipeline} showRepository />
                ))}
                
                {userPipelines.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No pipelines found</p>
                  </div>
                )}
              </div>
            </DataCard>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Data Status Circle */}
            <DataStatusCircle 
              score={8.2} 
              metrics={[
                { 
                  label: 'Data', 
                  value: 7.8, 
                  icon: <Shield className="h-4 w-4 text-primary" /> 
                },
                { 
                  label: 'Decentralization', 
                  value: 8.3, 
                  icon: <Link2Off className="h-4 w-4 text-primary" /> 
                },
                { 
                  label: 'User', 
                  value: 8.1, 
                  icon: <UserCog className="h-4 w-4 text-primary" /> 
                },
                { 
                  label: 'Enhance', 
                  value: 8.3, 
                  icon: <Lock className="h-4 w-4 text-primary" /> 
                }
              ]} 
            />
            
            {/* Repository Overview */}
            <DataCard title="Repository Overview" className="col-span-1 lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-4">File Explorer</h3>
                  {userRepositories.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span>src</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>README.md</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>package.json</span>
                      </li>
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>Create a repository to see files</p>
                    </div>
                  )}
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-4">Recent Commits</h3>
                  {userRepositories.length > 0 ? (
                    <ul className="space-y-3 text-sm">
                      <li>
                        <div className="font-medium">Fix bug in authentication flow</div>
                        <div className="text-xs text-muted-foreground">by {user?.username || 'User'} • 2 hours ago</div>
                      </li>
                      <li>
                        <div className="font-medium">Update README with installation steps</div>
                        <div className="text-xs text-muted-foreground">by {user?.username || 'User'} • 1 day ago</div>
                      </li>
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>No commits yet</p>
                    </div>
                  )}
                </div>
              </div>
            </DataCard>
          </div>
        </div>
      </main>
    </div>
  );
}
