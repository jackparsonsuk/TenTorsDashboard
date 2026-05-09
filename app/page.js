'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_INTERVAL = 60; // seconds
const ROUTE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FAV_STORAGE_KEY = 'tentors-favourites';

function loadFavourites() {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(FAV_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavourites(favs) {
  try {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...favs]));
  } catch {}
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [favourites, setFavourites] = useState(new Set());
  const [showFavourites, setShowFavourites] = useState(false);
  const countdownRef = useRef(REFRESH_INTERVAL);

  // Load favourites from localStorage on mount
  useEffect(() => {
    setFavourites(loadFavourites());
  }, []);

  const toggleFavourite = useCallback((teamCode) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(teamCode)) {
        next.delete(teamCode);
      } else {
        next.add(teamCode);
      }
      saveFavourites(next);
      return next;
    });
  }, []);

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

    // Filter by favourites
    if (showFavourites && favourites.size > 0) {
      routes = routes
        .map((route) => ({
          ...route,
          teams: route.teams.filter((team) => favourites.has(team.code)),
        }))
        .filter((route) => route.teams.length > 0);
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

  const campedCount = data?.routes?.reduce(
    (sum, r) => sum + r.teams.filter((t) => t.status === 'CAMPED').length,
    0
  ) || 0;

  const finishedCount = data?.routes?.reduce(
    (sum, r) => sum + r.teams.filter((t) => t.status === 'FINISHED').length,
    0
  ) || 0;

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
          {finishedCount > 0 && (
            <div className="stat-item">
              <span className="stat-value">{finishedCount}</span>
              <span className="stat-label">Finished</span>
            </div>
          )}
          {campedCount > 0 && (
            <div className="stat-item">
              <span className="stat-value">{campedCount}</span>
              <span className="stat-label">Camped</span>
            </div>
          )}
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
            className={`route-chip fav-chip ${showFavourites ? 'active' : ''}`}
            onClick={() => setShowFavourites(!showFavourites)}
          >
            ⭐ {favourites.size > 0 ? favourites.size : ''}
          </button>
          <button
            className={`route-chip ${!showFavourites && selectedRoute === 'ALL' ? 'active' : ''}`}
            onClick={() => { setSelectedRoute('ALL'); setShowFavourites(false); }}
          >
            All
          </button>
          {ROUTE_LETTERS.map((letter) => (
            <button
              key={letter}
              className={`route-chip ${!showFavourites && selectedRoute === letter ? 'active' : ''}`}
              onClick={() => {
                setShowFavourites(false);
                setSelectedRoute(selectedRoute === letter ? 'ALL' : letter);
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER STATUS */}
      {(search || selectedRoute !== 'ALL' || showFavourites) && (
        <div style={{ padding: '12px 0 0', textAlign: 'center' }}>
          <span className="progress-text">
            {showFavourites ? '⭐ ' : ''}
            Showing {totalFilteredTeams} team{totalFilteredTeams !== 1 ? 's' : ''}{' '}
            {showFavourites ? '(favourites)' : ''}{' '}
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
            favourites={favourites}
            onToggleFavourite={toggleFavourite}
          />
        ))
      )}

      {/* TEAM DETAIL MODAL */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam.team}
          route={selectedTeam.route}
          onClose={() => setSelectedTeam(null)}
          isFavourite={favourites.has(selectedTeam.team.code)}
          onToggleFavourite={toggleFavourite}
        />
      )}
    </div>
  );
}

/* ===== ROUTE SECTION ===== */
function RouteSection({ route, onTeamClick, favourites, onToggleFavourite }) {
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
            isFavourite={favourites.has(team.code)}
            onToggleFavourite={onToggleFavourite}
          />
        ))}
      </div>
    </section>
  );
}

