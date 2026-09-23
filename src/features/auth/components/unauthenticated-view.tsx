import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import { Poppins, IBM_Plex_Mono } from "next/font/google";
import { ArrowRightIcon, GitBranchIcon, SparklesIcon, EyeIcon } from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
});

const HIGHLIGHTS = [
  { icon: SparklesIcon, text: "AI agent that reads and edits your files" },
  { icon: GitBranchIcon, text: "Import & export GitHub repositories" },
  { icon: EyeIcon, text: "Live preview in the browser" },
];

export const UnauthenticatedView = () => {
  return (
    <div
      className={`min-h-screen bg-[#1e2030] text-white flex flex-col items-center justify-center px-4 ${poppins.className}`}
      style={{
        backgroundImage: `
          linear-gradient(rgba(101,98,244,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(101,98,244,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    >
      {/* Glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(101,98,244,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-2xl bg-[#6562f4]/10 border border-[#6562f4]/20 flex items-center justify-center mb-4"
            style={{ boxShadow: "0 0 32px rgba(101,98,244,0.2)" }}
          >
            <Image src="/logo.svg" alt="Vertex" width={32} height={32} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome to Vertex</h1>
          <p className="text-sm text-white/40 mt-1">Your AI-powered cloud IDE</p>
        </div>

        {/* Card */}
        <div className="bg-[#161826] border border-white/8 rounded-2xl p-6 shadow-2xl">
          {/* Highlights */}
          <div className="space-y-3 mb-6">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-center gap-3">
                <div className="size-7 rounded-lg bg-[#6562f4]/10 border border-[#6562f4]/15 flex items-center justify-center shrink-0">
                  <h.icon className="size-3.5 text-[#6562f4]" />
                </div>
                <span className="text-sm text-white/55">{h.text}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/6 mb-6" />

          {/* Auth buttons */}
          <div className="space-y-3">
            <SignUpButton mode="modal">
              <button className="w-full flex items-center justify-center gap-2 bg-[#6562f4] hover:bg-[#5450e0] text-white py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-[0_0_20px_rgba(101,98,244,0.4)]">
                Create free account
                <ArrowRightIcon className="size-3.5" />
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 text-white/70 hover:text-white py-2.5 rounded-lg font-medium text-sm transition-all">
                Sign in to your account
              </button>
            </SignInButton>
          </div>

          <p className={`text-center text-xs text-white/20 mt-5 ${mono.className}`}>
            No credit card required
          </p>
        </div>
      </div>
    </div>
  );
};