"use client";

import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TaskFilters {
  source: string;
  timeBlock: string;
}

interface TaskFilterProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

export function TaskFilter({ filters, onFiltersChange }: TaskFilterProps) {
  const hasActiveFilters = filters.source !== "all" || filters.timeBlock !== "all";

  const handleSourceChange = (value: string) => {
    onFiltersChange({ ...filters, source: value });
  };

  const handleTimeBlockChange = (value: string) => {
    onFiltersChange({ ...filters, timeBlock: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({ source: "all", timeBlock: "all" });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.source !== "all") count++;
    if (filters.timeBlock !== "all") count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="flex items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Filter Tasks</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {/* Source Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Source</label>
                <Select value={filters.source} onValueChange={handleSourceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="google-tasks">Google Tasks</SelectItem>
                    <SelectItem value="chatbot">Chatbot</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Block Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule</label>
                <Select value={filters.timeBlock} onValueChange={handleTimeBlockChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="scheduled">Scheduled (Time-blocked)</SelectItem>
                    <SelectItem value="unscheduled">Unscheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          {filters.source !== "all" && (
            <Badge variant="secondary" className="gap-1.5">
              Source: {filters.source === "google-tasks" ? "Google Tasks" : filters.source}
              <button
                onClick={() => handleSourceChange("all")}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.timeBlock !== "all" && (
            <Badge variant="secondary" className="gap-1.5 capitalize">
              {filters.timeBlock}
              <button
                onClick={() => handleTimeBlockChange("all")}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
