import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";
import { useWebContainer } from "@/features/preview/hooks/use-webcontainer";

import { CodeEditor } from "./code-editor";
import { useEditor } from "../hooks/use-editor";
import { TopNavigation } from "./top-navigation";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import { Id } from "../../../../convex/_generated/dataModel";
import { AlertTriangleIcon } from "lucide-react";

const DEBOUNCE_MS = 1500;

export const EditorView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const { activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId);
  const updateFile = useUpdateFile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [previewEnabled, setPreviewEnabled] = useState(false);

  // WebContainer preview hook
  const {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  } = useWebContainer({
    projectId,
    enabled: previewEnabled,
  });

  const isActiveFileBinary = activeFile && activeFile.storageId;
  const isActiveFileText = activeFile && !activeFile.storageId;

  // Cleanup pending debounced updates on unmount or file change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeTabId]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <TopNavigation projectId={projectId} />
        <Button
          onClick={() => setPreviewEnabled(!previewEnabled)}
          variant={previewEnabled ? "default" : "outline"}
          size="sm"
          className="mr-4"
        >
          {previewEnabled ? (
            <>
              <Eye className="size-4 mr-2" />
              Preview: ON
            </>
          ) : (
            <>
              <EyeOff className="size-4 mr-2" />
              Preview: OFF
            </>
          )}
        </Button>
      </div>
      {activeTabId && <FileBreadcrumbs projectId={projectId} />}

      <div className="flex flex-1 min-h-0 gap-4 bg-background">
        {/* Editor Section */}
        <div className="flex-1 min-w-0 flex flex-col">
          {!activeFile && (
            <div className="size-full flex items-center justify-center">
              <Image
                src="/logo-alt.svg"
                alt="Vertex"
                width={50}
                height={50}
                className="opacity-25 w-auto h-auto"
              />
            </div>
          )}
          {isActiveFileText && (
            <CodeEditor
              key={activeFile._id}
              fileName={activeFile.name}
              initialValue={activeFile.content}
              onChange={(content: string) => {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                  updateFile({ id: activeFile._id, content });
                }, DEBOUNCE_MS);
              }}
            />
          )}
          {isActiveFileBinary && (
            <div className="size-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2.5 max-w-md text-center">
                <AlertTriangleIcon className="size-10 text-yellow-500" />
                <p className="text-sm">
                  The file is not displayed in the text editor because it is either binary or uses an unsupported text encoding.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {previewEnabled && (
          <div className="w-1/2 min-h-0 flex flex-col border-l border-border">
            <div className="flex-1 flex flex-col overflow-hidden">
              {status === "idle" && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>Preview is ready. Starting...</p>
                </div>
              )}

              {status === "booting" && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Booting WebContainer...</p>
                </div>
              )}

              {status === "installing" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700">
                    <span className="text-xs text-slate-300">Installing dependencies...</span>
                    <Button
                      onClick={() => navigator.clipboard.writeText(terminalOutput)}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-slate-900 text-slate-100 font-mono text-xs select-text">
                    <pre className="whitespace-pre-wrap break-words">{terminalOutput}</pre>
                  </div>
                </div>
              )}

              {status === "running" && previewUrl && (
                <iframe
                  src={previewUrl}
                  className="flex-1 border-0 w-full"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              )}

              {status === "error" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700">
                    <span className="text-xs text-red-400">Error</span>
                    <Button
                      onClick={() => navigator.clipboard.writeText(`${terminalOutput}\n\n${error}`)}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6"
                    >
                      Copy Error
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-slate-900 text-red-400 font-mono text-xs select-text">
                    <pre className="whitespace-pre-wrap break-words">{terminalOutput}</pre>
                    <div className="mt-4 text-red-500">{error}</div>
                  </div>
                  <div className="p-4 border-t border-border">
                    <Button onClick={restart} variant="outline" size="sm">
                      Restart Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
