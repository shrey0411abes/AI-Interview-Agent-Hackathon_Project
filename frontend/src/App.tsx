import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from './lib/store';

// Lazy-loaded pages for smaller initial bundle
const LandingPage    = lazy(() => import('./pages/LandingPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const InterviewPage  = lazy(() => import('./pages/InterviewPage'));
const ResultsPage    = lazy(() => import('./pages/ResultsPage'));
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ── Theme applier — syncs store to <html> class ────────────────────────
const ThemeRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'light');
    html.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
};

// ── Full-page loading skeleton ─────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center
                      shadow-xl shadow-indigo-500/30 animate-pulse" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ── App ────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeRoot>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                         element={<LandingPage />} />
              <Route path="/dashboard"                element={<DashboardPage />} />
              <Route path="/interview/:candidateId"   element={<InterviewPage />} />
              <Route path="/results/:sessionId"       element={<ResultsPage />} />
              <Route path="*"                         element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ThemeRoot>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
