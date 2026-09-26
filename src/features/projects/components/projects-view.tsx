"use client";

import { useEffect, useState } from "react";
import { SparkleIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { UserButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

import { ProjectsList } from "./projects-list";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import { ImportGithubDialog } from "./import-github-dialog";
import { NewProjectDialog } from "./new-project-dialog";

const ORANGE = "#FF7849";
const BORDER = "#252530";
const CARD = "#14141B";
const EASE = "cubic-bezier(0.16,1,0.3,1)";

const ActionCard = ({
  icon: Icon,
  label,
  hint,
  shortcut,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  hint: string;
  shortcut: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex flex-col gap-5 text-left p-5 rounded-xl border transition-all cursor-pointer"
    style={{ background: CARD, borderColor: BORDER, transition: `transform 0.3s ${EASE}, border-color 0.3s ${EASE}` }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(255,120,73,0.35)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = BORDER; }}
  >
    <div className="flex items-center justify-between w-full">
      <div className="size-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,120,73,0.1)", border: `1px solid rgba(255,120,73,0.2)` }}>
        <Icon className="size-5" style={{ color: ORANGE }} />
      </div>
      <Kbd className="bg-white/5 border-white/10 text-white/40">{shortcut}</Kbd>
    </div>
    <div>
      <p className="font-heading font-semibold text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  </button>
);

export const ProjectsView = () => {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") { e.preventDefault(); setCommandDialogOpen(true); }
        if (e.key === "i") { e.preventDefault(); setImportDialogOpen(true); }
        if (e.key === "j") { e.preventDefault(); setNewProjectDialogOpen(true); }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen} />
      <ImportGithubDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <NewProjectDialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen} />

      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "#09090B",
          backgroundImage: `
            linear-gradient(rgba(255,120,73,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,120,73,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      >
        {/* Top nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Vertex" className="size-6" />
            <span className={cn("text-sm font-semibold font-heading")}>Vertex</span>
          </div>
          <UserButton />
        </div>

        {/* Main content */}
        <div className="flex-1 px-6 py-16">
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
            {/* Header */}
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Your projects
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Start building or continue where you left off
              </p>
            </div>

            {/* Action cards */}
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                icon={SparkleIcon}
                label="New project"
                hint="Start from a blank workspace"
                shortcut="⌘J"
                onClick={() => setNewProjectDialogOpen(true)}
              />
              <ActionCard
                icon={FaGithub as React.ElementType}
                label="Import repo"
                hint="Bring in an existing GitHub project"
                shortcut="⌘I"
                onClick={() => setImportDialogOpen(true)}
              />
            </div>

            {/* Projects list */}
            <ProjectsList onViewAll={() => setCommandDialogOpen(true)} />
          </div>
        </div>
      </div>
    </>
  );
};