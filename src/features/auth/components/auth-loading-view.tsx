import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";

export const AuthLoadingView = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#1e2030]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(101,98,244,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(101,98,244,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    >
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(101,98,244,0.12) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Image src="/logo.svg" alt="Vertex" width={40} height={40} className="opacity-80" />
        <Spinner className="size-5 text-[#6562f4]" />
      </div>
    </div>
  );
};