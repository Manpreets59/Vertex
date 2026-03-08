import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { AlertCircleIcon, ArrowRightIcon, GlobeIcon, Loader2Icon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

import { Doc, Id } from "../../../../convex/_generated/dataModel";

import { useProjectsPartial } from "../hooks/use-projects";

const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { 
    addSuffix: true
  });
};

const getProjectIcon = (project: Doc<"projects">) => {
  if (project.importStatus === "completed") {
    return <FaGithub className="size-3.5 text-muted-foreground" />
  }

  if (project.importStatus === "failed") {
    return <AlertCircleIcon className="size-3.5 text-muted-foreground" />;
  }

  if (project.importStatus === "importing") {
    return (
      <Loader2Icon className="size-3.5 text-muted-foreground animate-spin" />
    );
  }

  return <GlobeIcon className="size-3.5 text-muted-foreground" />;
}

interface ProjectsListProps {
  onViewAll: () => void;
}

const ContinueCard = ({ 
  data
}: {
  data: Doc<"projects">;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">
        Last updated
      </span>
      <Button
        variant="outline"
        asChild
        className="h-auto items-start justify-start p-4 bg-background border rounded-none flex flex-col gap-2"
      >
        <Link href={`/projects/${data._id}`} className="group">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {getProjectIcon(data)}
              <span className="font-medium truncate">
                {data.name}
              </span>
            </div>
            <ArrowRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(data.updatedAt)}
          </span>
        </Link>
      </Button>
    </div>
  )
};

const ProjectItem = ({
  data
}: {
  data: Doc<"projects">;
}) => {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newName, setNewName] = useState(data.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/projects/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: data._id,
          name: newName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename project");
      }

      toast.success("Project renamed successfully");
      setRenameOpen(false);
    } catch (error) {
      toast.error("Failed to rename project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: data._id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast.success("Project deleted successfully");
      setDeleteOpen(false);
    } catch (error) {
      toast.error("Failed to delete project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between w-full group py-1 px-1 rounded hover:bg-accent/50">
        <Link
          href={`/projects/${data._id}`}
          className="text-sm text-foreground/60 font-medium hover:text-foreground flex-1 flex items-center gap-2"
        >
          {getProjectIcon(data)}
          <span className="truncate">{data.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">
            {formatTimestamp(data.updatedAt)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600"
              >
                <Trash2Icon className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename Dialog */}
      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Rename Project</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a new name for this project
          </AlertDialogDescription>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRename}
              disabled={isLoading}
            >
              {isLoading ? "Renaming..." : "Rename"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{data.name}"? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ProjectsList = ({ 
  onViewAll
}: ProjectsListProps) => {
  const projects = useProjectsPartial(6);

  if (projects === undefined) {
    return <Spinner className="size-4 text-ring" />
  }

  const [mostRecent, ...rest] = projects;

  return (
    <div className="flex flex-col gap-4">
      {mostRecent ? <ContinueCard data={mostRecent} /> : null}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Recent projects
            </span>
            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              <span>View all</span>
              <Kbd className="bg-accent border">
                ⌘K
              </Kbd>
            </button>
          </div>
          <ul className="flex flex-col">
            {rest.map((project) => (
              <ProjectItem
                key={project._id}
                data={project}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
};