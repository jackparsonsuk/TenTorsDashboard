import './globals.css';
import TopNav from './components/TopNav';export const metadata = {
  title: 'Ten Tors Dashboard — Live Timings',
  description:
    'Live timing dashboard for the Ten Tors Challenge 2026. Track teams in real-time as they navigate across Dartmoor.',
  openGraph: {
    title: 'Ten Tors Dashboard — Live Timings',
    description:
      'Live timing dashboard for the Ten Tors Challenge 2026. Track teams in real-time across Dartmoor.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070b14',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