/* ===== TEAM CARD ===== */
function TeamCard({ team, route, onClick, isFavourite, onToggleFavourite }) {
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

  const handleStarClick = (e) => {
    e.stopPropagation();
    onToggleFavourite(team.code);
  };

  return (
    <div className={`team-card ${isFavourite ? 'favourited' : ''}`} onClick={onClick}>
      <div className="team-card-top">
        <div className="team-info">
          <button
            className={`star-btn ${isFavourite ? 'active' : ''}`}
            onClick={handleStarClick}
            aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          >
            {isFavourite ? '★' : '☆'}
          </button>
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
function TeamDetailModal({ team, route, onClose, isFavourite, onToggleFavourite }) {
  const [isSharing, setIsSharing] = useState(false);

  const shareImage = async () => {
    setIsSharing(true);
    
    const currentCp = team.progress > 0 ? route.checkpoints[team.progress - 1] : 'Start';
    const nextCp = team.progress < route.checkpoints.length ? route.checkpoints[team.progress] : 'Finish';
    
    let lastLegStr = '';
    if (team.progress > 1) {
      const prevTime = team.times[team.progress - 2];
      const currTime = team.times[team.progress - 1];
      if (prevTime && currTime) {
        const [ph, pm] = prevTime.split(':').map(Number);
        const [ch, cm] = currTime.split(':').map(Number);
        let diff = ch * 60 + cm - (ph * 60 + pm);
        if (diff < 0) diff += 24 * 60;
        const hours = Math.floor(diff / 60);
        const m = diff % 60;
        lastLegStr = hours > 0 ? `${hours}h ${m}m` : `${m}m`;
      }
    }

    const imageUrl = `/api/og?team=${encodeURIComponent(team.name)}&code=${team.code}&route=${route.route}&progress=${team.progress}&total=${team.totalCheckpoints}&status=${team.status}&current=${encodeURIComponent(currentCp)}&next=${encodeURIComponent(nextCp)}&lastLeg=${encodeURIComponent(lastLegStr)}`;
    
    try {
      if (navigator.share) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${team.code}-progress.png`, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${team.name} - Ten Tors Progress`,
            text: `Check out ${team.name}'s progress on the Ten Tors Challenge!`,
            files: [file],
          });
        } else {
          window.open(imageUrl, '_blank');
        }
      } else {
        window.open(imageUrl, '_blank');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      window.open(imageUrl, '_blank');
    } finally {
      setIsSharing(false);
    }
  };

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

  // Calculate leg duration in minutes (raw)
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

  // Build leg data for pace analysis
  const legs = [];
  for (let i = 1; i < route.checkpoints.length; i++) {
    const mins = calcLegMinutes(team.times[i - 1], team.times[i]);
    if (mins !== null) {
      legs.push({
        from: route.checkpoints[i - 1],
        to: route.checkpoints[i],
        minutes: mins,
      });
    }
  }

  const avgPace = legs.length > 0
    ? Math.round(legs.reduce((s, l) => s + l.minutes, 0) / legs.length)
    : null;

  const totalElapsed = calcLegMinutes(team.times[0], team.times[team.progress - 1]);

  const maxLegMinutes = legs.length > 0 ? Math.max(...legs.map(l => l.minutes)) : 1;

  // Pace trend: compare first half avg vs second half avg
  let paceTrend = null;
  if (legs.length >= 4) {
    const mid = Math.floor(legs.length / 2);
    const firstHalf = legs.slice(0, mid);
    const secondHalf = legs.slice(mid);
    const firstAvg = firstHalf.reduce((s, l) => s + l.minutes, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, l) => s + l.minutes, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;
    if (diff > 5) paceTrend = 'slowing';
    else if (diff < -5) paceTrend = 'speeding';
    else paceTrend = 'steady';
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="modal-header">
          <div>
            <div className="modal-team-name">
              <button
                className={`star-btn modal-star ${isFavourite ? 'active' : ''}`}
                onClick={() => onToggleFavourite(team.code)}
                aria-label={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              >
                {isFavourite ? '★' : '☆'}
              </button>
              {team.name}
            </div>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="modal-share" onClick={shareImage} aria-label="Share Progress" title="Share Progress" disabled={isSharing}>
              {isSharing ? '⏳' : '📤'}
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Pace Analysis Toggle */}
        {legs.length > 0 && (
          <div className="pace-section">
            <button
              className="pace-toggle-btn"
              onClick={() => {
                const panel = document.getElementById(`pace-${team.code}`);
                panel.classList.toggle('open');
              }}
            >
              📊 Pace Analysis
              <span className="pace-toggle-summary">
                {formatMinutes(avgPace)} avg
                {paceTrend && (
                  <span className={`pace-trend-${paceTrend}`}>
                    {' '}{paceTrend === 'slowing' ? '↘' : paceTrend === 'speeding' ? '↗' : '→'}
                  </span>
                )}
              </span>
            </button>
            <div id={`pace-${team.code}`} className="pace-panel collapsible">
              <div className="pace-stats">
                <div className="pace-stat">
                  <span className="pace-stat-value">{formatMinutes(avgPace)}</span>
                  <span className="pace-stat-label">Avg per leg</span>
                </div>
                <div className="pace-stat">
                  <span className="pace-stat-value">{formatMinutes(totalElapsed)}</span>
                  <span className="pace-stat-label">Total time</span>
                </div>
                <div className="pace-stat">
                  <span className="pace-stat-value">{legs.length}</span>
                  <span className="pace-stat-label">Legs done</span>
                </div>
                {paceTrend && (
                  <div className="pace-stat">
                    <span className={`pace-stat-value pace-trend-${paceTrend}`}>
                      {paceTrend === 'slowing' ? '↘' : paceTrend === 'speeding' ? '↗' : '→'}
                    </span>
                    <span className="pace-stat-label">
                      {paceTrend === 'slowing' ? 'Slowing' : paceTrend === 'speeding' ? 'Faster' : 'Steady'}
                    </span>
                  </div>
                )}
              </div>

              <div className="pace-bars">
                {legs.map((leg, i) => {
                  const pct = (leg.minutes / maxLegMinutes) * 100;
                  const isSlow = leg.minutes > avgPace * 1.3;
                  const isFast = leg.minutes < avgPace * 0.7;
                  return (
                    <div key={i} className="pace-bar-row">
                      <span className="pace-bar-label" title={`${leg.from} → ${leg.to}`}>
                        {leg.to.replace(' (via)', '')}
                      </span>
                      <div className="pace-bar-track">
                        <div
                          className={`pace-bar-fill ${isSlow ? 'slow' : isFast ? 'fast' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`pace-bar-time ${isSlow ? 'slow' : isFast ? 'fast' : ''}`}>
                        {formatMinutes(leg.minutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="checkpoint-timeline">
          {route.checkpoints.map((checkpoint, i) => {
            const time = team.times[i] || null;
            const status = team.statuses[i] || null;
            const isReached = !!time;
            const isCurrent = isReached && !team.times[i + 1] && !team.finished;
            const isVia = checkpoint.toLowerCase().includes('(via)');

            const prevTime = i > 0 ? team.times[i - 1] : null;
            const legMins = calcLegMinutes(prevTime, time);
            const legStr = formatMinutes(legMins);

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
                  {legMins !== null && (
                    <div className="timeline-leg-duration">
                      +{legStr} from previous
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
