'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_INTERVAL = 60; // seconds
const ROUTE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const countdownRef = useRef(REFRESH_INTERVAL);

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

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchData();

    const dataInterval = setInterval(() => {
      fetchData();
      countdownRef.current = REFRESH_INTERVAL;
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);

    const countdownInterval = setInterval(() => {
      countdownRef.current = Math.max(0, countdownRef.current - 1);
      setCountdown(countdownRef.current);
    }, 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(countdownInterval);
    };
  }, [fetchData]);

  // Filter logic
  const getFilteredRoutes = () => {
    if (!data || !data.routes) return [];

    let routes = data.routes;

    // Filter by route
    if (selectedRoute !== 'ALL') {
      routes = routes.filter((r) => r.route === selectedRoute);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      routes = routes
        .map((route) => ({
          ...route,
          teams: route.teams.filter(
            (team) =>
              team.name.toLowerCase().includes(q) ||
              team.code.toLowerCase().includes(q)
          ),
        }))
        .filter((route) => route.teams.length > 0);
    }

    return routes;
  };

  const filteredRoutes = getFilteredRoutes();
  const totalFilteredTeams = filteredRoutes.reduce(
    (sum, r) => sum + r.teams.length,
    0
  );

  // Loading state
  if (loading && !data) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading live timing data...</p>
          <p className="loading-text" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Fetching data from 26 routes
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="app-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
          <button className="retry-button" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <div className="header-top">
          <h1 className="header-title">Ten Tors</h1>
        </div>
        <p className="header-subtitle">Ten Tors Challenge 2026 — Live Timings</p>

        <div className="header-meta">
          <span className="live-badge">
            <span className="live-dot" />
            Live
          </span>
          <span className="meta-item">
            <span className="meta-icon">🕐</span>
            Updated {data?.routes?.[0]?.lastUpdated || '—'}
          </span>
          <span className="refresh-countdown">
            ↻ {countdown}s
          </span>
        </div>

        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{data?.routeCount || 0}</span>
            <span className="stat-label">Routes</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{data?.teamCount || 0}</span>
            <span className="stat-label">Teams</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {data?.routes?.reduce(
                (sum, r) =>
                  sum + r.teams.filter((t) => t.status === 'FINISHED').length,
                0
              ) || 0}
            </span>
            <span className="stat-label">Finished</span>
          </div>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="team-search"
            className="search-input"
            type="text"
            placeholder="Search teams… e.g. Uffculme"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="route-chips">
          <button
            className={`route-chip ${selectedRoute === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedRoute('ALL')}
          >
            All
          </button>
          {ROUTE_LETTERS.map((letter) => (
            <button
              key={letter}
              className={`route-chip ${selectedRoute === letter ? 'active' : ''}`}
              onClick={() =>
                setSelectedRoute(selectedRoute === letter ? 'ALL' : letter)
              }
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER STATUS */}
      {(search || selectedRoute !== 'ALL') && (
        <div style={{ padding: '12px 0 0', textAlign: 'center' }}>
          <span className="progress-text">
            Showing {totalFilteredTeams} team{totalFilteredTeams !== 1 ? 's' : ''}{' '}
            {selectedRoute !== 'ALL' ? `on Route ${selectedRoute}` : ''}{' '}
            {search ? `matching "${search}"` : ''}
          </span>
        </div>
      )}

      {/* ROUTES */}
      {filteredRoutes.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔭</div>
          <p className="no-results-text">
            No teams found{search ? ` matching "${search}"` : ''}
          </p>
        </div>
      ) : (
        filteredRoutes.map((route) => (
          <RouteSection
            key={route.route}
            route={route}
            onTeamClick={setSelectedTeam}
          />
        ))
      )}

      {/* TEAM DETAIL MODAL */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam.team}
          route={selectedTeam.route}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}

/* ===== ROUTE SECTION ===== */
function RouteSection({ route, onTeamClick }) {
  return (
    <section className="route-section">
      <div className="route-header">
        <div className="route-badge">{route.route}</div>
        <div>
          <div className="route-title">Route {route.route}</div>
          <div className="route-meta">
            {route.teams.length} teams · Updated {route.lastUpdated}
          </div>
        </div>
      </div>

      <div className="route-teams">
        {route.teams.map((team) => (
          <TeamCard
            key={team.code}
            team={team}
            route={route}
            onClick={() => onTeamClick({ team, route })}
          />
        ))}
      </div>
    </section>
  );
}

/* ===== TEAM CARD ===== */
function TeamCard({ team, route, onClick }) {
  const progressPct =
    team.totalCheckpoints > 0
      ? (team.progress / team.totalCheckpoints) * 100
      : 0;

  // Find the latest checkpoint name
  const latestIndex = team.progress - 1;
  const latestCheckpoint =
    latestIndex >= 0 && route.checkpoints[latestIndex]
      ? route.checkpoints[latestIndex]
      : null;

  const statusClass = team.status.toLowerCase().replace('_', '-');

  const statusLabel = {
    IN_PROGRESS: 'En Route',
    CAMPED: 'Camped',
    FINISHED: 'Finished',
    RETIRED: 'Retired',
  }[team.status] || team.status;

  return (
    <div className="team-card" onClick={onClick}>
      <div className="team-card-top">
        <div className="team-info">
          <span className="team-code-badge">{team.code}</span>
          <span className="team-name">{team.name}</span>
        </div>
        <span className={`team-status-badge ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="progress-container">
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${statusClass}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="progress-label">
          <span className="progress-text">
            {team.progress}/{team.totalCheckpoints} checkpoints
          </span>
          {latestCheckpoint && (
            <span className="progress-latest">📍 {latestCheckpoint}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== TEAM DETAIL MODAL ===== */
function TeamDetailModal({ team, route, onClose }) {
  // Close on escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const statusLabel = {
    IN_PROGRESS: 'En Route',
    CAMPED: 'Camped',
    FINISHED: 'Finished',
    RETIRED: 'Retired',
  }[team.status] || team.status;

  const statusClass = team.status.toLowerCase().replace('_', '-');

  // Calculate leg durations
  function calcLegDuration(prevTime, currTime) {
    if (!prevTime || !currTime) return null;
    const [ph, pm] = prevTime.split(':').map(Number);
    const [ch, cm] = currTime.split(':').map(Number);
    let diff = ch * 60 + cm - (ph * 60 + pm);
    if (diff < 0) diff += 24 * 60; // handle day rollover
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-header">
          <div>
            <div className="modal-team-name">{team.name}</div>
            <div className="modal-team-meta">
              <span className="team-code-badge">{team.code}</span>
              <span className="route-badge" style={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                {route.route}
              </span>
              <span className={`team-status-badge ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Timeline */}
        <div className="checkpoint-timeline">
          {route.checkpoints.map((checkpoint, i) => {
            const time = team.times[i] || null;
            const status = team.statuses[i] || null;
            const isReached = !!time;
            const isCurrent = isReached && !team.times[i + 1] && !team.finished;
            const isVia = checkpoint.toLowerCase().includes('(via)');

            const prevTime = i > 0 ? team.times[i - 1] : null;
            const legDuration = calcLegDuration(prevTime, time);

            let dotClass = '';
            if (status && status.toUpperCase() === 'CAMPED') dotClass = 'camped';
            else if (isCurrent) dotClass = 'current';
            else if (isReached) dotClass = 'reached';

            let nameClass = '';
            if (!isReached) nameClass = 'pending';
            else if (isVia) nameClass = 'via';

            return (
              <div
                key={i}
                className={`timeline-item ${isReached ? 'reached' : ''}`}
              >
                <div className={`timeline-dot ${dotClass}`}>
                  {isReached ? '✓' : i + 1}
                </div>
                <div className="timeline-info">
                  <div className={`timeline-checkpoint-name ${nameClass}`}>
                    {checkpoint}
                  </div>
                  {time && (
                    <div className="timeline-time">{time}</div>
                  )}
                  {legDuration && (
                    <div className="timeline-leg-duration">
                      +{legDuration} from previous
                    </div>
                  )}
                  {status && (
                    <div
                      className={`timeline-status ${status.toLowerCase()}`}
                    >
                      🏕️ {status}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
