"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { CopyIcon, CheckIcon } from "lucide-react";

import "@xterm/xterm/css/xterm.css";

interface PreviewTerminalProps {
  output: string;
}

export const PreviewTerminal = ({ output }: PreviewTerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastLengthRef = useRef(0);
  const [copied, setCopied] = useState(false);

  // Initialize terminal
  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    const terminal = new Terminal({
      convertEol: true,
      // Allow text selection so user can select + copy manually
      disableStdin: true,
      cursorBlink: false,
      fontSize: 12,
      fontFamily: "monospace",
      theme: { background: "#1f2228" },
      // Enable selection
      rightClickSelectsWord: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    if (output) {
      terminal.write(output);
      lastLengthRef.current = output.length;
    }

    requestAnimationFrame(() => fitAddon.fit());

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write new output incrementally
  useEffect(() => {
    if (!terminalRef.current) return;

    if (output.length < lastLengthRef.current) {
      terminalRef.current.clear();
      lastLengthRef.current = 0;
    }

    const newData = output.slice(lastLengthRef.current);
    if (newData) {
      terminalRef.current.write(newData);
      lastLengthRef.current = output.length;
    }
  }, [output]);

  const handleCopy = async () => {
    // Strip ANSI escape codes for clean plain text
    const clean = output.replace(
      // eslint-disable-next-line no-control-regex
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]/g,
      ""
    );

    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select all text in a textarea
      const ta = document.createElement("textarea");
      ta.value = clean;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        title="Copy terminal output"
        className="absolute top-1 right-1 z-10 flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
      >
        {copied ? (
          <>
            <CheckIcon className="size-3" />
            Copied
          </>
        ) : (
          <>
            <CopyIcon className="size-3" />
            Copy
          </>
        )}
      </button>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 p-3 [&_.xterm]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm-screen]:h-full! bg-sidebar"
      />
    </div>
  );
};