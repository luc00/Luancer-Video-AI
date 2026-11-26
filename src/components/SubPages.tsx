import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, Terminal } from 'lucide-react';
import { ASSETS, BRAND_CASE_STUDIES, PINOC_WORLDS } from '../data/viggleData';

interface SubPageProps {
  onNavigate: (path: string) => void;
}

export function Jst2Page({ onNavigate }: SubPageProps) {
  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1160px] mx-auto">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-3">
        Research Release · JST-2
      </p>
      <h1 className="text-[clamp(2.5rem,5vw,4.25rem)] font-medium leading-[1.05] tracking-[-0.03em] mb-6 text-balance">
        Joint Space and Time, Gen 2.0
      </h1>
      <p className="text-[19px] leading-[1.5] text-[#6b645c] dark:text-[#a39c93] max-w-[760px] mb-10">
        A single physics-native world model that generates coherent 3D environments, rigged characters, and temporal motion from words, photos, or reference clips.
      </p>

      <div className="rounded-[28px] overflow-hidden mb-12 border border-black/8 dark:border-white/10">
        <img src={ASSETS.heroMotion} alt="JST-2 spatio-temporal motion synthesis" className="w-full aspect-video object-cover" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { kpi: '60 FPS', label: 'Real-time spatial camera walk-around' },
          { kpi: '4.2x', label: 'Higher foot-ground contact fidelity' },
          { kpi: 'FBX / GLB', label: 'Native rigged mesh & motion export' },
        ].map((item) => (
          <div key={item.kpi} className="rounded-[24px] bg-[#f3f2ed] dark:bg-[#171614] p-7 border border-black/5 dark:border-white/10">
            <div className="text-[36px] font-bold tracking-tight tabular-nums mb-1">{item.kpi}</div>
            <div className="text-[14px] text-[#6b645c] dark:text-[#a39c93]">{item.label}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onNavigate('/studio/pinoc')}
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] font-semibold cursor-pointer"
      >
        <span>Try JST-2 in Studio</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ResearchPage({ onNavigate }: SubPageProps) {
  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1160px] mx-auto">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-3">
        Luancer Research
      </p>
      <h1 className="text-[clamp(2.5rem,4.5vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.03em] mb-10">
        Advancing controllable 3D character & world intelligence.
      </h1>

      <div className="space-y-5">
        {[
          {
            title: 'JST-2: Physics-Native Joint Space-Time Foundation Model',
            date: 'October 2026',
            tag: 'World Models',
            summary: 'Unifying 3D Gaussian scene synthesis, skeletal rigging, and video-driven character animation in one latent space.',
            path: '/jst2',
          },
          {
            title: 'PINOC: Rapid 3D World Reconstruction from Single Prompts',
            date: 'August 2026',
            tag: '3D Generation',
            summary: 'Generating navigable 3D scenes with consistent lighting and character collisions in under 90 seconds.',
            path: '/pinoc',
          },
          {
            title: 'Zero-Latency Real-Time Motion Retargeting for Live Video',
            date: 'May 2026',
            tag: 'Real-Time Swap',
            summary: 'Streaming webcam pose estimation directly onto stylized 2D and 3D avatars at 60Hz.',
            path: '/studio/live',
          },
        ].map((paper) => (
          <button
            key={paper.title}
            type="button"
            onClick={() => onNavigate(paper.path)}
            className="w-full text-left rounded-[24px] bg-[#f3f2ed] dark:bg-[#171614] p-7 border border-black/6 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 text-[13px] text-[#6b645c] dark:text-[#a39c93] mb-2">
              <span>{paper.tag}</span>
              <span aria-hidden="true">·</span>
              <span>{paper.date}</span>
            </div>
            <h2 className="text-[22px] font-medium mb-2">{paper.title}</h2>
            <p className="text-[15px] text-[#6b645c] dark:text-[#a39c93]">{paper.summary}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DevelopersPage({ onNavigate }: SubPageProps) {
  const [copied, setCopied] = useState(false);
  const sampleCurl = `curl -X POST https://api.luancer.ai/v1/renders \\
  -H "Authorization: Bearer $LUANCER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"character_id":"char_abc123","template_id":"tpl_dance_042"}'`;

  const copyCode = () => {
    navigator.clipboard?.writeText(sampleCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1160px] mx-auto">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-3">
        Luancer API v1
      </p>
      <h1 className="text-[clamp(2.5rem,4.5vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.03em] mb-6">
        Character & motion intelligence for your app.
      </h1>
      <p className="text-[18px] text-[#6b645c] dark:text-[#a39c93] max-w-[680px] mb-10">
        Pay as you go at $0.01 per credit. New developer accounts start with 100 free credits.
      </p>

      <div className="rounded-[24px] bg-[#141413] text-white p-6 md:p-8 mb-10 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 text-[13px] font-mono text-white/70">
            <Terminal className="w-4 h-4 text-[#07f34b]" />
            <span>POST /v1/renders</span>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] font-medium cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#07f34b]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="font-mono text-[13px] leading-relaxed overflow-x-auto text-emerald-300">
          <code>{sampleCurl}</code>
        </pre>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/studio/mix')}
          className="px-6 py-3 rounded-full bg-[#07f34b] text-[#111310] font-semibold cursor-pointer"
        >
          Test in Studio
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/pricing')}
          className="px-6 py-3 rounded-full border border-black/15 dark:border-white/20 font-medium cursor-pointer"
        >
          View API Pricing
        </button>
      </div>
    </div>
  );
}

export function McpPage({ onNavigate }: SubPageProps) {
  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1100px] mx-auto">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-3">
        Model Context Protocol
      </p>
      <h1 className="text-[clamp(2.5rem,4.5vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.03em] mb-6">
        Luancer MCP Server
      </h1>
      <p className="text-[18px] text-[#6b645c] dark:text-[#a39c93] max-w-[680px] mb-10">
        Connect coding agents and creative assistants directly to Luancer character rigging, motion templates, and PINOC 3D world generation tools.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {[
          { name: 'create_character', desc: 'Convert a portrait image into a rigged JST-2 character handle.' },
          { name: 'render_motion', desc: 'Apply any motion reference video or prompt to a character.' },
          { name: 'generate_pinoc_world', desc: 'Synthesize a navigable 3D GLB scene from text or image.' },
        ].map((tool) => (
          <div key={tool.name} className="rounded-[22px] bg-[#f3f2ed] dark:bg-[#171614] p-6 border border-black/6 dark:border-white/10">
            <code className="text-[14px] font-semibold text-emerald-700 dark:text-[#07f34b]">
              {tool.name}
            </code>
            <p className="mt-2 text-[14px] text-[#6b645c] dark:text-[#a39c93]">{tool.desc}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onNavigate('/developers')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#07f34b] text-[#111310] font-semibold cursor-pointer"
      >
        <span>Explore API Docs</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function PinocPage({ onNavigate }: SubPageProps) {
  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-2">
            PINOC 3D Engine
          </p>
          <h1 className="text-[clamp(2.5rem,4.5vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.03em]">
            Explore 3D worlds built from a prompt.
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/studio/pinoc')}
          className="px-6 py-3 rounded-full bg-[#07f34b] text-[#111310] font-semibold inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Launch PINOC Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PINOC_WORLDS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onNavigate('/studio/pinoc')}
            className="text-left rounded-[24px] overflow-hidden bg-[#f3f2ed] dark:bg-[#171614] border border-black/6 dark:border-white/10 group cursor-pointer"
          >
            <img src={w.image} alt={w.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[18px] font-semibold">{w.title}</h2>
                <span className="text-[12px] text-[#6b645c] dark:text-[#a39c93] tabular-nums">
                  {w.generationTime}
                </span>
              </div>
              <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93]">{w.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function GamesPage({ onNavigate }: SubPageProps) {
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(86);

  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1160px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-2">
            Luancer Games
          </p>
          <h1 className="text-[clamp(2.25rem,4vw,3.5rem)] font-medium tracking-[-0.03em]">
            Street Remix Fighter
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/studio/mix')}
          className="px-6 py-3 rounded-full bg-[#07f34b] text-[#111310] font-semibold cursor-pointer"
        >
          Swap Custom Fighter
        </button>
      </div>

      <div className="rounded-[28px] bg-[#0c0e11] text-white p-6 border border-white/10">
        <div className="grid grid-cols-2 gap-6 mb-4 tabular-nums text-[14px]">
          <div>
            <div className="flex justify-between mb-1 font-semibold">
              <span>Ryo (Custom Avatar)</span>
              <span>{p1Hp}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-[#07f34b] transition-all" style={{ width: `${p1Hp}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 font-semibold">
              <span>Blaze (Tabby Knight)</span>
              <span>{p2Hp}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-amber-400 transition-all" style={{ width: `${p2Hp}%` }} />
            </div>
          </div>
        </div>

        <img
          src={ASSETS.gamesArena}
          alt="Playable Luancer Games arena"
          className="w-full aspect-video object-cover rounded-2xl mb-4"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setP2Hp((hp) => Math.max(0, hp - 14))}
              className="px-5 py-2.5 rounded-full bg-[#07f34b] text-[#111310] font-semibold cursor-pointer"
            >
              Punch (J)
            </button>
            <button
              type="button"
              onClick={() => setP2Hp((hp) => Math.max(0, hp - 22))}
              className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 font-semibold cursor-pointer"
            >
              Special Combo (U)
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setP1Hp(100);
              setP2Hp(100);
            }}
            className="px-4 py-2 rounded-full border border-white/20 text-[13px] cursor-pointer"
          >
            Reset Round
          </button>
        </div>
      </div>
    </div>
  );
}

export function DownloadPage({ onNavigate }: SubPageProps) {
  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1000px] mx-auto text-center">
      <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-medium tracking-[-0.03em] mb-4">
        Create anywhere with Luancer.
      </h1>
      <p className="text-[18px] text-[#6b645c] dark:text-[#a39c93] max-w-[600px] mx-auto mb-10">
        Available on Web Studio, iOS, Android, and Discord.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
        {[
          { platform: 'Web Studio', desc: 'Full Mix, Multi-Editor, PINOC 3D, and Live Swap in your browser.', action: 'Launch Web App', path: '/studio/mix' },
          { platform: 'iOS & Android', desc: 'Instant mobile character swaps and TikTok-ready export.', action: 'Open Mobile Preview', path: '/studio/mix' },
          { platform: 'API & MCP', desc: 'Integrate Luancer motion models into your own pipeline.', action: 'Explore API', path: '/developers' },
        ].map((card) => (
          <div key={card.platform} className="rounded-[24px] bg-[#f3f2ed] dark:bg-[#171614] p-7 border border-black/6 dark:border-white/10 flex flex-col justify-between">
            <div>
              <h2 className="text-[20px] font-semibold mb-2">{card.platform}</h2>
              <p className="text-[14px] text-[#6b645c] dark:text-[#a39c93] mb-6">{card.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(card.path)}
              className="px-5 py-2.5 rounded-full bg-[#07f34b] text-[#111310] text-[14px] font-semibold cursor-pointer"
            >
              {card.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AboutPage({ onNavigate }: SubPageProps) {
  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[960px] mx-auto">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-3">
        About Luancer
      </p>
      <h1 className="text-[clamp(2.5rem,4.5vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.03em] mb-6">
        50M+ people bring characters to life with Luancer.
      </h1>
      <p className="text-[18px] leading-[1.6] text-[#6b645c] dark:text-[#a39c93] mb-10">
        Luancer is a spatial generative AI company building the experience engine for physical intelligence—bridging video generation, controllable 3D character motion, and interactive worlds.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {[
          {
            title: 'Terms of Service',
            body: 'Creators retain rights to original characters and prompts. Free-tier renders include studio attribution, while Pro, Live, and Max plans grant watermark-free commercial export.',
          },
          {
            title: 'Privacy Policy',
            body: 'Uploaded portraits, custom motion videos, and exported MP4/GIF renders are scoped privately to your account and processed only for your active Studio workflows.',
          },
          {
            title: 'Community Rules',
            body: 'Celebrate creative remixes, memes, and choreography while respecting consent, attribution, and safe public standards across shared feeds.',
          },
          {
            title: 'Careers at Luancer',
            body: 'We hire graphics engineers, temporal diffusion researchers, and full-stack product builders working across 3D rigging, WebGL, and real-time video.',
          },
        ].map((section) => (
          <div
            key={section.title}
            className="rounded-[22px] bg-[#f3f2ed] dark:bg-[#171614] p-6 border border-black/6 dark:border-white/10"
          >
            <h2 className="text-[18px] font-semibold mb-2">{section.title}</h2>
            <p className="text-[14px] leading-[1.6] text-[#6b645c] dark:text-[#a39c93]">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onNavigate('/research')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#07f34b] text-[#111310] font-semibold cursor-pointer"
      >
        <span>Read Our Research</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function BlogCaseStudyPage({
  slug,
  onNavigate,
}: {
  slug?: string;
  onNavigate: (path: string) => void;
}) {
  const article =
    BRAND_CASE_STUDIES.find((c) => c.slug === slug) ?? BRAND_CASE_STUDIES[0];

  return (
    <article className="pt-28 pb-24 px-6 md:px-14 max-w-[860px] mx-auto">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-[14px] font-medium text-[#6b645c] dark:text-[#a39c93] hover:text-[#29231e] dark:hover:text-white mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Luancer</span>
      </button>

      <div className="flex items-center gap-3 text-[13px] text-[#6b645c] dark:text-[#a39c93] mb-3">
        <span>{article.brand}</span>
        <span aria-hidden="true">·</span>
        <span>{article.publishedDate}</span>
        <span aria-hidden="true">·</span>
        <span>{article.readTime}</span>
      </div>

      <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.025em] mb-6">
        {article.title}
      </h1>

      <div className={`rounded-[28px] p-8 md:p-12 bg-gradient-to-br ${article.gradientClass} mb-10 flex items-center justify-between`}>
        <span className="text-[32px] font-black text-[#111310]">{article.brand}</span>
        <div className="text-right text-[#111310]">
          <div className="text-[32px] font-bold tabular-nums">{article.metricValue}</div>
          <div className="text-[13px] font-medium">{article.metricLabel}</div>
        </div>
      </div>

      <div className="space-y-5 text-[17px] leading-[1.7] text-[#29231e]/90 dark:text-[#f5f4f0]/90">
        <p className="font-medium text-[19px]">{article.summary}</p>
        {article.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
