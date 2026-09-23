import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";

import { 
  buildFileTree,
  getFilePath
} from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";

import { Id } from "../../../../convex/_generated/dataModel";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  if (webcontainerInstance) return webcontainerInstance;
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

// next.config.js that disables SWC (native binary) and Turbopack (WASM)
// Both are incompatible with WebContainer's sandboxed environment
const WEBCONTAINER_NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    swcMinify: false,
  },
  webpack: (config) => {
    return config;
  },
};
module.exports = nextConfig;
`;

// .npmrc to skip native binary downloads entirely
const NPMRC_CONTENT = `ignore-scripts=false
prefer-offline=false
`;

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
  const isRunningRef = useRef(false);

  const files = useFiles(projectId);

  useEffect(() => {
    if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    isRunningRef.current = false;

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

        appendOutput(`📦 Mounting ${files.length} files...\n`);
        const fileTree = buildFileTree(files);
        await container.mount(fileTree);

        // Listen for server-ready — this is the only reliable success signal
        container.on("server-ready", (_port, url) => {
          appendOutput(`\n✅ Server ready at ${url}\n`);
          isRunningRef.current = true;
          setPreviewUrl(url);
          setStatus("running");
        });

        // --- Patch environment before install ---

        // 1. Write .npmrc to skip postinstall scripts that try to download native binaries
        await container.fs.writeFile("/.npmrc", NPMRC_CONTENT);

        // 2. Remove all existing next.config variants and write a sandbox-safe one
        //    This disables SWC (native .node addon) and Turbopack (WASM)
        appendOutput(`\n📝 Writing sandbox-safe next.config.js...\n`);
        try { await container.fs.rm("/next.config.ts", { force: true }); } catch {}
        try { await container.fs.rm("/next.config.mjs", { force: true }); } catch {}
        try { await container.fs.rm("/next.config.js", { force: true }); } catch {}
        await container.fs.writeFile("/next.config.js", WEBCONTAINER_NEXT_CONFIG);

        // 3. Patch package.json — remove turbo flags, ensure dev script uses next directly
        appendOutput(`📝 Patching package.json...\n`);
        try {
          const pkgRaw = await container.fs.readFile("/package.json", "utf-8");
          const pkg = JSON.parse(pkgRaw);

          if (pkg.scripts?.dev) {
            const original = pkg.scripts.dev;
            pkg.scripts.dev = original
              .replace(/--turbo\b/g, "")
              .replace(/--turbopack\b/g, "")
              .replace(/\s+/g, " ")
              .trim();

            if (pkg.scripts.dev !== original) {
              appendOutput(`  Removed turbo flags: "${original}" → "${pkg.scripts.dev}"\n`);
            }
          }

          // Remove @next/swc packages — they're native binaries that can't run in sandbox
          if (pkg.optionalDependencies) {
            const swcKeys = Object.keys(pkg.optionalDependencies).filter(k =>
              k.startsWith("@next/swc") || k.startsWith("@swc/")
            );
            swcKeys.forEach(k => {
              delete pkg.optionalDependencies[k];
              appendOutput(`  Removed native dep: ${k}\n`);
            });
          }

          await container.fs.writeFile("/package.json", JSON.stringify(pkg, null, 2));
        } catch (e) {
          appendOutput(`⚠ Could not patch package.json: ${e}\n`);
        }

        appendOutput(`\n`);

        // --- Install ---
        setStatus("installing");
        const installCmd = settings?.installCommand || "npm install --ignore-scripts";
        appendOutput(`$ ${installCmd}\n`);

        const [installBin, ...installArgs] = installCmd.split(" ");
        const installProcess = await container.spawn(installBin, installArgs);

        installProcess.output.pipeTo(
          new WritableStream({ write(data) { appendOutput(data); } })
        );

        const installCode = await installProcess.exit;
        if (installCode !== 0) {
          throw new Error(`${installCmd} failed with exit code ${installCode}`);
        }

        // --- Start dev server ---
        const devCmd = settings?.devCommand || "npm run dev";
        appendOutput(`\n$ ${devCmd}\n`);
        appendOutput(`Starting dev server (this may take 30-60s)...\n\n`);

        const [devBin, ...devArgs] = devCmd.split(" ");
        const devProcess = await container.spawn(devBin, devArgs);

        devProcess.output.pipeTo(
          new WritableStream({ write(data) { appendOutput(data); } })
        );

        // Only treat exit as error if we never reached "running"
        devProcess.exit.then((code) => {
          if (!isRunningRef.current && code !== 0) {
            const msg = `Dev server exited with code ${code}`;
            appendOutput(`\n❌ ${msg}\n`);
            appendOutput(`\n💡 Check the terminal output above for the actual error.\n`);
            appendOutput(`Common fixes:\n`);
            appendOutput(`  • Use Preview Settings to set Start Command: npx next dev\n`);
            appendOutput(`  • Make sure package.json has a "dev" script\n`);
            setError(msg);
            setStatus("error");
          }
        });

        // 120s safety net
        setTimeout(() => {
          if (!isRunningRef.current) {
            const msg = "Server did not start within 120 seconds";
            appendOutput(`\n⏱ ${msg}\n`);
            setError(msg);
            setStatus("error");
          }
        }, 120000);

      } catch (err) {
        if (isRunningRef.current) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        appendOutput(`\n❌ ${msg}\n`);
        setError(msg);
        setStatus("error");
      }
    };

    start();
  }, [enabled, files, restartKey, settings?.devCommand, settings?.installCommand]);

  // Hot-reload: sync file changes into running container
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

  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      isRunningRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
    }
  }, [enabled]);

  const restart = useCallback(() => {
    teardownWebContainer();
    containerRef.current = null;
    hasStartedRef.current = false;
    isRunningRef.current = false;
    setStatus("idle");
    setPreviewUrl(null);
    setError(null);
    setTerminalOutput("");
    setRestartKey((k) => k + 1);
  }, []);

  return { status, previewUrl, error, restart, terminalOutput };
};