import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Box, Gamepad2, Play, Sparkles } from 'lucide-react';
import {
  ASSETS,
  BRAND_CASE_STUDIES,
  HOME_FEATURED_TEMPLATES,
  HOME_TOP_TEMPLATES,
  MOTION_TEMPLATES,
} from '../data/viggleData';
import { Jst2Globe } from './Jst2Globe';
import { PartnerLogos } from './PartnerLogos';
import { getTemplate4kVideoUrl } from '../utils/templateMedia';
import { UI_COPY, type LanguageCode } from '../utils/viggleLogic';

interface HomePageProps {
  onNavigate: (path: string) => void;
  theme: 'light' | 'dark';
  lang: LanguageCode;
}

export function HomePage({ onNavigate, theme, lang }: HomePageProps) {
  const [activeWorldId, setActiveWorldId] = useState(HOME_TOP_TEMPLATES[0].id);
  const [apiStep, setApiStep] = useState<1 | 2 | 3>(3);
  const [fighterHit, setFighterHit] = useState(false);

  const copy = UI_COPY[lang];
  const activeWorld =
    HOME_TOP_TEMPLATES.find((w) => w.id === activeWorldId) ?? HOME_TOP_TEMPLATES[0];

  const triggerHit = () => {
    setFighterHit(true);
    setTimeout(() => setFighterHit(false), 450);
  };

  const replayApiFlow = () => {
    setApiStep(1);
    setTimeout(() => setApiStep(2), 420);
    setTimeout(() => setApiStep(3), 840);
  };

  const handlePinocKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveWorldId(HOME_TOP_TEMPLATES[(idx + 1) % HOME_TOP_TEMPLATES.length].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveWorldId(
        HOME_TOP_TEMPLATES[(idx - 1 + HOME_TOP_TEMPLATES.length) % HOME_TOP_TEMPLATES.length].id
      );
    }
  };

  return (
    <div className="w-full overflow-x-clip">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[760px] md:min-h-[820px] flex flex-col justify-between bg-[#090d10] text-white pt-24 pb-20 px-6 md:px-14">
        {/* Background Image + Cinematic Scrim */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={ASSETS.heroMotion}
            alt="Stylized 3D character sprinting through a neon rain-slicked street"
            fetchPriority="high"
            decoding="sync"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06090c]/88 via-[#06090c]/50 to-[#06090c]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06090c] via-transparent to-[#06090c]/55" />
        </div>

        {/* Floating announcement banner */}
        <div className="relative z-10 flex justify-center mt-2">
          <button
            type="button"
            onClick={() => onNavigate('/jst2')}
            className="inline-flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/15 text-[13px] transition-colors cursor-pointer"
          >
            <img
              src={ASSETS.heroMotion}
              alt=""
              aria-hidden="true"
              className="w-8 h-5 rounded-full object-cover"
            />
            <span className="font-semibold text-white">Introducing JST-2</span>
            <span className="text-white/60">|</span>
            <span className="inline-flex items-center gap-1 text-white/85">
              <span>Read the post</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* Hero main split */}
        <div className="relative z-10 max-w-[1320px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 items-end gap-10 mt-10">
          <div className="lg:col-span-8">
            <h1 className="text-[clamp(2.75rem,5.4vw,5rem)] font-medium leading-[1.03] tracking-[-0.03em] text-white max-w-[780px] text-balance">
              {copy.heroTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <button
                type="button"
                onClick={() => onNavigate('/studio/mix')}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-[#111310] hover:bg-[#07f34b] text-[15px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{copy.createNow}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/download')}
                className="inline-flex items-center px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/18 text-white border border-white/25 backdrop-blur-md text-[15px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copy.getApp}
              </button>
            </div>

            <div className="mt-12 max-w-[680px]">
              <p className="text-[11px] font-semibold tracking-[0.09em] uppercase text-white/60 mb-3">
                {copy.lovedBy}
              </p>
              <PartnerLogos darkSurface />
            </div>
          </div>

          {/* Bottom-right Quick Action Pills matching Viggle.ai */}
          <div className="lg:col-span-4 flex lg:justify-end items-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/studio/pinoc')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Box className="w-4 h-4 text-[#07f34b]" />
              <span>Try JST-2</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-75" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/games')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4 text-[#07f34b]" />
              <span>Games</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-75" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. PINOC SECTION (White rounded top) */}
      <section className="relative bg-[#fcfcfc] dark:bg-[#0e0d0c] rounded-t-[36px] -mt-8 pt-16 pb-24 px-6 md:px-14 z-[10]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between gap-6 mb-10">
            <h2 className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium tracking-[-0.025em]">
              PINOC
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/studio/pinoc')}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[15px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{copy.tryForFree}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Interactive 5-panel expanding top templates showcase */}
            <div className="lg:col-span-8 flex gap-2.5 h-[320px] sm:h-[380px]">
              {HOME_TOP_TEMPLATES.map((tpl, idx) => {
                const isActive = tpl.id === activeWorld.id;
                return (
                  <div
                    key={tpl.id}
                    className={`relative overflow-hidden rounded-[22px] transition-all duration-500 ease-out group bg-black ${
                      isActive ? 'flex-[5]' : 'flex-[0.75] hover:flex-[1]'
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={isActive}
                      aria-label={`Preview ${tpl.name} template`}
                      onClick={() => setActiveWorldId(tpl.id)}
                      onKeyDown={(e) => handlePinocKeyDown(e, idx)}
                      className="w-full h-full block text-left cursor-pointer"
                    >
                      {tpl.videoUrl ? (
                        <video
                          key={tpl.id}
                          src={getTemplate4kVideoUrl(tpl.id, tpl.videoUrl)}
                          poster={tpl.image}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          onCanPlay={(e) => {
                            const v = e.currentTarget;
                            v.muted = true;
                            if (v.paused) void v.play().catch(() => {});
                          }}
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            tpl.aspect === '9:16' ? 'object-top' : 'object-center'
                          }`}
                        />
                      ) : (
                        <img
                          src={tpl.image}
                          alt={tpl.name}
                          loading="lazy"
                          decoding="async"
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                            tpl.aspect === '9:16' ? 'object-top' : 'object-center'
                          }`}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                      <div
                        className={`absolute bottom-4 left-4 right-4 text-white transition-opacity pointer-events-none ${
                          isActive ? 'opacity-100 pr-36' : 'opacity-0 sm:opacity-90'
                        }`}
                      >
                        {isActive ? (
                          <div>
                            <div className="text-[16px] font-semibold truncate">{tpl.name}</div>
                            <div className="text-[12px] text-white/75 tabular-nums">
                              {tpl.category} · {tpl.aspect} · {tpl.duration}
                            </div>
                          </div>
                        ) : (
                          <span className="block text-[12px] font-medium truncate">
                            {tpl.name}
                          </span>
                        )}
                      </div>
                    </button>

                    {isActive && (
                      <button
                        type="button"
                        onClick={() => onNavigate(`/studio/mix?template=${tpl.id}`)}
                        className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-[#07f34b] hover:text-[#111310] backdrop-blur-md text-white text-[12px] font-semibold transition-colors cursor-pointer"
                      >
                        <span>Use template</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-4 lg:pl-4">
              <h3 className="text-[28px] md:text-[32px] font-medium leading-[1.15] tracking-[-0.02em] mb-4">
                Make 3D worlds, characters and motion from words, a photo or a clip.
              </h3>
              <p className="text-[15px] leading-[1.6] text-[#6b645c] dark:text-[#a39c93] mb-4">
                PINOC and JST-2 power the most used character swaps, dance trends, and 3D worlds. Pick any featured template to preview motion or remix it in Studio.
              </p>
              <div className="p-3.5 rounded-2xl bg-[#f3f2ed] dark:bg-[#171614] border border-black/5 dark:border-white/10 text-[13px] text-[#6b645c] dark:text-[#a39c93]">
                <span className="font-semibold text-[#29231e] dark:text-[#f5f4f0]">
                  Active template ({activeWorld.name}):
                </span>{' '}
                {activeWorld.prompt}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MEME MAKER SECTION (Warm Stone rounded top) */}
      <section className="relative bg-[#f3f2ed] dark:bg-[#171614] rounded-t-[36px] -mt-8 pt-16 pb-24 px-6 md:px-14 z-[14]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <h2 className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium tracking-[-0.025em]">
              Meme Maker
            </h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/studio/mix')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[15px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Try Meme Maker</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/download')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 text-[15px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{copy.getApp}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-6">
              <h3 className="text-[28px] md:text-[34px] font-medium leading-[1.15] tracking-[-0.02em] max-w-[460px]">
                Swap characters. Put any character into any moment.
              </h3>
            </div>
            <div className="lg:col-span-6 flex items-center">
              <p className="text-[15px] leading-[1.6] text-[#6b645c] dark:text-[#a39c93] max-w-[520px]">
                Create videos, memes, and social content built to be shared. Remix trending clips, swap in any character, and turn your ideas into expressive videos that feel timely, entertaining, and unmistakably yours.
              </p>
            </div>
          </div>

          {/* 3 Showcase Cards: Mix, Multi-Editor, Live */}
          <div className="rounded-[32px] bg-[#fcfcfc] dark:bg-[#0e0d0c] p-6 md:p-8 border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Mix',
                  subtitle: 'Single-character video swap',
                  templateId: 'tpl-kitchen-dance-routine',
                  fallbackImage: ASSETS.memeMix,
                  path: '/studio/mix?template=tpl-kitchen-dance-routine',
                  glow: 'from-violet-400/20 via-transparent to-cyan-400/20',
                },
                {
                  title: 'Multi-Editor',
                  subtitle: 'Multi-track scene composition',
                  templateId: 'tpl-rampage-dance',
                  fallbackImage: ASSETS.memeMultiEditor,
                  path: '/studio/multi-editor?template=tpl-rampage-dance',
                  glow: 'from-sky-400/20 via-transparent to-emerald-400/20',
                },
                {
                  title: 'Live',
                  subtitle: 'Real-time webcam mocap',
                  templateId: 'tpl-luancer-live-streamer-1',
                  fallbackImage: ASSETS.memeLive,
                  path: '/studio/live?template=tpl-luancer-live-streamer-1',
                  glow: 'from-emerald-400/20 via-transparent to-teal-400/20',
                },
              ].map((card) => {
                const tpl = MOTION_TEMPLATES.find((t) => t.id === card.templateId);
                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => onNavigate(card.path)}
                    className="group relative rounded-[24px] overflow-hidden aspect-[3/4] text-left cursor-pointer border border-black/8 dark:border-white/10 bg-black"
                  >
                    {tpl?.videoUrl ? (
                      <video
                        src={getTemplate4kVideoUrl(tpl.id, tpl.videoUrl)}
                        poster={tpl.image}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        onCanPlay={(e) => {
                          const v = e.currentTarget;
                          v.muted = true;
                          if (v.paused) void v.play().catch(() => {});
                        }}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={tpl?.image ?? card.fallbackImage}
                        alt={`${card.title} — ${card.subtitle}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.glow} pointer-events-none`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />

                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-4 py-1.5 rounded-full bg-white text-[#111310] text-[15px] font-semibold shadow-sm">
                        {card.title}
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white opacity-95 group-hover:opacity-100">
                      <div className="min-w-0 pr-2">
                        <div className="text-[13px] font-medium truncate">{card.subtitle}</div>
                        {tpl && (
                          <div className="text-[11px] text-white/75 truncate">
                            {tpl.name}
                          </div>
                        )}
                      </div>
                      <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Popular Luancer Motion Templates Quick Launch */}
            <div className="mt-8 pt-7 border-t border-black/8 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-[16px] font-semibold tracking-tight">
                    Popular Motion Templates
                  </h4>
                  <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93]">
                    Click any viral Luancer motion template to open it directly in Studio.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('/meme')}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#00a830] dark:text-[#07f34b] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <span>Meme Templates</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/studio/mix?view=explore')}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#111310] dark:text-white hover:text-[#00a830] dark:hover:text-[#07f34b] cursor-pointer whitespace-nowrap"
                  >
                    <span>Browse all {MOTION_TEMPLATES.length} templates</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {HOME_FEATURED_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onNavigate(`/studio/mix?template=${tpl.id}`)}
                      className="group text-left rounded-2xl bg-[#f3f2ed] dark:bg-[#171614] border border-black/6 dark:border-white/10 overflow-hidden hover:border-[#07f34b] transition-colors cursor-pointer"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-black">
                        {tpl.videoUrl ? (
                          <video
                            src={getTemplate4kVideoUrl(tpl.id, tpl.videoUrl)}
                            poster={tpl.image}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            onCanPlay={(e) => {
                              const v = e.currentTarget;
                              v.muted = true;
                              if (v.paused) void v.play().catch(() => {});
                            }}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <img
                            src={tpl.image}
                            alt={tpl.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-medium tabular-nums">
                          {tpl.duration}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <div className="text-[12px] font-semibold truncate">{tpl.name}</div>
                        <div className="text-[11px] text-[#6b645c] dark:text-[#a39c93] truncate">
                          {tpl.category} · {tpl.aspect}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GAMES SECTION (White rounded top) */}
      <section className="relative bg-[#fcfcfc] dark:bg-[#0e0d0c] rounded-t-[36px] -mt-8 pt-16 pb-24 px-6 md:px-14 z-[18]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between gap-6 mb-10">
            <h2 className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium tracking-[-0.025em]">
              Games
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/games')}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[15px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Play Games</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Fighting Game Frame with interactive hit demo */}
            <div className="lg:col-span-8 relative rounded-[28px] p-6 md:p-8 bg-gradient-to-br from-[#f3f2ed] via-[#0c3b2e] to-[#041712] overflow-hidden border border-black/5 dark:border-white/10">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15">
                <img
                  src={ASSETS.gamesArena}
                  alt="Interactive 3D fighting game template with customizable characters"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className={`w-full aspect-video object-cover transition-transform duration-150 ${
                    fighterHit ? 'scale-[1.03] brightness-125' : ''
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-black/55 backdrop-blur-sm flex items-center justify-between text-white text-[12px]">
                  <span className="font-mono opacity-85">
                    W/A/S/D: move · J: punch · K: kick · Q/E: dodge
                  </span>
                  <button
                    type="button"
                    onClick={triggerHit}
                    className="px-3 py-1 rounded-full bg-[#07f34b] text-[#111310] font-semibold cursor-pointer hover:bg-[#22ff60]"
                  >
                    Test Strike
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <button
                  type="button"
                  onClick={() => onNavigate('/games')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#111310] hover:bg-[#07f34b] text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  <span>Play Games</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <h3 className="text-[28px] md:text-[32px] font-medium leading-[1.15] tracking-[-0.02em] mb-4">
                Play it. Remix it. Jump into the fun.
              </h3>
              <p className="text-[15px] leading-[1.6] text-[#6b645c] dark:text-[#a39c93]">
                Discover a new kind of gaming built around creativity, characters, and shared fun. Choose from popular game templates and remix them with your own characters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. JST-2 WORLD MODEL SECTION (Warm Stone rounded top) */}
      <section className="relative bg-[#f3f2ed] dark:bg-[#171614] rounded-t-[36px] -mt-8 pt-20 pb-24 px-6 md:px-14 z-[22]">
        <div className="max-w-[1100px] mx-auto text-center">
          <h2
            className="text-[clamp(4.5rem,13vw,10.5rem)] font-bold tracking-[-0.04em] leading-none bg-clip-text text-transparent select-none"
            style={{
              backgroundImage: `url(${ASSETS.pinocWindmill})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            JST-2
          </h2>

          <p className="text-[20px] md:text-[24px] font-medium text-[#29231e]/80 dark:text-[#f5f4f0]/80 mt-2">
            Joint space and time, gen 2.0
          </p>

          <h3 className="text-[clamp(1.75rem,3.6vw,3rem)] font-medium leading-[1.15] tracking-[-0.025em] max-w-[780px] mx-auto mt-10 mb-6 text-balance">
            Characters, motion and 3D scenes from one physics-native world model.
          </h3>

          <div className="relative flex flex-col items-center justify-center my-4">
            <Jst2Globe theme={theme} />

            <div className="mt-2 flex flex-col items-center gap-5">
              <p className="text-[22px] md:text-[28px] font-medium tracking-tight tabular-nums">
                <span className="font-bold">50M+</span>{' '}
                <span className="text-[#6b645c] dark:text-[#a39c93]">people use Luancer</span>
              </p>

              <div className="flex flex-wrap justify-center gap-3.5">
                <button
                  type="button"
                  onClick={() => onNavigate('/jst2')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[15px] font-semibold transition-colors cursor-pointer"
                >
                  <span>Explore JST-2</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/about-us')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-[#22201d] border border-black/10 dark:border-white/15 hover:bg-white/80 text-[15px] font-medium transition-colors cursor-pointer"
                >
                  <span>About Luancer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. API SECTION (White rounded top) */}
      <section className="relative bg-[#fcfcfc] dark:bg-[#0e0d0c] rounded-t-[36px] -mt-8 pt-16 pb-24 px-6 md:px-14 z-[24]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between gap-6 mb-10">
            <h2 className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium tracking-[-0.025em]">
              API
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('/developers')}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[15px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{copy.exploreApi}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-6">
              <h3 className="text-[28px] md:text-[34px] font-medium leading-[1.15] tracking-[-0.02em] max-w-[460px]">
                Bring Luancer&apos;s character and motion intelligence into your product.
              </h3>
            </div>
            <div className="lg:col-span-6 flex items-center">
              <p className="text-[15px] leading-[1.6] text-[#6b645c] dark:text-[#a39c93] max-w-[520px]">
                Build character swapping, motion capture, and interactive experiences into games, creative tools, and applications with Luancer&apos;s API.
              </p>
            </div>
          </div>

          {/* Interactive API Pipeline Surface */}
          <div className="viggle-api-surface rounded-[28px] p-6 md:p-10 border border-black/8 dark:border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left code panel */}
              <div className="lg:col-span-6 rounded-2xl bg-[#fcfcfc]/92 dark:bg-[#141312]/92 backdrop-blur-md p-6 border border-black/5 dark:border-white/10 shadow-sm">
                <div className="space-y-5 font-mono text-[13px] leading-relaxed">
                  {[
                    {
                      step: 1 as const,
                      comment: '# Create a character from a photo',
                      endpoint: 'POST /v1/characters',
                      lines: ['photo_url "https://example.com/avatar.jpg"'],
                    },
                    {
                      step: 2 as const,
                      comment: '# Kick off a render',
                      endpoint: 'POST /v1/renders',
                      lines: ['character_id "char_abc123"', 'template_id  "tpl_dance_042"'],
                    },
                    {
                      step: 3 as const,
                      comment: '# Response',
                      endpoint: '200 OK',
                      lines: ['video_url https://cdn.luancer.ai/render_f7e2.mp4'],
                    },
                  ].map((item) => {
                    const active = apiStep >= item.step;
                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => setApiStep(item.step)}
                        className={`w-full text-left flex items-start gap-3.5 p-2 rounded-xl transition-colors cursor-pointer ${
                          apiStep === item.step ? 'bg-emerald-500/10' : 'hover:bg-black/4 dark:hover:bg-white/5'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 tabular-nums ${
                            active
                              ? 'bg-[#07f34b] text-[#111310]'
                              : 'bg-black/10 dark:bg-white/10 text-[#6b645c]'
                          }`}
                        >
                          {item.step}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[#c2410c] dark:text-amber-300">{item.comment}</div>
                          <div className="font-semibold text-indigo-700 dark:text-indigo-300">
                            {item.endpoint}
                          </div>
                          {item.lines.map((l) => (
                            <div key={l} className="text-[#29231e]/85 dark:text-[#f5f4f0]/85 break-all">
                              {l}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right visual hub & rendered output */}
              <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block w-10 border-t-2 border-dashed border-emerald-700/60 dark:border-emerald-300/60" />
                  <div className="px-7 py-4 rounded-2xl bg-[#fcfcfc]/95 dark:bg-[#171614]/95 border border-black/10 dark:border-white/15 shadow-md text-[26px] font-semibold tracking-tight">
                    API
                  </div>
                  <div className="hidden sm:block w-12 border-t-2 border-dashed border-emerald-700/60 dark:border-emerald-300/60" />
                </div>

                <div className="w-52 rounded-2xl bg-[#fcfcfc] dark:bg-[#171614] p-3 shadow-xl border border-black/5 dark:border-white/10">
                  <div className="relative rounded-xl overflow-hidden aspect-square bg-black">
                    <video
                      src={getTemplate4kVideoUrl('tpl-kitchen-dance-routine', ASSETS.memeMix)}
                      poster={ASSETS.memeMix}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      onCanPlay={(e) => {
                        const v = e.currentTarget;
                        v.muted = true;
                        if (v.paused) void v.play().catch(() => {});
                      }}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center pointer-events-none">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-[#6b645c] dark:text-[#a39c93]">
                    <span>{apiStep === 3 ? '200 OK' : `Step ${apiStep}/3`}</span>
                    <span className="truncate ml-2">render_f7e2.mp4</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={replayApiFlow}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/45 hover:bg-black/65 text-white text-[13px] font-medium border border-white/15 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Replay flow</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/developers')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#111310] hover:bg-[#07f34b] text-[14px] font-semibold transition-colors cursor-pointer"
              >
                <span>{copy.exploreApi}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BRAND CASE STUDIES (Warm Stone rounded top) */}
      <section className="relative bg-[#f3f2ed] dark:bg-[#171614] rounded-t-[36px] -mt-8 pt-20 pb-24 px-6 md:px-14 z-[26]">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.12] tracking-[-0.025em] max-w-[680px] mb-12 text-balance">
            See how leading brands use Luancer to power memorable experiences.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {BRAND_CASE_STUDIES.map((cs) => (
              <button
                key={cs.slug}
                type="button"
                onClick={() => onNavigate(`/blog/${cs.slug}`)}
                className="group text-left flex flex-col cursor-pointer"
              >
                <div
                  className={`relative w-full aspect-square rounded-t-[160px] rounded-b-[20px] bg-gradient-to-b ${cs.gradientClass} flex items-center justify-center p-6 overflow-hidden border border-black/5 dark:border-white/10 transition-transform duration-300 group-hover:-translate-y-1`}
                >
                  {cs.markType === 'black-mirror' && (
                    <div className="flex flex-col items-center text-[#18181b]">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                        <path d="M8 10L20 38L32 10H24L20 20L16 10H8Z" fill="currentColor" />
                        <path d="M30 22L40 38H31L26 29L30 22Z" fill="currentColor" />
                      </svg>
                      <span className="sr-only">Black Mirror</span>
                    </div>
                  )}
                  {cs.markType === 'awa' && (
                    <div className="text-center text-[#18181b]">
                      <div className="text-[28px] font-black tracking-[0.06em] leading-none">AWA</div>
                      <div className="text-[8px] font-bold tracking-[0.16em] uppercase mt-1 opacity-80">
                        Artists Writers &amp; Artisans
                      </div>
                    </div>
                  )}
                  {cs.markType === 'coke' && (
                    <div className="text-center text-[#18181b] -rotate-6">
                      <div className="text-[26px] font-black tracking-tight leading-none">Coke</div>
                      <div className="text-[14px] font-extrabold tracking-[0.18em] uppercase mt-0.5">
                        STUDIO
                      </div>
                    </div>
                  )}
                  {cs.markType === 'zepeto' && (
                    <span className="text-[24px] font-black tracking-[0.12em] uppercase text-[#18181b]">
                      ZEPETO
                    </span>
                  )}
                  {cs.markType === 'modelo' && (
                    <span className="text-[24px] font-serif font-bold tracking-tight text-[#18181b]">
                      Modelo
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[15px] font-medium leading-[1.4] group-hover:underline">
                  {cs.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 8. BOTTOM AURORA CTA */}
      <section className="relative viggle-aurora-bottom pt-24 pb-32 px-6 text-center z-[28]">
        <div className="max-w-[780px] mx-auto">
          <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-medium tracking-[-0.03em] leading-[1.08] mb-7">
            {copy.bottomCtaTitle}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('/studio/mix')}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[15px] font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{copy.startCreating}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
