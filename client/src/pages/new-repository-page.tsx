import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useRepositories } from "@/hooks/use-repositories";
import { queryClient } from "@/lib/queryClient"; 
import { useMutation } from "@tanstack/react-query";

export default function NewRepositoryPage() {
  const [, navigate] = useLocation();
  const [isPrivate, setIsPrivate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { createRepository, isPendingCreate } = useRepositories();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return; // Don't submit if name is empty
    }
    
    createRepository(
      {
        name,
        description,
        isPrivate
      },
      {
        onSuccess: () => {
          navigate("/");
        }
      }
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 h-full overflow-y-auto">
        <div className="px-6 py-4">
          <Header 
            title="Create New Repository" 
            showBackButton
            backButtonUrl="/"
          />
          
          <div className="max-w-3xl mx-auto mt-8">
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>New Repository</CardTitle>
                  <CardDescription>
                    Create a new repository to store your code, manage issues, and collaborate with others.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Repository Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g., my-awesome-project" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea 
                      id="description" 
                      placeholder="A brief description of your repository"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="private" 
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                    <Label htmlFor="private">Private repository</Label>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => navigate("/")}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isPendingCreate ? "Creating..." : "Create Repository"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}