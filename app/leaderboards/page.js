'use client';

import { useState, useEffect, useCallback } from 'react';

const REFRESH_INTERVAL = 60; // seconds

export default function Leaderboards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/results');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      if (!data) setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="app-container">
        <div className="loading-container" style={{ marginTop: '100px' }}>
          <div className="loading-spinner" />
          <p className="loading-text">Calculating leaderboards...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="app-container">
        <div className="error-container" style={{ marginTop: '100px' }}>
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
          <button className="retry-button" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  // --- Calculations ---
  function calcLegMinutes(prevTime, currTime) {
    if (!prevTime || !currTime) return null;
    const [ph, pm] = prevTime.split(':').map(Number);
    const [ch, cm] = currTime.split(':').map(Number);
    let diff = ch * 60 + cm - (ph * 60 + pm);
    if (diff < 0) diff += 24 * 60;
    return diff;
  }

  function formatMinutes(mins) {
    if (mins == null) return '—';
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours > 0) return `${hours}h ${m}m`;
    return `${m}m`;
  }

  const routeLeaders = [];
  let fastestLeg = { minutes: Infinity, team: null, from: '', to: '' };
  let highestProgressTeam = { progress: 0, team: null };

  if (data?.routes) {
    data.routes.forEach((route) => {
      // Find Route Leader
      let leader = null;
      let leaderProgress = -1;
      let leaderTime = Infinity;

      route.teams.forEach((team) => {
        // Track overall highest progress
        if (team.progress > highestProgressTeam.progress) {
          highestProgressTeam = { progress: team.progress, team: team };
        }

        // Calculate elapsed time for this team
        const elapsed = calcLegMinutes(team.times[0], team.times[team.progress - 1]);
        
        // Find fastest leg
        for (let i = 1; i < team.progress; i++) {
          const legMins = calcLegMinutes(team.times[i - 1], team.times[i]);
          if (legMins !== null && legMins > 0 && legMins < fastestLeg.minutes) {
            fastestLeg = {
              minutes: legMins,
              team: team,
              from: route.checkpoints[i - 1],
              to: route.checkpoints[i]
            };
          }
        }

        // Evaluate for route leader
        if (team.progress > leaderProgress) {
          leader = team;
          leaderProgress = team.progress;
          leaderTime = elapsed || 0;
        } else if (team.progress === leaderProgress && elapsed !== null) {
          if (elapsed < leaderTime) {
            leader = team;
            leaderTime = elapsed;
          }
        }
      });

      if (leader) {
        routeLeaders.push({
          route: route.route,
          team: leader,
          elapsedTime: leaderTime
        });
      }
    });
  }

  return (
    <div className="app-container">
      <header className="leaderboards-header">
        <h1 className="header-title">Leaderboards</h1>
        <p className="header-subtitle">Ten Tors Challenge 2026 — Live Rankings</p>
      </header>

      <div className="feat-cards">
        <div className="feat-card">
          <div className="feat-title">Fastest Single Leg</div>
          {fastestLeg.team ? (
            <>
              <div className="feat-value">{formatMinutes(fastestLeg.minutes)}</div>
              <div className="feat-sub">{fastestLeg.team.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {fastestLeg.from} → {fastestLeg.to}
              </div>
            </>
          ) : (
            <div className="feat-value">—</div>
          )}
        </div>

        <div className="feat-card">
          <div className="feat-title">Most Checkpoints Reached</div>
          {highestProgressTeam.team ? (
            <>
              <div className="feat-value">{highestProgressTeam.progress}</div>
              <div className="feat-sub">{highestProgressTeam.team.name}</div>
            </>
          ) : (
            <div className="feat-value">—</div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Route Leaders</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Currently leading teams on each of the 26 routes.
      </p>

      <div className="leaderboard-grid">
        {routeLeaders.map((leader) => (
          <div key={leader.route} className="leader-card">
            <div className="leader-card-header">
              <div>
                <div className="leader-team">{leader.team.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Code: {leader.team.code}
                </div>
              </div>
              <div className="leader-route">{leader.route}</div>
            </div>

            <div className="leader-stats">
              <div className="leader-stat">
                <span className="leader-stat-val">{leader.team.progress}/{leader.team.totalCheckpoints}</span>
                <span className="leader-stat-lbl">Checkpoints</span>
              </div>
              <div className="leader-stat">
                <span className="leader-stat-val">{formatMinutes(leader.elapsedTime)}</span>
                <span className="leader-stat-lbl">Elapsed Time</span>
              </div>
              <div className="leader-stat" style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                <span className={`team-status-badge ${leader.team.status.toLowerCase().replace('_', '-')}`} style={{ margin: 0 }}>
                  {leader.team.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
