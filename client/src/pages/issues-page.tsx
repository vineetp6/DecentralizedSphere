import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useIssues } from "@/hooks/use-issues";
import { IssuesList } from "@/components/dashboard/issues-list";
import { useRepositories } from "@/hooks/use-repositories";
import { Issue, Repository } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Create schema for new issue
const newIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  repositoryId: z.coerce.number().min(1, "Repository is required"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

type NewIssueFormValues = z.infer<typeof newIssueSchema>;

export default function IssuesPage() {
  const { issues, isLoading: loadingIssues, createIssue, isPendingCreate } = useIssues();
  const { repositories, isLoading: loadingRepos } = useRepositories();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const form = useForm<NewIssueFormValues>({
    resolver: zodResolver(newIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const onSubmit = (data: NewIssueFormValues) => {
    createIssue(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        form.reset();
      },
    });
  };

  const handleCreateIssue = () => {
    setCreateDialogOpen(true);
  };

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  const findRepositoryName = (id: number): string => {
    if (!repositories) return `Repository #${id}`;
    const repo = repositories.find(r => r.id === id);
    return repo ? repo.name : `Repository #${id}`;
  };

  const isLoading = loadingIssues || loadingRepos;

  return (
    <MainLayout 
      title="Issues"
      actions={
        <Button onClick={handleCreateIssue}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Issue
        </Button>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading issues..." />
          </div>
        ) : (
          <IssuesList 
            issues={issues || []} 
            isLoading={loadingIssues}
            onClick={handleIssueSelect}
          />
        )}
      </div>

      {/* Create Issue Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Create a new issue to track bugs, features, or tasks.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Issue title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the issue in detail" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="repositoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a repository" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {repositories?.map((repo: Repository) => (
                          <SelectItem key={repo.id} value={repo.id.toString()}>
                            {repo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPendingCreate}>
                  {isPendingCreate ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Issue"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Issue Details Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        {selectedIssue && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Issue #{selectedIssue.id}: {selectedIssue.title}</DialogTitle>
              <DialogDescription>
                {findRepositoryName(selectedIssue.repositoryId)} • 
                {selectedIssue.priority.charAt(0).toUpperCase() + selectedIssue.priority.slice(1)} Priority
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Status</h4>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedIssue.status === 'open' ? 'bg-primary' : 
                    selectedIssue.status === 'in progress' ? 'bg-warning' :
                    selectedIssue.status === 'resolved' ? 'bg-success' :
                    'bg-muted'
                  }`} />
                  <span>{selectedIssue.status.charAt(0).toUpperCase() + selectedIssue.status.slice(1)}</span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedIssue.description || "No description provided"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedIssue.created).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Updated</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedIssue.updated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setSelectedIssue(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </MainLayout>
  );
}
