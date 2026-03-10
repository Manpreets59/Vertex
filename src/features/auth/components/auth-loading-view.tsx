import { Spinner } from "@/components/ui/spinner";

export const AuthLoadingView = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1a1a2e' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner className="size-6 text-ring" />
        <p style={{ color: '#ccc', marginTop: '16px', fontSize: '14px' }}>Loading...</p>
      </div>
    </div>
  );
};
