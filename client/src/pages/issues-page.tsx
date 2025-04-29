import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { DataCard } from "@/components/ui/data-card";
import { useIssues } from "@/hooks/use-issues";
import { IssueCard } from "@/components/issues/issue-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

export default function IssuesPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: issues, isLoading } = useIssues();

  // Filter issues by status
  const openIssues = issues?.filter(i => i.status === 'open') || [];
  const inProgressIssues = issues?.filter(i => i.status === 'in-progress') || [];
  const closedIssues = issues?.filter(i => i.status === 'closed') || [];

  // Filter by search term
  const filterIssues = (issueList: typeof issues) => {
    if (!searchTerm) return issueList;
    
    return issueList?.filter(issue => 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (issue.description && issue.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 h-full overflow-y-auto">
        <div className="px-6 py-4">
          <Header 
            title="Issues" 
            showBackButton
            backButtonUrl="/"
            actions={
              <Button onClick={() => navigate("/new-issue")}>
                New Issue
              </Button>
            }
          />
          
          <div className="mt-6 mb-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues by title or description..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Issues</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <DataCard title="All Issues">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filterIssues(issues)?.length ? (
                  <div className="space-y-4">
                    {filterIssues(issues)?.map(issue => (
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        showRepository
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No issues found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => navigate("/new-issue")}
                    >
                      Create your first issue
                    </Button>
                  </div>
                )}
              </DataCard>
            </TabsContent>
            
            <TabsContent value="open">
              <DataCard title="Open Issues">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filterIssues(openIssues)?.length ? (
                  <div className="space-y-4">
                    {filterIssues(openIssues)?.map(issue => (
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        showRepository
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No open issues</p>
                  </div>
                )}
              </DataCard>
            </TabsContent>
            
            <TabsContent value="in-progress">
              <DataCard title="In Progress Issues">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filterIssues(inProgressIssues)?.length ? (
                  <div className="space-y-4">
                    {filterIssues(inProgressIssues)?.map(issue => (
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        showRepository
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No issues in progress</p>
                  </div>
                )}
              </DataCard>
            </TabsContent>
            
            <TabsContent value="closed">
              <DataCard title="Closed Issues">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filterIssues(closedIssues)?.length ? (
                  <div className="space-y-4">
                    {filterIssues(closedIssues)?.map(issue => (
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        showRepository
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No closed issues</p>
                  </div>
                )}
              </DataCard>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}