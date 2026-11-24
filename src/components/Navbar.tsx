import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronDown, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { ViggleLogo } from './ViggleLogo';
import type { LanguageCode, RouteId } from '../utils/viggleLogic';
import { UI_COPY } from '../utils/viggleLogic';

interface NavbarProps {
  currentRoute: RouteId;
  onNavigate: (path: string) => void;
  lang: LanguageCode;
}

export function Navbar({ currentRoute, onNavigate, lang }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<'products' | 'learn' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const { user, profile, signingIn, signInWithGoogle, logOut } = useFirebase();

  const isHeroTransparent = currentRoute === 'home' && !scrolled;
  const copy = UI_COPY[lang];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const go = (path: string) => {
    setOpenMenu(null);
    setMobileOpen(false);
    onNavigate(path);
  };

  const linkCls = `text-[14px] font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
    isHeroTransparent
      ? 'text-white/90 hover:text-white'
      : 'text-[#29231e]/85 hover:text-[#29231e] dark:text-[#f5f4f0]/85 dark:hover:text-white'
  }`;

  return (
    <header
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 md:px-8 pt-3 md:pt-4 pointer-events-none"
    >
      <div
        className={`pointer-events-auto w-full transition-all duration-300 ease-out flex items-center justify-between gap-2 sm:gap-6 ${
          scrolled || currentRoute !== 'home'
            ? 'max-w-[980px] rounded-2xl px-3 sm:px-4 py-2 bg-[#fcfcfc]/94 dark:bg-[#171614]/94 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-black/8 dark:border-white/10'
            : 'max-w-[1380px] px-1.5 sm:px-2 py-2 bg-transparent'
        }`}
      >
        {/* Left: Brand + Primary Product/Research */}
        <div className="flex items-center gap-6 shrink-0">
          <a
            href="/"
            aria-label="Luancer and Co. home"
            onClick={(e) => {
              e.preventDefault();
              go('/');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              isHeroTransparent ? 'text-white' : 'text-[#29231e] dark:text-[#f5f4f0]'
            }`}
          >
            <ViggleLogo compact={scrolled && currentRoute === 'home'} />
          </a>

          <nav aria-label="Primary" className="hidden lg:flex items-center gap-5">
            <div className="relative">
              <button
                type="button"
                aria-expanded={openMenu === 'products'}
                onClick={() => setOpenMenu(openMenu === 'products' ? null : 'products')}
                className={`${linkCls} inline-flex items-center gap-1 cursor-pointer`}
              >
                <span>Products</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {openMenu === 'products' && (
                <div className="absolute left-0 top-full mt-3 w-64 rounded-2xl bg-[#fcfcfc] dark:bg-[#1c1a18] border border-black/10 dark:border-white/10 shadow-xl p-2 text-[#29231e] dark:text-[#f5f4f0]">
                  {[
                    { label: 'Meme Maker', desc: 'Swap characters into any video', path: '/studio/mix' },
                    { label: 'Meme Templates', desc: 'Classic memes & 33 viral motion loops', path: '/meme' },
                    { label: 'Multi-Editor', desc: 'Multi-character timeline editor', path: '/studio/multi-editor' },
                    { label: 'PINOC 3D', desc: '3D worlds & rigged characters', path: '/pinoc' },
                    { label: 'Games', desc: 'Play & remix character games', path: '/games' },
                    { label: 'Luancer Live', desc: 'Real-time streaming avatar swap', path: '/studio/live' },
                  ].map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => go(item.path)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f3f2ed] dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="text-[14px] font-semibold">{item.label}</div>
                      <div className="text-[12px] text-[#6b645c] dark:text-[#a39c93]">{item.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="/research"
              onClick={(e) => {
                e.preventDefault();
                go('/research');
              }}
              className={linkCls}
            >
              Research
            </a>
          </nav>
        </div>

        {/* Right: Secondary Links + 1 Primary CTA */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          <a
            href="/developers"
            onClick={(e) => {
              e.preventDefault();
              go('/developers');
            }}
            className={linkCls}
          >
            API
          </a>
          <a
            href="/mcp"
            onClick={(e) => {
              e.preventDefault();
              go('/mcp');
            }}
            className={linkCls}
          >
            MCP
          </a>
          <a
            href="/pricing"
            onClick={(e) => {
              e.preventDefault();
              go('/pricing');
            }}
            className={linkCls}
          >
            Pricing
          </a>

          <div className="relative">
            <button
              type="button"
              aria-expanded={openMenu === 'learn'}
              onClick={() => setOpenMenu(openMenu === 'learn' ? null : 'learn')}
              className={`${linkCls} inline-flex items-center gap-1 cursor-pointer`}
            >
              <span>Learn</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {openMenu === 'learn' && (
              <div className="absolute right-0 top-full mt-3 w-56 rounded-2xl bg-[#fcfcfc] dark:bg-[#1c1a18] border border-black/10 dark:border-white/10 shadow-xl p-2 text-[#29231e] dark:text-[#f5f4f0]">
                {[
                  { label: 'Introducing JST-2', path: '/jst2' },
                  { label: 'Brand Case Studies', path: '/blog/black-mirror-experience-viggle-api-case-study' },
                  { label: 'Get Luancer App', path: '/download' },
                  { label: 'About Luancer', path: '/about-us' },
                ].map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => go(item.path)}
                    className="w-full text-left px-3 py-2 rounded-xl text-[14px] font-medium hover:bg-[#f3f2ed] dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => void logOut()}
              title={`Signed in as ${profile?.displayName || user.email || 'Creator'} — click to sign out`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isHeroTransparent
                  ? 'bg-white/12 text-white hover:bg-white/20'
                  : 'bg-[#f3f2ed] dark:bg-white/10 text-[#29231e] dark:text-white hover:bg-[#e7e4dc]'
              }`}
            >
              {profile?.photoUrl || user.photoURL ? (
                <img
                  src={profile?.photoUrl || user.photoURL || ''}
                  alt={profile?.displayName || 'Account'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : null}
              <span className="max-w-[110px] truncate">{profile?.displayName || 'Account'}</span>
              <LogOut className="w-3.5 h-3.5 opacity-70" />
            </button>
          ) : (
            <button
              type="button"
              disabled={signingIn}
              onClick={() => void signInWithGoogle()}
              className={`${linkCls} inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{signingIn ? 'Signing in...' : 'Sign in'}</span>
            </button>
          )}

          <a
            href="/studio/image-to-video"
            onClick={(e) => {
              e.preventDefault();
              go('/studio/image-to-video');
            }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold whitespace-nowrap shrink-0 transition-all duration-150 ${
              isHeroTransparent
                ? 'border border-white/35 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'
                : 'bg-[#07f34b] text-[#111310] hover:bg-[#00d83d]'
            }`}
          >
            <span>{copy.createNow}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          <a
            href="/studio/mix"
            onClick={(e) => {
              e.preventDefault();
              go('/studio/mix');
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-[#07f34b] text-[#111310] whitespace-nowrap shrink-0"
          >
            <span>{copy.createNow}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`p-2 rounded-xl cursor-pointer ${
              isHeroTransparent
                ? 'text-white bg-white/10'
                : 'text-[#29231e] dark:text-[#f5f4f0] bg-black/5 dark:bg-white/10'
            }`}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="pointer-events-auto lg:hidden fixed inset-x-4 top-20 rounded-2xl bg-[#fcfcfc] dark:bg-[#171614] border border-black/10 dark:border-white/10 shadow-2xl p-4 text-[#29231e] dark:text-[#f5f4f0]">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Meme Maker', path: '/studio/mix' },
              { label: 'Templates', path: '/meme' },
              { label: 'PINOC 3D', path: '/pinoc' },
              { label: 'Games', path: '/games' },
              { label: 'JST-2 Model', path: '/jst2' },
              { label: 'Research', path: '/research' },
              { label: 'API Docs', path: '/developers' },
              { label: 'MCP', path: '/mcp' },
              { label: 'Pricing', path: '/pricing' },
              { label: 'Case Studies', path: '/blog/black-mirror-experience-viggle-api-case-study' },
              { label: 'About Us', path: '/about-us' },
            ].map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className="text-left px-3 py-2.5 rounded-xl text-[14px] font-medium bg-[#f3f2ed] dark:bg-white/5 hover:bg-[#ebe9e2] cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void logOut();
                }}
                className="col-span-2 mt-1 text-left px-3 py-2.5 rounded-xl text-[14px] font-semibold bg-[#29231e] text-white dark:bg-white/15 flex items-center justify-between cursor-pointer"
              >
                <span>Signed in: {profile?.displayName || user.email}</span>
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  void signInWithGoogle();
                }}
                className="col-span-2 mt-1 text-center px-3 py-2.5 rounded-xl text-[14px] font-semibold bg-[#29231e] text-white dark:bg-[#07f34b] dark:text-[#111310] cursor-pointer"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
