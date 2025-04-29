import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { usePipelines } from "@/hooks/use-pipelines";
import { PipelineCard } from "@/components/pipelines/pipeline-card";
import { DataCard } from "@/components/ui/data-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function PipelinesPage() {
  const [, navigate] = useLocation();
  const { data: pipelines, isLoading } = usePipelines();

  // Group pipelines by status
  const successPipelines = pipelines?.filter(p => p.status === 'success') || [];
  const failedPipelines = pipelines?.filter(p => p.status === 'failed') || [];
  const runningPipelines = pipelines?.filter(p => p.status === 'running') || [];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 h-full overflow-y-auto">
        <div className="px-6 py-4">
          <Header 
            title="CI/CD Pipelines" 
            showBackButton
            backButtonUrl="/"
            actions={
              <Button onClick={() => navigate("/new-pipeline")}>
                New Pipeline
              </Button>
            }
          />
          
          <div className="mt-8">
            <Tabs defaultValue="all">
              <TabsList className="mb-6">
                <TabsTrigger value="all">All Pipelines</TabsTrigger>
                <TabsTrigger value="running">Running</TabsTrigger>
                <TabsTrigger value="success">Successful</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <DataCard title="All Pipelines">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : pipelines && pipelines.length > 0 ? (
                    <div className="space-y-4">
                      {pipelines.map(pipeline => (
                        <PipelineCard 
                          key={pipeline.id} 
                          pipeline={pipeline}
                          showRepository
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No pipelines found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => navigate("/new-pipeline")}
                      >
                        Create your first pipeline
                      </Button>
                    </div>
                  )}
                </DataCard>
              </TabsContent>
              
              <TabsContent value="running">
                <DataCard title="Running Pipelines">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : runningPipelines.length > 0 ? (
                    <div className="space-y-4">
                      {runningPipelines.map(pipeline => (
                        <PipelineCard 
                          key={pipeline.id} 
                          pipeline={pipeline} 
                          showRepository
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No running pipelines</p>
                    </div>
                  )}
                </DataCard>
              </TabsContent>
              
              <TabsContent value="success">
                <DataCard title="Successful Pipelines">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : successPipelines.length > 0 ? (
                    <div className="space-y-4">
                      {successPipelines.map(pipeline => (
                        <PipelineCard 
                          key={pipeline.id} 
                          pipeline={pipeline} 
                          showRepository
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No successful pipelines</p>
                    </div>
                  )}
                </DataCard>
              </TabsContent>
              
              <TabsContent value="failed">
                <DataCard title="Failed Pipelines">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : failedPipelines.length > 0 ? (
                    <div className="space-y-4">
                      {failedPipelines.map(pipeline => (
                        <PipelineCard 
                          key={pipeline.id} 
                          pipeline={pipeline} 
                          showRepository
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No failed pipelines</p>
                    </div>
                  )}
                </DataCard>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}