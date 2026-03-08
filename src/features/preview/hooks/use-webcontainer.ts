import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";

import { 
  buildFileTree,
  getFilePath
} from "../utils/file-tree";
import { useFolderContents } from "@/features/projects/hooks/use-files";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Singleton WebContainer instance
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (!bootPromise) {
    bootPromise = WebContainer.boot({ coep: "credentialless" });
  }

  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
};

const teardownWebContainer = () => {
  if (webcontainerInstance) {
    webcontainerInstance.teardown();
    webcontainerInstance = null;
  }
  bootPromise = null;
};

interface UseWebContainerProps {
  projectId: Id<"projects">;
  enabled: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
};

export const useWebContainer = ({
  projectId,
  enabled,
  settings,
}: UseWebContainerProps) => {
  const [status, setStatus] = useState<
    "idle" | "booting" | "installing" | "running" | "error"
  >("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("");

  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);

  // Fetch files from Convex (auto-updates on changes)
  const files = useFolderContents({ projectId });

  // Initial boot and mount
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
      return;
    }

    // Wait for files to be loaded
    if (!files) {
      console.warn("[WebContainer] Waiting for files to load...", {
        projectId,
        enabled,
        hasStarted: hasStartedRef.current
      });
      return;
    }

    if (files.length === 0) {
      console.warn("[WebContainer] No files available to mount", {
        filesLength: files.length,
        projectId,
        hasStarted: hasStartedRef.current
      });
      setError("No files found in this project. Please ensure files have been imported.");
      setStatus("error");
      return;
    }

    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const start = async () => {
      try {
        console.log("[WebContainer] Starting WebContainer initialization...", { fileCount: files.length });
        setStatus("booting");
        setError(null);
        setTerminalOutput("");

        const appendOutput = (data: string) => {
          console.log("[WebContainer Output]", data);
          setTerminalOutput((prev) => prev + data);
        };

        console.log("[WebContainer] Booting WebContainer...");
        const container = await getWebContainer();
        console.log("[WebContainer] Container booted successfully");
        containerRef.current = container;

        console.log("[WebContainer] Building file tree...", { fileCount: files.length });
        const fileTree = buildFileTree(files);
        console.log("[WebContainer] File tree built, mounting...", { treeRootKeys: Object.keys(fileTree) });

        await container.mount(fileTree);
        console.log("[WebContainer] Files mounted successfully");

        container.on("server-ready", (_port, url) => {
          console.log("[WebContainer] Server ready event fired", { url, port: _port });
          setPreviewUrl(url);
          setStatus("running");
        });

        setStatus("installing");

        // Parse install command (default: npm install)
        const installCmd = settings?.installCommand || "npm install";
        const [installBin, ...installArgs] = installCmd.split(" ");
        appendOutput(`$ ${installCmd}\n`)
        console.log("[WebContainer] Spawning install process", { bin: installBin, args: installArgs });

        const installProcess = await container.spawn(installBin, installArgs);
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          })
        );
        const installExitCode = await installProcess.exit;
        console.log("[WebContainer] Install process finished", { exitCode: installExitCode });

        if (installExitCode !== 0) {
          throw new Error(
            `${installCmd} failed with code ${installExitCode}`
          );
        }

        // Parse dev command (default: npm run dev)
        const devCmd = settings?.devCommand || "npm run dev";
        const [devBin, ...devArgs] = devCmd.split(" ");
        appendOutput(`\n$ ${devCmd}\n`);
        console.log("[WebContainer] Spawning dev process", { bin: devBin, args: devArgs });

        const devProcess = await container.spawn(devBin, devArgs);
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              appendOutput(data);
            },
          })
        );
      } catch (error) {
        console.error("[WebContainer] Error during initialization", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStatus("error");
      }
    };

    start();
  }, [
    enabled,
    files,
    projectId,
    restartKey,
    settings?.devCommand,
    settings?.installCommand,
  ]);

  // Sync file changes (hot-reload)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status !== "running") return;

    const filesMap = new Map(files.map((f) => [f._id, f]));

    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) continue;

      const filePath = getFilePath(file, filesMap);
      container.fs.writeFile(filePath, file.content);
    }
  }, [files, status]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
    }
  }, [enabled]);

  // Restart the entire WebContainer process
  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setRestartKey((k) => k + 1);
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  };
};