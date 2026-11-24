import { useState, type FormEvent } from 'react';
import { ArrowRight, Globe, Moon, Sun } from 'lucide-react';
import { ViggleLogo } from './ViggleLogo';
import {
  validateNewsletterEmail,
  type LanguageCode,
  UI_COPY,
} from '../utils/viggleLogic';

interface FooterProps {
  onNavigate: (path: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  lang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
}

export function Footer({
  onNavigate,
  theme,
  onToggleTheme,
  lang,
  onChangeLang,
}: FooterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message?: string }>({
    type: 'idle',
  });

  const copy = UI_COPY[lang];

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    const res = validateNewsletterEmail(email);
    if (!res.valid) {
      setStatus({ type: 'error', message: res.error });
      return;
    }
    setStatus({
      type: 'success',
      message: `Subscribed ${res.normalized} to Luancer updates.`,
    });
    setEmail('');
  };

  const nav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="relative z-[30] bg-[#f3f2ed] dark:bg-[#171614] text-[#29231e] dark:text-[#f5f4f0] rounded-t-[36px] -mt-8 pt-16 pb-12 px-6 md:px-14 border-t border-black/5 dark:border-white/5">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left brand column */}
        <div className="lg:col-span-4 flex flex-col items-start gap-5">
          <a href="/" aria-label="Luancer and Co. home" onClick={nav('/')}>
            <ViggleLogo variant="card" />
          </a>
          <p className="text-[20px] leading-[1.3] font-medium text-[#29231e]/85 dark:text-[#f5f4f0]/85 max-w-[200px]">
            {copy.footerTagline}
          </p>
          <a
            href="/download"
            onClick={nav('/download')}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[15px] font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>{copy.getApp}</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <div className="flex items-center gap-3 pt-3 text-[#29231e]/80 dark:text-[#f5f4f0]/80">
            {[
              {
                label: 'TikTok',
                path: '/download',
                d: 'M14.5 3v10.2a3.3 3.3 0 1 1-2.3-3.1V7.6a5.8 5.8 0 1 0 4.8 5.7V8.1a6.4 6.4 0 0 0 3.7 1.2V6.8a3.9 3.9 0 0 1-3.7-3.8h-2.5z',
              },
              {
                label: 'Instagram',
                path: '/download',
                d: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.8A4.2 4.2 0 1 0 16.2 12 4.2 4.2 0 0 0 12 7.8zm0 6.8a2.6 2.6 0 1 1 2.6-2.6 2.6 2.6 0 0 1-2.6 2.6zm4.5-7.6a1 1 0 1 0 1 1 1 1 0 0 0-1-1z',
              },
              {
                label: 'Twitter',
                path: '/about-us',
                d: 'M4 4l6.8 9.1L4 20h1.9l5.7-6 4.5 6H20l-7.1-9.5L19.2 4h-1.9l-5.3 5.6L7.9 4H4z',
              },
              {
                label: 'LinkedIn',
                path: '/about-us',
                d: 'M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm3.4 14.5H6V9.8h2.4v7.7zM7.2 8.7a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8zm10.3 8.8h-2.4v-4c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1v4.7H10V9.8h2.3v1.1c.4-.6 1.1-1.3 2.3-1.3 1.7 0 2.9 1.1 2.9 3.4v4.5z',
              },
              {
                label: 'YouTube',
                path: '/research',
                d: 'M21.2 7.4a2.7 2.7 0 0 0-1.9-1.9C17.6 5 12 5 12 5s-5.6 0-7.3.5A2.7 2.7 0 0 0 2.8 7.4 28 28 0 0 0 2.3 12a28 28 0 0 0 .5 4.6 2.7 2.7 0 0 0 1.9 1.9C6.4 19 12 19 12 19s5.6 0 7.3-.5a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .5-4.6 28 28 0 0 0-.5-4.6zM10 15V9l5.2 3L10 15z',
              },
              {
                label: 'Discord',
                path: '/download',
                d: 'M18.9 6.2a14 14 0 0 0-3.5-1.1l-.5 1a12.8 12.8 0 0 0-5.8 0l-.5-1a14 14 0 0 0-3.5 1.1C2.9 9.6 2.3 12.9 2.6 16.2a14.2 14.2 0 0 0 4.3 2.2l.9-1.5a9.3 9.3 0 0 1-1.4-.7l.3-.3a10 10 0 0 0 8.6 0l.3.3c-.5.3-.9.5-1.4.7l.9 1.5a14.2 14.2 0 0 0 4.3-2.2c.4-3.8-.6-7.1-2.5-10zM9.4 14.2c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7zm5.2 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7z',
              },
            ].map((soc) => (
              <a
                key={soc.label}
                href={soc.path}
                aria-label={soc.label}
                onClick={nav(soc.path)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={soc.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Right columns + newsletter */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6b645c] dark:text-[#a39c93] mb-4">
                Products
              </p>
              <ul className="space-y-2.5 text-[14px]">
                <li><a href="/meme" onClick={nav('/meme')} className="hover:underline">Meme Maker &amp; Templates</a></li>
                <li><a href="/studio/multi-editor" onClick={nav('/studio/multi-editor')} className="hover:underline">Luancer Remake</a></li>
                <li><a href="/studio/mix" onClick={nav('/studio/mix')} className="hover:underline">Character Swap</a></li>
                <li><a href="/pinoc" onClick={nav('/pinoc')} className="hover:underline">PINOC</a></li>
                <li><a href="/games" onClick={nav('/games')} className="hover:underline">Games</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6b645c] dark:text-[#a39c93] mb-4">
                Resources
              </p>
              <ul className="space-y-2.5 text-[14px]">
                <li><a href="/studio/mix" onClick={nav('/studio/mix')} className="hover:underline">Tools</a></li>
                <li><a href="/jst2" onClick={nav('/jst2')} className="hover:underline">AI Models</a></li>
                <li><a href="/pricing" onClick={nav('/pricing')} className="hover:underline">Comparisons</a></li>
                <li><a href="/blog/black-mirror-experience-viggle-api-case-study" onClick={nav('/blog/black-mirror-experience-viggle-api-case-study')} className="hover:underline">Blog</a></li>
                <li><a href="/research" onClick={nav('/research')} className="hover:underline">Research</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6b645c] dark:text-[#a39c93] mb-4">
                API
              </p>
              <ul className="space-y-2.5 text-[14px]">
                <li><a href="/developers" onClick={nav('/developers')} className="hover:underline">About API</a></li>
                <li><a href="/developers" onClick={nav('/developers')} className="hover:underline">API portal</a></li>
                <li><a href="/developers" onClick={nav('/developers')} className="hover:underline">API doc</a></li>
                <li><a href="/games" onClick={nav('/games')} className="hover:underline">GameDev</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6b645c] dark:text-[#a39c93] mb-4">
                Company
              </p>
              <ul className="space-y-2.5 text-[14px]">
                <li><a href="/about-us" onClick={nav('/about-us')} className="hover:underline">About</a></li>
                <li><a href="/about-us" onClick={nav('/about-us')} className="hover:underline">Careers</a></li>
                <li><a href="/pricing" onClick={nav('/pricing')} className="hover:underline">Pricing</a></li>
                <li><a href="/download" onClick={nav('/download')} className="hover:underline">Community</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter card matching Viggle.ai */}
          <div className="rounded-3xl bg-[#fcfcfc] dark:bg-[#211f1c] p-6 md:p-8 border border-black/5 dark:border-white/10">
            <p className="text-[18px] font-semibold mb-1">{copy.dontMissOut}</p>
            <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93] mb-5">
              Features, offers and the best of Luancer, by email. Unsubscribe anytime.
            </p>
            <form onSubmit={handleSubscribe} noValidate className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="viggle-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="viggle-newsletter-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status.type !== 'idle') setStatus({ type: 'idle' });
                }}
                placeholder="example@email.com"
                className="flex-1 px-4 py-3 rounded-2xl bg-[#f3f2ed] dark:bg-[#171614] border border-transparent focus:border-[#29231e]/30 dark:focus:border-white/30 outline-none text-[14px]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[14px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copy.subscribe}
              </button>
            </form>
            {status.type === 'error' && (
              <p role="alert" className="mt-2.5 text-[13px] font-medium text-red-600 dark:text-red-400">
                {status.message}
              </p>
            )}
            {status.type === 'success' && (
              <p role="status" className="mt-2.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
                {status.message}
              </p>
            )}
          </div>

          {/* Bottom legal + language + theme toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-[12px] text-[#6b645c] dark:text-[#a39c93]">
            <div className="flex flex-wrap items-center gap-5">
              <a href="/about-us" onClick={nav('/about-us')} className="hover:underline">Terms of Service</a>
              <a href="/about-us" onClick={nav('/about-us')} className="hover:underline">Community Rules</a>
              <a href="/about-us" onClick={nav('/about-us')} className="hover:underline">Privacy Policy</a>
              <span>© 2026 Luancer. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5">
                <Globe className="w-3.5 h-3.5" />
                <select
                  aria-label="Change language"
                  value={lang}
                  onChange={(e) => onChangeLang(e.target.value as LanguageCode)}
                  className="bg-transparent outline-none text-[13px] font-medium text-[#29231e] dark:text-[#f5f4f0] cursor-pointer"
                >
                  <option value="en" className="text-black">English</option>
                  <option value="it" className="text-black">Italiano</option>
                  <option value="zh" className="text-black">简体中文</option>
                </select>
              </div>

              <button
                type="button"
                aria-label="Toggle color theme"
                onClick={onToggleTheme}
                className="p-2 rounded-xl border border-black/10 dark:border-white/15 bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-[#29231e] dark:text-[#f5f4f0] transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
