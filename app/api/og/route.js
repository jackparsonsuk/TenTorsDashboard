import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Extract params
  const team = searchParams.get('team') || 'Unknown Team';
  const code = searchParams.get('code') || '???';
  const route = searchParams.get('route') || 'A';
  const progress = parseInt(searchParams.get('progress') || '0', 10);
  const total = parseInt(searchParams.get('total') || '10', 10);
  const statusRaw = searchParams.get('status') || 'IN_PROGRESS';
  const currentCp = searchParams.get('current') || '';
  const nextCp = searchParams.get('next') || '';
  const lastLeg = searchParams.get('lastLeg') || '';

  // Format Status
  const statusLabel = {
    IN_PROGRESS: 'En Route',
    CAMPED: 'Camped',
    FINISHED: 'Finished',
    RETIRED: 'Retired',
  }[statusRaw] || statusRaw;

  const pct = Math.min(100, Math.max(0, (progress / total) * 100));

  let statusColor = '#3b82f6'; // Blue
  if (statusRaw === 'CAMPED') statusColor = '#f59e0b'; // Amber
  if (statusRaw === 'FINISHED') statusColor = '#22c55e'; // Green
  if (statusRaw === 'RETIRED') statusColor = '#ef4444'; // Red

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070b14',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          padding: '60px',
          fontFamily: 'sans-serif',
          color: '#f1f5f9',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.85)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '60px', position: 'relative' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '800px' }}>
              <span style={{ fontSize: '24px', color: '#94a3b8', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Ten Tors Challenge 2026
              </span>
              <span style={{ fontSize: '64px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {team}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '24px', width: '120px', height: '120px', color: 'white', fontSize: '64px', fontWeight: 800 }}>
              {route}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px', gap: '24px' }}>
            <div style={{ display: 'flex', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '12px 24px', borderRadius: '16px', fontSize: '28px', fontWeight: 700 }}>
              Code: {code}
            </div>
            <div style={{ display: 'flex', background: `${statusColor}22`, color: statusColor, padding: '12px 24px', borderRadius: '40px', fontSize: '28px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {statusLabel}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '48%', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Latest Checkpoint</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentCp}</span>
                {lastLeg && <span style={{ color: '#cbd5e1', fontSize: '20px', marginTop: '12px' }}>⏱️ {lastLeg} from previous</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '48%', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Next Checkpoint</span>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextCp}</span>
                {statusRaw === 'FINISHED' && <span style={{ color: '#22c55e', fontSize: '20px', marginTop: '12px' }}>🏆 Challenge Complete</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '32px', fontWeight: 600 }}>
              <span>Progress</span>
              <span style={{ color: '#94a3b8' }}>{progress} / {total} Checkpoints</span>
            </div>
            
            <div style={{ display: 'flex', width: '100%', height: '24px', background: 'rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', width: `${pct}%`, height: '100%', background: statusColor, borderRadius: '20px' }}></div>
            </div>
          </div>

        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
