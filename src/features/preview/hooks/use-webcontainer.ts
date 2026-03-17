import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";

import { 
  buildFileTree,
  getFilePath
} from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";

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
  const files = useFiles(projectId);

  // Initial boot and mount
  useEffect(() => {
    if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const start = async () => {
      // Define appendOutput outside try block so it's accessible to all error handlers
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

        // Log files being mounted for debugging
        const fileCount = Object.keys(fileTree).length;
        appendOutput(`📦 Mounting ${fileCount} items to WebContainer...\n`);
        appendOutput(`Files available: ${files.length} total\n\n`);

        await container.mount(fileTree);

        container.on("server-ready", (_port, url) => {
          setPreviewUrl(url);
          setStatus("running");
        });

        setStatus("installing");

        // Parse install command (default: npm install)
        const installCmd = settings?.installCommand || "npm install";

        appendOutput(`$ ${installCmd}\n`)

        // Spawn install process
        const [installBin, ...installArgs] = installCmd.split(" ");
        const installProcess = await container.spawn(installBin, installArgs);
        let installOutput = "";

        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              installOutput += data;
              appendOutput(data);
            },
          })
        );

        const installExitCode = await installProcess.exit;

        if (installExitCode !== 0) {
          const errorMsg = `${installCmd} failed with code ${installExitCode}`;
          appendOutput(`\n❌ ${errorMsg}\n`);
          throw new Error(errorMsg);
        }


        // Parse dev command (default: npm run dev)
        let devCmd = settings?.devCommand || "npm run dev";

        // Disable Turbopack and SWC by creating a proper next.config
        appendOutput(`📝 Configuring dev environment...\n`);

        // Remove any existing config files
        try {
          await container.fs.rm("/next.config.ts", { force: true });
        } catch (e) {}

        try {
          await container.fs.rm("/next.config.mjs", { force: true });
        } catch (e) {}

        try {
          await container.fs.rm("/next.config.js", { force: true });
        } catch (e) {}

        appendOutput(`✓ Config files cleared\n`);

        // Create next.config.js with SWC disabled
        // Use CommonJS (module.exports) which is more compatible
        const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,  // Disable SWC minifier (uses native bindings not available in sandbox)
};

module.exports = nextConfig;
`;

        await container.fs.writeFile("/next.config.js", configContent);
        appendOutput(`✓ SWC disabled in config\n\n`);

        appendOutput(`\n$ ${devCmd}\n`);
        appendOutput("Starting dev server...\n\n");

        // Execute the dev command
        const [devBin, ...devArgs] = devCmd.split(" ");
        const devProcess = await container.spawn(devBin, devArgs);
        let devOutput = "";
        let hasServerStarted = false;

        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              devOutput += data;
              appendOutput(data);

              // Check for common success patterns
              if (data.includes("ready") || data.includes("compiled") || data.includes("started")) {
                hasServerStarted = true;
              }
            },
          })
        );

        // Wait for server to start or dev process to fail (with 90 second timeout)
        const devExitPromise = new Promise<void>((resolve, reject) => {
          devProcess.exit.then((code) => {
            if (code !== 0) {
              reject(new Error(`Dev server exited with code ${code}`));
            } else {
              resolve();
            }
          });
        });

        const timeoutPromise = new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            reject(new Error("Dev server startup timeout (90 seconds)"));
          }, 90000);
        });

        try {
          await Promise.race([devExitPromise, timeoutPromise]);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          appendOutput(`\n⚠️ ${msg}\n`);
          throw error;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
        setStatus("error");

        // Provide helpful error messages for common issues
        let helpText = "";
        if (errorMessage.includes("turbo") || errorMessage.includes("wasm")) {
          helpText = "\n💡 **Turbopack WASM Incompatibility Detected**\n\n" +
                     "Turbopack (Next.js 16+) uses WASM bindings that don't work in WebContainer sandboxes.\n\n" +
                     "**Quick Fix (Option 1 - Fastest):**\n" +
                     "1. Open your project's **package.json**\n" +
                     "2. Find the \"dev\" script line\n" +
                     "3. Add `--no-turbo` flag:\n" +
                     "   ```json\n" +
                     "   \"scripts\": {\n" +
                     "     \"dev\": \"next dev --no-turbo\"\n" +
                     "   }\n" +
                     "   ```\n" +
                     "4. Save and click **Restart Preview**\n\n" +
                     "**Alternative Fix (Option 2):**\n" +
                     "Open **next.config.js** and add:\n" +
                     "```javascript\n" +
                     "const nextConfig = {\n" +
                     "  experimental: {\n" +
                     "    turbo: { enabled: false }\n" +
                     "  }\n" +
                     "};\n" +
                     "```\n\n" +
                     "**Alternative Fix (Option 3):**\n" +
                     "Downgrade Next.js version (if using 16+):\n" +
                     "```bash\n" +
                     "npm install next@14\n" +
                     "```\n";
        } else if (errorMessage.includes("timeout")) {
          helpText = "\n💡 Tip: The dev server is taking too long to start.\n" +
                     "This might be due to large dependencies or slow network. Try restarting the preview.\n";
        } else if (errorMessage.includes("npm install")) {
          helpText = "\n💡 Tip: npm install failed. This could be due to:\n" +
                     "- Missing package-lock.json\n" +
                     "- Network connectivity issues\n" +
                     "- Incompatible Node version\n";
        } else if (errorMessage.includes("code 1")) {
          helpText = "\n💡 Tip: The dev server exited with exit code 1 (error).\n" +
                     "Check the terminal output above for build errors. Common causes:\n" +
                     "- TypeScript/compilation errors\n" +
                     "- Missing dependencies\n" +
                     "- Turbopack enabled (use --no-turbo flag in dev script)\n";
        }

        appendOutput(`\n❌ Error: ${errorMessage}${helpText}\n`);
      }
    };

    start();
  }, [
    enabled,
    files,
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
