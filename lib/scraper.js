const BASE_URL = 'https://www.tentors.org.uk/eventdata';
const ROUTE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Fetches and parses a single route page.
 * Returns structured data for the route, or null on error.
 */
async function parseRoutePage(letter) {
  const url = `${BASE_URL}/route${letter.toLowerCase()}.html`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TenTorsDashboard/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseRouteHTML(letter, html);
  } catch (err) {
    console.error(`Failed to fetch route ${letter}:`, err.message);
    return null;
  }
}

/**
 * Parses the raw HTML of a route page into structured data.
 */
function parseRouteHTML(letter, html) {
  // Extract LAST UPDATED time
  const updatedMatch = html.match(/LAST UPDATED:\s*([\d:]+)/);
  const lastUpdated = updatedMatch ? updatedMatch[1] : null;

  // Extract header row — checkpoint names from <th> tags
  const headerRowMatch = html.match(/<tr>[\s\S]*?<\/tr>/);
  if (!headerRowMatch) return null;

  const headerRow = headerRowMatch[0];
  const thRegex = /<th[^>]*>[\s\S]*?<\/th>/gi;
  const thMatches = headerRow.match(thRegex) || [];

  const checkpoints = [];
  for (const th of thMatches) {
    // Extract text content from within <div> or directly
    let text = th
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Skip the first header (TEAM/LAST UPDATED) and CODE
    if (text.includes('LAST UPDATED') || text.includes('TEAM')) continue;
    if (text === 'CODE') continue;

    checkpoints.push(text);
  }

  // Extract team rows
  const rowRegex = /<tr>\s*<!--\s*Row\s*-->[\s\S]*?<\/tr>/gi;
  const rowMatches = html.match(rowRegex) || [];

  const teams = [];

  for (const row of rowMatches) {
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let match;

    while ((match = tdRegex.exec(row)) !== null) {
      cells.push(match[1]);
    }

    if (cells.length < 3) continue;

    // First cell = team name (may contain </a> artifact)
    const teamName = cells[0]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .trim();

    // Second cell = team code
    const teamCode = cells[1].replace(/<[^>]+>/g, '').trim();

    // Remaining cells = times + statuses
    const times = [];
    const statuses = [];

    for (let i = 2; i < cells.length; i++) {
      const cellContent = cells[i].trim();

      // Check for status annotations (after <br>)
      let time = '';
      let status = null;

      if (cellContent.includes('<br>') || cellContent.includes('<br/>') || cellContent.includes('<br />')) {
        const parts = cellContent.split(/<br\s*\/?>/i);
        time = parts[0].replace(/<[^>]+>/g, '').trim();
        status = parts[1] ? parts[1].replace(/<[^>]+>/g, '').trim() : null;
      } else {
        time = cellContent.replace(/<[^>]+>/g, '').trim();
      }

      times.push(time || null);
      statuses.push(status || null);
    }

    // Calculate progress
    const filledTimes = times.filter((t) => t && t.length > 0);
    const progress = filledTimes.length;

    // Determine if team has finished (last checkpoint "FINISH" has a time)
    const finishIndex = checkpoints.findIndex(
      (cp) => cp.toUpperCase() === 'FINISH'
    );
    const finished = finishIndex >= 0 && times[finishIndex] && times[finishIndex].length > 0;

    // Detect if team is retired/withdrawn
    const hasRetired = statuses.some(
      (s) => s && (s.toUpperCase().includes('RETIRED') || s.toUpperCase().includes('WITHDRAWN'))
    );

    // Detect if camped
    const hasCamped = statuses.some(
      (s) => s && s.toUpperCase().includes('CAMPED')
    );

    let teamStatus = 'IN_PROGRESS';
    if (finished) teamStatus = 'FINISHED';
    else if (hasRetired) teamStatus = 'RETIRED';
    else if (hasCamped) teamStatus = 'CAMPED';

    teams.push({
      name: teamName,
      code: teamCode,
      times,
      statuses,
      progress,
      totalCheckpoints: checkpoints.length,
      finished,
      status: teamStatus,
    });
  }

  return {
    route: letter,
    lastUpdated,
    checkpoints,
    teams,
  };
}

/**
 * Fetches all 26 routes in parallel and returns the full dataset.
 */
export async function fetchAllRoutes() {
  const results = await Promise.allSettled(
    ROUTE_LETTERS.map((letter) => parseRoutePage(letter))
  );

  const routes = results
    .filter((r) => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value);

  return {
    lastFetched: new Date().toISOString(),
    routeCount: routes.length,
    teamCount: routes.reduce((sum, r) => sum + r.teams.length, 0),
    routes,
  };
}
