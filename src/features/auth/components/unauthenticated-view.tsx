import { SignInButton } from "@clerk/nextjs";

export const UnauthenticatedView = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1a1a2e' }}>
      <div style={{ width: '100%', maxWidth: '500px', padding: '30px', backgroundColor: '#16213e', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px', color: '#0f3460', fontSize: '48px' }}>
          🔒
        </div>
        <h1 style={{ color: '#e94560', fontSize: '24px', marginBottom: '10px', fontWeight: 'bold' }}>
          Unauthorized Access
        </h1>
        <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '30px' }}>
          You are not authorized to access this resource. Please sign in to continue.
        </p>
        <SignInButton>
          <button style={{
            backgroundColor: '#0f3460',
            color: '#e94560',
            border: '2px solid #e94560',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Sign In
          </button>
        </SignInButton>
      </div>
    </div>
  );
};
