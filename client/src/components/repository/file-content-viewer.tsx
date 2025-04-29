import { File } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileIcon, FolderIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FileContentViewerProps {
  file: File | null;
  className?: string;
}

export function FileContentViewer({ file, className }: FileContentViewerProps) {
  if (!file) {
    return (
      <Card className={cn("bg-background-surface", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">File Viewer</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          Select a file to view its content
        </CardContent>
      </Card>
    );
  }

  const isText = file.type === 'text' || file.path.match(/\.(txt|md|js|jsx|ts|tsx|html|css|json|yaml|yml)$/i);
  const isImage = file.type === 'image' || file.path.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i);
  
  // Get file extension
  const extension = file.path.split('.').pop()?.toLowerCase() || '';
  
  return (
    <Card className={cn("bg-background-surface", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xl font-medium">{file.path}</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(file.lastUpdated), { addSuffix: true })}
          </span>
        </div>
        {file.lastCommitMessage && (
          <p className="text-xs text-muted-foreground mt-1">
            {file.lastCommitMessage}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isText ? (
          <pre className={`bg-background-elevated p-4 rounded-md overflow-auto ${extension === 'md' ? 'prose prose-invert max-w-none' : ''}`}>
            <code>{file.content || '(Empty file)'}</code>
          </pre>
        ) : isImage && file.content ? (
          <div className="flex justify-center">
            <img
              src={file.content}
              alt={file.path}
              className="max-w-full max-h-[500px] object-contain"
            />
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed rounded-lg">
            <p className="text-muted-foreground">
              {file.content 
                ? 'Binary file content cannot be displayed'
                : 'No content available'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
