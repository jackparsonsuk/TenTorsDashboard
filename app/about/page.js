'use client';

import KoFiButton from '../components/KoFiButton';

export default function About() {
  return (
    <div className="app-container">
      <header className="header" style={{ paddingBottom: '40px' }}>
        <h1 className="header-title">About</h1>
        <p className="header-subtitle">Ten Tors Challenge Dashboard</p>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', lineHeight: '1.7' }}>
        <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
          Welcome to the unofficial live tracking dashboard for the Ten Tors Challenge 2026. 
          This tool was built to help parents, team managers, and enthusiasts easily track 
          teams across Dartmoor in real-time.
        </p>
        
        <p style={{ marginBottom: '32px', color: 'var(--text-secondary)' }}>
          By compiling the latest data into a high-performance, mobile-friendly layout with predictive pace analysis 
          and live leaderboard stats, we hope to make the tracking experience smoother and more insightful for everyone supporting 
          the incredible young people out on the moor.
        </p>

        <div style={{ padding: '32px 24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>Support the Project</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
            If you found this dashboard helpful during the event, consider buying me a coffee! 
            Your support helps cover server costs and fuels future development.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
             <KoFiButton />
          </div>
        </div>
      </div>
    </div>
  );
}
