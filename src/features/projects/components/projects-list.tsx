import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { AlertCircleIcon, ArrowRightIcon, GlobeIcon, Loader2Icon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";

import { Doc } from "../../../../convex/_generated/dataModel";
import { useProjectsPartial } from "../hooks/use-projects";

const BORDER = "#252530";
const CARD = "#14141B";
const EASE = "cubic-bezier(0.16,1,0.3,1)";

const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

const getProjectIcon = (project: Doc<"projects">) => {
  // Only show importing spinner if status is literally "importing"
  // Don't show it for completed, failed, or undefined (new blank projects)
  if (project.importStatus === "importing") {
    return <Loader2Icon className="size-3.5 text-muted-foreground animate-spin" />;
  }
  if (project.importStatus === "completed") {
    return <FaGithub className="size-3.5 text-muted-foreground" />;
  }
  if (project.importStatus === "failed") {
    return <AlertCircleIcon className="size-3.5 text-muted-foreground" />;
  }
  // importStatus is undefined = regular blank project, no spinner
  return <GlobeIcon className="size-3.5 text-muted-foreground" />;
};

interface ProjectsListProps {
  onViewAll: () => void;
}

const ContinueCard = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Last updated</span>
      <Link
        href={`/projects/${data._id}`}
        className="group flex flex-col gap-2 p-4 rounded-xl border transition-all"
        style={{ background: CARD, borderColor: BORDER, transition: `transform 0.3s ${EASE}, border-color 0.3s ${EASE}` }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "rgba(255,120,73,0.35)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = BORDER; }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 min-w-0">
            {getProjectIcon(data)}
            <span className="font-medium truncate">{data.name}</span>
          </div>
          <ArrowRightIcon className="size-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <span className="text-xs text-muted-foreground">
          {formatTimestamp(data.updatedAt)}
        </span>
      </Link>
    </div>
  );
};

const ProjectItem = ({ data }: { data: Doc<"projects"> }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${data.name}"?`)) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/projects/${data._id}`, { method: "DELETE" });
      if (!response.ok) alert("Failed to delete project");
    } catch {
      alert("Error deleting project");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between w-full group px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <Link
        href={`/projects/${data._id}`}
        className="text-sm text-foreground/70 font-medium hover:text-foreground flex items-center gap-2 flex-1 min-w-0"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getProjectIcon(data)}
          <span className="truncate">{data.name}</span>
        </div>
        <span className="text-xs text-muted-foreground ml-2 shrink-0">
          {formatTimestamp(data.updatedAt)}
        </span>
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="ml-3 p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
      >
        {isDeleting ? <Loader2Icon className="size-4 animate-spin" /> : <TrashIcon className="size-4" />}
      </button>
    </div>
  );
};

export const ProjectsList = ({ onViewAll }: ProjectsListProps) => {
  const projects = useProjectsPartial(6);

  if (projects === undefined) return <Spinner className="size-4 text-ring" />;

  if (projects.length === 0) return null;

  const [mostRecent, ...rest] = projects;

  return (
    <div className="flex flex-col gap-4">
      {mostRecent ? <ContinueCard data={mostRecent} /> : null}
      {rest.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Recent projects</span>
            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              <span>View all</span>
              <Kbd className="bg-accent border">⌘K</Kbd>
            </button>
          </div>
          <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: BORDER }}>
            {rest.map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};