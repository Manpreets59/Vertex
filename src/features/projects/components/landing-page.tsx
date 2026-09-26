"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import {
  SparklesIcon, GitBranchIcon, EyeIcon, ZapIcon,
  CodeIcon, ArrowRightIcon, CloudIcon, RocketIcon, StarIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

// ── Design tokens ────────────────────────────────────────────────────────────
// Direction: Dark charcoal + warm orange — Linear elegance, Raycast simplicity,
// Warp gradients, Vercel spacing. No blue, no cyberpunk neon.
const BG = "#09090B";
const CARD = "#14141B";
const BORDER = "#252530";
const ORANGE = "#FF7849";
const ORANGE_2 = "#FF9F43";
const TEXT = "#FAFAFA";
const MUTED = "#A1A1AA";
const SUCCESS = "#22C55E";
const EASE = "cubic-bezier(0.16,1,0.3,1)";

// ── Cursor-follow glow ───────────────────────────────────────────────────────
const CursorGlow = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.left = `${e.clientX}px`;
        ref.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div ref={ref}
      className="fixed pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-all duration-500 ease-out"
      style={{ background: `radial-gradient(circle, rgba(255,120,73,0.06) 0%, transparent 70%)` }}
    />
  );
};

const AmbientBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ background: BG }}>
    {/* Subtle grid */}
    <div className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(rgba(255,120,73,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,120,73,0.025) 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
      }}
    />
    {/* Top amber glow */}
    <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
      style={{ background: `radial-gradient(ellipse, rgba(255,120,73,0.12) 0%, transparent 60%)` }}
    />
    {/* Bottom blurred circle */}
    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full"
      style={{ background: `radial-gradient(circle, rgba(255,159,67,0.06) 0%, transparent 65%)`, animation: "float 10s ease-in-out infinite alternate" }}
    />
    <style>{`
      @keyframes float { from { transform: translateY(0); } to { transform: translateY(-30px); } }
      @keyframes floatCard { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      html { scroll-behavior: smooth; }
    `}</style>
  </div>
);

// ── Typing animation ─────────────────────────────────────────────────────────
const PHRASES = [
  "Refactor authentication into middleware",
  "Build a dashboard with React + Tailwind",
  "Scaffold a REST API with Express",
  "Write tests for my auth module",
  "Set up a Prisma schema for e-commerce",
];

const TypingText = () => {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const phrase = PHRASES[idx];
    if (paused) { const t = setTimeout(() => { setPaused(false); setDel(true); }, 2200); return () => clearTimeout(t); }
    if (!del && text.length < phrase.length) { const t = setTimeout(() => setText(phrase.slice(0, text.length + 1)), 38); return () => clearTimeout(t); }
    if (!del && text.length === phrase.length) { setPaused(true); return; }
    if (del && text.length > 0) { const t = setTimeout(() => setText(text.slice(0, -1)), 18); return () => clearTimeout(t); }
    if (del && text.length === 0) { setDel(false); setIdx(i => (i + 1) % PHRASES.length); }
  }, [text, del, paused, idx]);

  return <span style={{ color: ORANGE, fontFamily: "'JetBrains Mono', monospace" }}>{text}<span className="animate-pulse opacity-70">|</span></span>;
};

// ── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: SparklesIcon, title: "AI Code Editing", desc: "Write, refactor, and debug instantly. The agent reads your files and makes targeted changes." },
  { icon: GitBranchIcon, title: "GitHub Import", desc: "Import any repository in seconds. Export your work as a new repo with one click." },
  { icon: EyeIcon, title: "Browser Preview", desc: "Your project runs live in a sandbox — no local setup, no deploy step, instant feedback." },
  { icon: CloudIcon, title: "Cloud Workspace", desc: "Every file syncs in real time. Pick up exactly where you left off, on any device." },
  { icon: ZapIcon, title: "AI Autocomplete", desc: "Ghost-text suggestions as you type, aware of your open files and project context." },
  { icon: CodeIcon, title: "Quick Edit ⌘K", desc: "Select code, describe the change in plain English. AI rewrites the selection in place." },
];

const STEPS = [
  { label: "GitHub Repo", desc: "Import or start blank" },
  { label: "AI understands code", desc: "Reads your full project" },
  { label: "Edit together", desc: "Chat, refactor, build" },
  { label: "Preview instantly", desc: "Live in the browser" },
  { label: "Deploy", desc: "Export to GitHub" },
];

const TRUST = [
  { icon: GitBranchIcon, label: "Open Source" },
  { icon: ZapIcon, label: "Fast Setup" },
  { icon: SparklesIcon, label: "AI Powered" },
  { icon: FaGithub, label: "GitHub Integration" },
];

