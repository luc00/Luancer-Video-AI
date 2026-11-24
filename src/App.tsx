import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { Navbar } from './components/Navbar';
import { FirebaseProvider } from './context/FirebaseContext';
import { parseRoute, type LanguageCode, type RouteId } from './utils/viggleLogic';

const PricingPage = lazy(() =>
  import('./components/PricingPage').then((m) => ({ default: m.PricingPage }))
);
const StudioPage = lazy(() =>
  import('./components/StudioPage').then((m) => ({ default: m.StudioPage }))
);
const Jst2Page = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.Jst2Page }))
);
const ResearchPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.ResearchPage }))
);
const DevelopersPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.DevelopersPage }))
);
const McpPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.McpPage }))
);
const PinocPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.PinocPage }))
);
const GamesPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.GamesPage }))
);
const DownloadPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.DownloadPage }))
);
const AboutPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.AboutPage }))
);
const BlogCaseStudyPage = lazy(() =>
  import('./components/SubPages').then((m) => ({ default: m.BlogCaseStudyPage }))
);
const MemePage = lazy(() =>
  import('./components/MemePage').then((m) => ({ default: m.MemePage }))
);

const ROUTE_TITLES: Record<RouteId, string> = {
  home: 'Luancer | Turn your imagination into 3D motion',
  pricing: 'Pricing | Luancer',
  studio: 'Studio | Luancer',
  research: 'Research | Luancer',
  developers: 'API & Developers | Luancer',
  mcp: 'MCP Server | Luancer',
  jst2: 'Introducing JST-2 | Luancer',
  pinoc: 'PINOC 3D Engine | Luancer',
  games: 'Games | Luancer',
  download: 'Get Luancer App | Luancer',
  about: 'About Luancer | Luancer',
  meme: 'Meme Templates & Generator | Luancer',
  blog: 'Case Study | Luancer',
};

export default function App() {
  const [pathname, setPathname] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return '/studio/mix';
    return `${window.location.pathname || '/'}${window.location.search || ''}`;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<LanguageCode>('en');

  const parsed = parseRoute(pathname);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    document.title = ROUTE_TITLES[parsed.id];
  }, [parsed.id]);

  useEffect(() => {
    const onPopState = () =>
      setPathname(`${window.location.pathname || '/'}${window.location.search || ''}`);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextPath: string) => {
    const currentFull = `${window.location.pathname}${window.location.search}`;
    if (nextPath !== currentFull) {
      window.history.pushState({}, '', nextPath);
    }
    setPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const isStudio = parsed.id === 'studio';

  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-[#29231e] dark:bg-[#0e0d0c] dark:text-[#f5f4f0] transition-colors duration-200">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#07f34b] focus:text-[#111310] focus:font-semibold"
          >
            Skip to content
          </a>

          {!isStudio && <Navbar currentRoute={parsed.id} onNavigate={navigate} lang={lang} />}

          <main id="main" className="flex-1">
            {parsed.id === 'home' ? (
              <HomePage onNavigate={navigate} theme={theme} lang={lang} />
            ) : (
              <Suspense
                fallback={
                  <div className="min-h-[60vh] flex items-center justify-center pt-28 text-[15px] text-[#6b645c]">
                    Loading Luancer...
                  </div>
                }
              >
                {parsed.id === 'pricing' && <PricingPage onNavigate={navigate} />}
                {parsed.id === 'studio' && (
                  <StudioPage
                    initialMode={parsed.studioMode}
                    initialTemplateId={parsed.templateId}
                    initialView={parsed.studioView}
                    onNavigate={navigate}
                  />
                )}
                {parsed.id === 'jst2' && <Jst2Page onNavigate={navigate} />}
                {parsed.id === 'research' && <ResearchPage onNavigate={navigate} />}
                {parsed.id === 'developers' && <DevelopersPage onNavigate={navigate} />}
                {parsed.id === 'mcp' && <McpPage onNavigate={navigate} />}
                {parsed.id === 'pinoc' && <PinocPage onNavigate={navigate} />}
                {parsed.id === 'games' && <GamesPage onNavigate={navigate} />}
                {parsed.id === 'download' && <DownloadPage onNavigate={navigate} />}
                {parsed.id === 'about' && <AboutPage onNavigate={navigate} />}
                {parsed.id === 'meme' && <MemePage onNavigate={navigate} />}
                {parsed.id === 'blog' && (
                  <BlogCaseStudyPage slug={parsed.slug} onNavigate={navigate} />
                )}
              </Suspense>
            )}
          </main>

          {!isStudio && (
            <Footer
              onNavigate={navigate}
              theme={theme}
              onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              lang={lang}
              onChangeLang={setLang}
            />
          )}
        </div>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
