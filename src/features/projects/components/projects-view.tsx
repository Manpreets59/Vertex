"use client";

import { useEffect, useState } from "react";
import { Poppins } from "next/font/google";
import { SparkleIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { UserButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

import { ProjectsList } from "./projects-list";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import { ImportGithubDialog } from "./import-github-dialog";
import { NewProjectDialog } from "./new-project-dialog";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
          background: "#0B1020",
          backgroundImage: `
            linear-gradient(rgba(101,98,244,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(101,98,244,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      >
        {/* Top nav with UserButton */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Vertex" className="size-6" />
            <span className={cn("text-sm font-semibold", font.className)}>Vertex</span>
          </div>
          <UserButton />
        </div>

        {/* Glow */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(101,98,244,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Main content */}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="relative z-10 w-full max-w-sm flex flex-col gap-5">
            {/* Header */}
            <div>
              <h1 className={cn("text-xl font-semibold tracking-tight", font.className)}>
                Your projects
              </h1>
              <p className="text-sm text-white/40 mt-0.5">
                Start building or continue where you left off
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setNewProjectDialogOpen(true)}
                className="h-auto items-start justify-start p-4 bg-[#161826] border-white/8 hover:border-[#6562f4]/40 hover:bg-[#1a1c30] flex flex-col gap-5 rounded-xl transition-all"
              >
                <div className="flex items-center justify-between w-full">
                  <SparkleIcon className="size-4 text-[#6562f4]" />
                  <Kbd className="bg-white/5 border-white/10 text-white/40">⌘J</Kbd>
                </div>
                <span className="text-sm font-medium">New project</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="h-auto items-start justify-start p-4 bg-[#161826] border-white/8 hover:border-[#6562f4]/40 hover:bg-[#1a1c30] flex flex-col gap-5 rounded-xl transition-all"
              >
                <div className="flex items-center justify-between w-full">
                  <FaGithub className="size-4 text-white/60" />
                  <Kbd className="bg-white/5 border-white/10 text-white/40">⌘I</Kbd>
                </div>
                <span className="text-sm font-medium">Import repo</span>
              </Button>
            </div>

            {/* Projects list */}
            <ProjectsList onViewAll={() => setCommandDialogOpen(true)} />
          </div>
        </div>
      </div>
    </>
  );
};