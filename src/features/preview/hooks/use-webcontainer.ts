import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";

import { 
  buildFileTree,
  getFilePath
} from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";

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

  const files = useFiles(projectId);

  useEffect(() => {
    if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const start = async () => {
      const appendOutput = (data: string) => {
        setTerminalOutput((prev) => prev + data);
      };

      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");

        const container = await getWebContainer();
        containerRef.current = container;

        const fileTree = buildFileTree(files);
        const fileCount = Object.keys(fileTree).length;
        appendOutput(`📦 Mounting ${fileCount} items to WebContainer...\n`);
        appendOutput(`Files available: ${files.length} total\n\n`);

        await container.mount(fileTree);

        // server-ready fires when the dev server is up — this is the correct
        // signal to show the preview. Set URL and status here directly.
        container.on("server-ready", (_port, url) => {
          appendOutput(`\n✅ Server ready at ${url}\n`);
          setPreviewUrl(url);
          setStatus("running");
        });

        setStatus("installing");

        const installCmd = settings?.installCommand || "npm install";
        appendOutput(`$ ${installCmd}\n`);

        const [installBin, ...installArgs] = installCmd.split(" ");
        const installProcess = await container.spawn(installBin, installArgs);

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) { appendOutput(data); },
          })
        );

        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          throw new Error(`${installCmd} failed with code ${installExitCode}`);
        }

        // Disable Turbopack — it uses WASM bindings unavailable in WebContainer
        appendOutput(`\n📝 Configuring environment...\n`);

        try { await container.fs.rm("/next.config.ts", { force: true }); } catch {}
        try { await container.fs.rm("/next.config.mjs", { force: true }); } catch {}
        try { await container.fs.rm("/next.config.js", { force: true }); } catch {}

        await container.fs.writeFile("/next.config.js", `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`);
        appendOutput(`✓ Config ready\n\n`);

        // Always add --no-turbo to prevent Turbopack WASM errors
        const baseDevCmd = settings?.devCommand || "npm run dev";
        const devCmd = baseDevCmd.includes("--no-turbo")
          ? baseDevCmd
          : `${baseDevCmd} -- --no-turbo`;

        appendOutput(`$ ${devCmd}\n`);
        appendOutput(`Starting dev server...\n\n`);

        const [devBin, ...devArgs] = devCmd.split(" ");
        const devProcess = await container.spawn(devBin, devArgs);

        devProcess.output.pipeTo(
          new WritableStream({
            write(data) { appendOutput(data); },
          })
        );

        // Monitor for unexpected exit only — do NOT await this for normal flow.
        // The server-ready event above handles the success case.
        // If the process exits with a non-zero code, that's an error.
        devProcess.exit.then((code) => {
          if (code !== 0) {
            const msg = `Dev server exited unexpectedly with code ${code}`;
            appendOutput(`\n❌ ${msg}\n`);
            setError(msg);
            setStatus("error");
          }
        });

        // Give the dev server up to 120 seconds to emit server-ready.
        // If it doesn't, show a helpful timeout error.
        await new Promise<void>((_, reject) => {
          setTimeout(() => {
            // Only reject if we haven't already gone to "running"
            setStatus((current) => {
              if (current !== "running") {
                reject(new Error(
                  "Dev server startup timeout (120s). " +
                  "Check terminal output for errors. " +
                  "Common fix: add --no-turbo to your dev command in Preview Settings."
                ));
              }
              return current;
            });
          }, 120000);
        });

      } catch (error) {
        // Don't overwrite a successful "running" state with an error
        setStatus((current) => {
          if (current === "running") return current;

          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setError(errorMessage);

          let helpText = "";
          if (errorMessage.includes("turbo") || errorMessage.includes("wasm")) {
            helpText = "\n💡 Turbopack is not supported in WebContainer.\n" +
              "Go to Preview Settings and set Start Command to:\n" +
              "npm run dev -- --no-turbo\n";
          } else if (errorMessage.includes("timeout")) {
            helpText = "\n💡 The server took too long to start.\n" +
              "Check the terminal for build errors.\n" +
              "Try: Preview Settings → Start Command → npm run dev -- --no-turbo\n";
          } else if (errorMessage.includes("npm install") || errorMessage.includes("code 1")) {
            helpText = "\n💡 Installation failed. Check terminal for details.\n" +
              "Common causes: missing package.json, incompatible dependencies.\n";
          }

          appendOutput(`\n❌ Error: ${errorMessage}${helpText}\n`);
          return "error";
        });
      }
    };

    start();
  }, [enabled, files, restartKey, settings?.devCommand, settings?.installCommand]);

  // Sync file changes to running container
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

  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setTerminalOutput("");
    setRestartKey((k) => k + 1);
  }, []);

  return { status, previewUrl, error, restart, terminalOutput };
};