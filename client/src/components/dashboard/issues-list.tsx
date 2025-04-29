import { Issue } from "@shared/schema";
import { IssueCard } from "./issue-card";
import { LoadingSpinner } from "../ui/loading-spinner";
import { useCallback, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IssuesListProps {
  issues: Issue[];
  isLoading: boolean;
  onClick?: (issue: Issue) => void;
  limit?: number;
}

export function IssuesList({
  issues = [],
  isLoading,
  onClick,
  limit,
}: IssuesListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredIssues = issues.filter((issue) => {
    const statusMatch = statusFilter === "all" || issue.status === statusFilter;
    const priorityMatch =
      priorityFilter === "all" || issue.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const displayedIssues = limit
    ? filteredIssues.slice(0, limit)
    : filteredIssues;

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handlePriorityFilterChange = useCallback((value: string) => {
    setPriorityFilter(value);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="md" text="Loading issues..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!limit && (
        <div className="flex space-x-4">
          <div className="space-y-1.5">
            <label
              htmlFor="status-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger id="status-filter" className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="priority-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              Priority
            </label>
            <Select
              value={priorityFilter}
              onValueChange={handlePriorityFilterChange}
            >
              <SelectTrigger id="priority-filter" className="w-[150px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {displayedIssues.length > 0 ? (
        <div className="space-y-2">
          {displayedIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={onClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed rounded-lg bg-background-surface">
          <p className="text-muted-foreground">No issues found</p>
        </div>
      )}
    </div>
  );
}
