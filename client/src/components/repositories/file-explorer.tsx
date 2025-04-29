import { useState } from "react";
import { File, Repository } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Folder, FileText, Upload, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FileExplorerProps {
  repository: Repository;
  files: File[];
  branches: { id: number; name: string; isDefault: boolean }[];
  currentBranch: string;
  onBranchChange: (branchId: string) => void;
  onFileClick: (file: File) => void;
}

export function FileExplorer({ 
  repository, 
  files, 
  branches, 
  currentBranch,
  onBranchChange,
  onFileClick
}: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState<string>('/');
  
  // Filter files by current path
  const currentFiles = files.filter(file => {
    // Get the parent path
    const filePath = file.path;
    const parentPath = filePath.substring(0, filePath.lastIndexOf('/') + 1) || '/';
    return parentPath === currentPath;
  });
  
  // Get unique directories at the current path level
  const directories = new Set<string>();
  files.forEach(file => {
    if (file.path.startsWith(currentPath) && file.path !== currentPath) {
      const remainingPath = file.path.substring(currentPath.length);
      const nextDir = remainingPath.split('/')[0];
      if (nextDir) {
        directories.add(nextDir);
      }
    }
  });
  
  const handlePathClick = (newPath: string) => {
    setCurrentPath(newPath);
  };
  
  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? '/' : `/${pathParts.join('/')}/`;
    setCurrentPath(newPath);
  };
  
  // Generate breadcrumb paths
  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [
    { path: '/', label: 'Root' },
    ...pathParts.map((part, index) => {
      const path = '/' + pathParts.slice(0, index + 1).join('/') + '/';
      return { path, label: part };
    })
  ];
  
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <CardTitle>File Explorer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Branch:</span>
            <Select defaultValue={currentBranch} onValueChange={onBranchChange}>
              <SelectTrigger className="bg-muted text-foreground text-sm rounded-md w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name} {branch.isDefault && "(default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
        
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1 mb-3 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.path} className="flex items-center">
              {i > 0 && <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />}
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary" 
                onClick={() => handlePathClick(crumb.path)}
              >
                {crumb.label}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="bg-muted rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Name</TableHead>
                <TableHead>Last commit</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPath !== '/' && (
                <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={navigateUp}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Folder className="h-4 w-4 text-primary" />
                      <span>..</span>
                    </div>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
              
              {/* Directories */}
              {Array.from(directories).map(dir => (
                <TableRow 
                  key={`dir-${dir}`} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handlePathClick(`${currentPath}${dir}/`)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Folder className="h-4 w-4 text-primary" />
                      <span>{dir}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                </TableRow>
              ))}
              
              {/* Files */}
              {currentFiles.map(file => (
                <TableRow 
                  key={`file-${file.id}`} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onFileClick(file)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{file.path.split('/').pop()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {/* In a real application, this would be the last commit message */}
                    Update {file.path.split('/').pop()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(file.lastUpdated), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
              
              {currentFiles.length === 0 && directories.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    This directory is empty
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