// ── Glass panel ──────────────────────────────────────────────────────────────
const GlassPanel = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`rounded-xl border ${className}`}
    style={{ background: "rgba(20,20,27,0.7)", borderColor: BORDER, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", ...style }}
  >
    {children}
  </div>
);

// ── Primary button ───────────────────────────────────────────────────────────
const PrimaryBtn = ({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref}
      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
      style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_2} 100%)`, color: "#1a0e08", transition: `transform 0.3s ${EASE}, box-shadow 0.3s ${EASE}` }}
      onMouseEnter={() => { if (ref.current) { ref.current.style.transform = "scale(1.03) translateY(-2px)"; ref.current.style.boxShadow = `0 12px 32px rgba(255,120,73,0.4)`; } }}
      onMouseLeave={() => { if (ref.current) { ref.current.style.transform = ""; ref.current.style.boxShadow = ""; } }}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

const SecondaryBtn = ({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref}
      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm border"
      style={{ borderColor: BORDER, color: TEXT, transition: `all 0.3s ${EASE}` }}
      onMouseEnter={() => { if (ref.current) { ref.current.style.borderColor = "#3f3f4a"; ref.current.style.background = "rgba(255,255,255,0.03)"; } }}
      onMouseLeave={() => { if (ref.current) { ref.current.style.borderColor = BORDER; ref.current.style.background = "transparent"; } }}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
};

export const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: BG, color: TEXT, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .sg { font-family: 'Space Grotesk', sans-serif; }
        .jb { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <CursorGlow />
      <AmbientBackground />

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-16 py-4"
        style={{ borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(20px)", background: "rgba(9,9,11,0.7)" }}
      >
        <a href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="Vertex" width={26} height={26} className="transition-transform duration-300 hover:rotate-12" />
          <span className="sg text-base font-semibold tracking-tight">Vertex</span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: MUTED }}>
          {["features", "how-it-works"].map(id => (
            <a key={id} href={`#${id}`} className="hover:text-white transition-colors capitalize" style={{ transition: `color 0.3s ${EASE}` }}>{id.replace("-", " ")}</a>
          ))}
          <a href="https://github.com/Manpreets59/Vertex" target="_blank" rel="noopener" className="hover:text-white transition-colors flex items-center gap-1.5">
            <FaGithub className="size-3.5" /> GitHub
          </a>
        </div>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="text-sm px-4 py-1.5 transition-colors" style={{ color: MUTED }}
              onMouseEnter={e => (e.currentTarget.style.color = TEXT)} onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/"><PrimaryBtn>Start Building Free</PrimaryBtn></SignUpButton>
        </div>
      </nav>

      {/* ── HERO (full-bleed, not boxed) ──────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-16 pt-24 pb-20 md:pt-32">
        <div className="max-w-6xl mx-auto text-center">
          <div className="jb inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full mb-8"
            style={{ color: ORANGE_2, border: `1px solid rgba(255,120,73,0.25)`, background: "rgba(255,120,73,0.06)" }}
          >
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: ORANGE }} />
            ✦ AI-powered cloud IDE
          </div>

          <h1 className="sg font-extrabold tracking-tight leading-[1.02] mb-7" style={{ fontSize: "clamp(2.75rem, 7vw, 5.5rem)" }}>
            Build software with AI.
            <br />
            <span style={{ color: MUTED, fontWeight: 600 }}>Not just code.</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto leading-relaxed mb-3" style={{ color: MUTED, fontWeight: 300 }}>
            Import GitHub repositories. Chat with your project.
            Edit instantly. Preview live.
          </p>

          <div className="flex items-center justify-center gap-3 mt-10 mb-6">
            <SignUpButton mode="modal" forceRedirectUrl="/"><PrimaryBtn>Start Building Free <ArrowRightIcon className="size-4" /></PrimaryBtn></SignUpButton>
            <a href="https://github.com/Manpreets59/Vertex" target="_blank" rel="noopener">
              <SecondaryBtn><FaGithub className="size-4" /> View on GitHub</SecondaryBtn>
            </a>
          </div>

          {/* Stars / trust */}
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: MUTED }}>
            <span>Trusted by developers</span>
            <span className="flex" style={{ color: ORANGE_2 }}>
              {Array.from({ length: 4 }).map((_, i) => <StarIcon key={i} className="size-3.5 fill-current" />)}
              <StarIcon className="size-3.5" style={{ color: BORDER }} />
            </span>
          </div>
        </div>

        {/* ── LARGE IDE SCREENSHOT WITH FLOATING GLASS PANELS ─────────────── */}
        <div className="relative max-w-6xl mx-auto mt-20">
          {/* Floating AI panel — top left */}
          <GlassPanel className="hidden lg:block absolute -left-6 top-8 z-20 p-4 w-64"
            style={{ animation: "floatCard 6s ease-in-out infinite", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="size-3.5" style={{ color: ORANGE }} />
              <span className="jb text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>AI Assistant</span>
            </div>
            <p className="text-xs" style={{ color: TEXT }}>&ldquo;Refactor authentication into middleware&rdquo;</p>
          </GlassPanel>

          {/* Floating preview panel — bottom right */}
          <GlassPanel className="hidden lg:block absolute -right-6 bottom-8 z-20 p-4 w-60"
            style={{ animation: "floatCard 6s ease-in-out infinite 1.5s", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="size-1.5 rounded-full" style={{ background: SUCCESS }} />
              <span className="jb text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>Live Preview</span>
            </div>
            <p className="jb text-xs" style={{ color: SUCCESS }}>localhost:3000</p>
          </GlassPanel>

          {/* Main IDE screenshot mockup — occupies nearly half viewport height */}
          <GlassPanel className="overflow-hidden relative z-10" style={{ boxShadow: `0 0 120px rgba(255,120,73,0.1)` }}>
            <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: "rgba(0,0,0,0.4)", borderBottom: `1px solid ${BORDER}` }}>
              <span className="size-3 rounded-full bg-[#FF5F57]" />
              <span className="size-3 rounded-full bg-[#FEBC2E]" />
              <span className="size-3 rounded-full bg-[#28C840]" />
              <span className="jb ml-4 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>vertex — my-portfolio</span>
              <div className="ml-auto flex gap-1">
                {["Code", "Preview"].map((t, i) => (
                  <span key={t} className="jb text-xs px-3 py-1 rounded"
                    style={{ background: i === 0 ? "rgba(255,120,73,0.15)" : "transparent", color: i === 0 ? ORANGE_2 : MUTED, border: i === 0 ? `1px solid rgba(255,120,73,0.25)` : "none" }}
                  >{t}</span>
                ))}
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "190px 1fr 280px", height: "min(48vh, 420px)" }}>
              {/* Explorer */}
              <div style={{ background: "rgba(0,0,0,0.25)", borderRight: `1px solid ${BORDER}` }} className="p-3 overflow-hidden">
                <p className="jb text-[10px] uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>Explorer</p>
                {[
                  { name: "src/", depth: 0, folder: true },
                  { name: "app/", depth: 1, folder: true },
                  { name: "page.tsx", depth: 2, active: true },
                  { name: "layout.tsx", depth: 2 },
                  { name: "middleware/", depth: 1, folder: true },
                  { name: "auth.ts", depth: 2 },
                  { name: "package.json", depth: 0 },
                ].map((f: any, i) => (
                  <div key={i} className="flex items-center gap-1 py-0.5 px-1 rounded text-xs jb"
                    style={{
                      paddingLeft: `${8 + f.depth * 12}px`,
                      background: f.active ? "rgba(255,120,73,0.15)" : "transparent",
                      color: f.active ? ORANGE_2 : f.folder ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.3)",
                      borderLeft: f.active ? `2px solid ${ORANGE}` : "2px solid transparent",
                    }}
                  >{f.folder ? "📁 " : "📄 "}{f.name}</div>
                ))}
              </div>

              {/* Editor */}
              <div style={{ background: "#0D0D10" }} className="p-5 overflow-hidden">
                <div className="jb text-[10px] mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>middleware/auth.ts</div>
                <div className="jb text-xs leading-7 select-none">
                  {[
                    <span key="1"><span style={{color:"#FF9F43"}}>export</span> <span style={{color:"#FF7849"}}>async function</span> <span style={{color:"#FFD699"}}>middleware</span><span style={{color:"rgba(255,255,255,0.5)"}}>(req: Request) &#123;</span></span>,
                    <span key="2" style={{paddingLeft:"16px"}}><span style={{color:"#FF9F43"}}>const</span> <span style={{color:"#FFD699"}}>session</span> <span style={{color:"rgba(255,255,255,0.5)"}}>=</span> <span style={{color:"#FF9F43"}}>await</span> <span style={{color:"#FFD699"}}>getSession</span><span style={{color:"rgba(255,255,255,0.5)"}}>(req)</span></span>,
                    <span key="3" style={{paddingLeft:"16px"}}><span style={{color:"#FF9F43"}}>if</span> <span style={{color:"rgba(255,255,255,0.5)"}}>(!session)</span> <span style={{color:"#FFD699"}}>redirect</span><span style={{color:"rgba(255,255,255,0.5)"}}>('/sign-in')</span></span>,
                    <span key="4" style={{paddingLeft:"16px"}}><span style={{color:"#FF9F43"}}>return</span> <span style={{color:"#FFD699"}}>NextResponse</span><span style={{color:"rgba(255,255,255,0.5)"}}>.next()</span></span>,
                    <span key="5" style={{color:"rgba(255,255,255,0.5)"}}>&#125;</span>,
                  ].map((line, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="w-5 shrink-0 text-right" style={{ color: "rgba(255,255,255,0.15)" }}>{i + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                  <div className="flex gap-4 mt-1">
                    <span className="w-5 shrink-0 text-right" style={{ color: "rgba(255,255,255,0.15)" }}>6</span>
                    <span style={{ color: "rgba(255,120,73,0.45)", fontStyle: "italic" }}>{"// ✦ AI: extracted auth logic into reusable middleware"}</span>
                  </div>
                </div>
              </div>

              {/* AI chat */}
              <div style={{ background: "rgba(0,0,0,0.3)", borderLeft: `1px solid ${BORDER}` }} className="flex flex-col">
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="size-1.5 rounded-full animate-pulse" style={{ background: SUCCESS }} />
                  <span className="jb text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>AI Chat</span>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                  <div className="rounded-lg p-3 text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>
                    Refactor authentication into middleware
                  </div>
                  <div className="rounded-lg p-3 text-xs" style={{ background: "rgba(255,120,73,0.1)", border: `1px solid rgba(255,120,73,0.2)`, color: "#FFD8C2" }}>
                    Done — extracted the session check into <span style={{ color: ORANGE_2, fontWeight: 600 }}>middleware/auth.ts</span> and wired it into your route config.
                  </div>
                </div>
                <div className="p-3">
                  <div className="rounded-lg px-3 py-2 text-xs jb" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.2)" }}>
                    <TypingText />
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* ── TRUST STRIP ────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {TRUST.map((t) => (
            <span key={t.label} className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
              <t.icon className="size-4" style={{ color: ORANGE }} />{t.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 md:px-16 py-28 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="jb text-xs font-medium uppercase tracking-widest mb-4" style={{ color: ORANGE }}>Features</p>
          <h2 className="sg text-3xl md:text-5xl font-bold tracking-tight">Everything you need to ship</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-xl border p-6 cursor-default"
              style={{ background: CARD, borderColor: BORDER, transition: `transform 0.4s ${EASE}, border-color 0.3s ease` }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(255,120,73,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = BORDER; }}
            >
              <div className="size-10 rounded-lg flex items-center justify-center mb-5" style={{ background: "rgba(255,120,73,0.1)", border: `1px solid rgba(255,120,73,0.2)` }}>
                <f.icon className="size-5" style={{ color: ORANGE }} />
              </div>
              <h3 className="sg font-semibold mb-2 flex items-center justify-between">
                {f.title}
                <ArrowRightIcon className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: ORANGE }} />
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS — horizontal timeline ─────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-16 py-28 max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="jb text-xs font-medium uppercase tracking-widest mb-4" style={{ color: ORANGE }}>How it works</p>
          <h2 className="sg text-3xl md:text-5xl font-bold tracking-tight">From repo to running app</h2>
        </div>
        <div className="relative flex flex-col md:flex-row items-stretch md:items-start justify-between gap-8 md:gap-2">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-5 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${BORDER} 10%, ${BORDER} 90%, transparent)` }} />
          {STEPS.map((s, i) => (
            <div key={s.label} className="relative flex md:flex-col items-center md:items-center gap-4 md:gap-3 flex-1 text-center">
              <span className="jb size-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 z-10"
                style={{ background: BG, border: `2px solid ${ORANGE}`, color: ORANGE_2 }}
              >{i + 1}</span>
              <div className="text-left md:text-center">
                <p className="sg font-semibold text-sm">{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-28">
        <div className="max-w-2xl mx-auto text-center p-14 rounded-2xl relative overflow-hidden"
          style={{ background: CARD, border: `1px solid rgba(255,120,73,0.2)` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(255,120,73,0.15) 0%, transparent 60%)` }}
          />
          <RocketIcon className="size-10 mx-auto mb-6 relative z-10" style={{ color: ORANGE }} />
          <h2 className="sg text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to build?</h2>
          <p className="mb-8 relative z-10" style={{ color: MUTED, fontWeight: 300 }}>Import a repo or start from scratch. Your AI coding agent is waiting.</p>
          <div className="relative z-10"><SignUpButton mode="modal" forceRedirectUrl="/"><PrimaryBtn>Start Building Free <ArrowRightIcon className="size-4" /></PrimaryBtn></SignUpButton></div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 md:px-16 py-10" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Vertex" width={20} height={20} />
            <span className="sg text-sm font-medium">Vertex</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: MUTED }}>
            <span className="hover:text-white transition-colors cursor-pointer">Product</span>
            <span className="hover:text-white transition-colors cursor-pointer">Pricing</span>
            <span className="hover:text-white transition-colors cursor-pointer">Docs</span>
            <a href="https://github.com/Manpreets59/Vertex" target="_blank" rel="noopener" className="hover:text-white transition-colors">GitHub</a>
            <span className="hover:text-white transition-colors cursor-pointer">Discord</span>
            <a href="https://x.com/manpreets95828" target="_blank" rel="noopener" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
};