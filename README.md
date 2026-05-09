# Ten Tors Dashboard

A modern, high-performance web dashboard for tracking live team progress during the Ten Tors Challenge on Dartmoor. This dashboard provides real-time data visualization, pace analytics, and team filtering by scraping live timing data from the official Ten Tors website.

## Features

- **Live Tracking:** Auto-fetches live timing data for all 26 routes (A-Z) every 60 seconds.
- **Pace Analytics:** Calculates leg durations, average pace, and pace trends (slowing, speeding, steady) for individual teams.
- **Favourites:** Star teams to keep them at the top of your view. Saved persistently in your browser's local storage.
- **Search & Filtering:** Quickly search for teams by name or code, or filter down to specific routes.
- **Team Detail Modal:** A comprehensive breakdown of a team's progress, including a visual timeline of checkpoints reached, current status (Camped, En Route, Finished, Retired), and detailed leg timings.
- **Mobile First:** A responsive, premium UI designed to be used by parents and staff on the go.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Vanilla CSS (`globals.css`) with a focus on modern, vibrant, and dynamic aesthetics.
- **Backend:** Next.js API Routes (`app/api/results/route.js`) with server-side web scraping.
- **Data Source:** Official Ten Tors website HTML pages.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```

3. **Open the App:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Ideas for Future Features

Here are some potential enhancements that could take this dashboard to the next level:

### 1. Interactive Map Integration
- Map tor names/checkpoints to actual GPS coordinates (e.g., using a `torCoordinates.js` mapping file).
- Display routes and approximate team locations on an interactive map using Leaflet, Mapbox, or Google Maps.

### 2. Predictive Analytics & ETAs
- Enhance the current pace analysis to predict Estimated Times of Arrival (ETA) for upcoming checkpoints and the finish line.
- Provide warnings if a team's current pace indicates they might miss the finish cutoff time.

### 3. Push Notifications & Alerts
- Implement Web Push Notifications to alert users when their "Favourited" teams reach a new checkpoint, camp for the night, or finish the event.

### 4. Leaderboards & Comparisons
- Add a "Compare" feature to view two or more teams side-by-side.
- Create an overall event leaderboard showing the fastest leg times or most consistent pacing across all routes.

### 5. Offline Support / PWA
- Convert the dashboard into a Progressive Web App (PWA). Cell reception on Dartmoor is notoriously poor, so allowing parents to view the last cached state while offline would be highly beneficial.

### 6. Historical Data Archiving
- Connect to a database (like Supabase or Firebase) to persistently store data throughout the weekend.
- Build a "Replay" mode that allows users to scrub through a timeline and watch the event unfold after it has finished.
