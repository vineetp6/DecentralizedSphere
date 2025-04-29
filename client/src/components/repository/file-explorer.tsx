import { File } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FolderIcon, FileIcon, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FileExplorerProps {
  files: File[];
  branches: { id: number; name: string }[];
  currentBranchId: number;
  onBranchChange: (branchId: number) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export function FileExplorer({ 
  files, 
  branches, 
  currentBranchId, 
  onBranchChange,
  onFileSelect,
  className 
}: FileExplorerProps) {
  const handleBranchChange = (value: string) => {
    onBranchChange(Number(value));
  };

  // Group files by directories
  const directories = new Map<string, File[]>();
  const rootFiles: File[] = [];
  
  files.forEach(file => {
    const path = file.path;
    const lastSlashIndex = path.lastIndexOf('/');
    
    if (lastSlashIndex === -1) {
      // This is a file in the root directory
      rootFiles.push(file);
      return;
    }
    
    const directory = path.substring(0, lastSlashIndex);
    if (!directories.has(directory)) {
      directories.set(directory, []);
    }
    directories.get(directory)!.push(file);
  });
  
  // Get a sorted list of all directories
  const sortedDirectories = Array.from(directories.keys()).sort();

  return (
    <Card className={cn("bg-background-surface", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-medium">File Explorer</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Branch:</span>
              <Select 
                value={currentBranchId.toString()} 
                onValueChange={handleBranchChange}
              >
                <SelectTrigger className="w-[150px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" className="h-8">
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium">Last commit</TableHead>
              <TableHead className="font-medium">Last updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDirectories.map(directory => (
              <TableRow 
                key={directory} 
                className="hover:bg-muted/20 cursor-pointer transition-colors"
              >
                <TableCell className="py-3">
                  <div className="flex items-center space-x-2">
                    <FolderIcon className="h-4 w-4 text-primary" />
                    <span>{directory}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {directories.get(directory)![0].lastCommitMessage || 'No commit message'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(directories.get(directory)![0].lastUpdated), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
            
            {rootFiles.map(file => (
              <TableRow 
                key={file.id} 
                className="hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => onFileSelect && onFileSelect(file)}
              >
                <TableCell className="py-3">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{file.path}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.lastCommitMessage || 'No commit message'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(file.lastUpdated), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
            
            {sortedDirectories.length === 0 && rootFiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No files found in this branch.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
