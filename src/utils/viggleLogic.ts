export type BillingPeriod = 'monthly' | 'yearly';
export type PricingProduct = 'viggle-ai' | 'pinoc';
export type LanguageCode = 'en' | 'it' | 'zh';

export type RouteId =
  | 'home'
  | 'pricing'
  | 'studio'
  | 'research'
  | 'developers'
  | 'mcp'
  | 'jst2'
  | 'pinoc'
  | 'games'
  | 'download'
  | 'about'
  | 'meme'
  | 'blog';

export interface ParsedRoute {
  id: RouteId;
  slug?: string;
  studioMode?: 'text-to-video' | 'image-to-video' | 'mix' | 'multi-editor' | 'pinoc' | 'live';
  templateId?: string;
  studioView?: 'create' | 'explore' | 'my-videos';
}

export interface PlanTier {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  tagline: string;
  ctaLabel: string;
  features: string[];
}

export interface StudioJob {
  id: string;
  mode: 'text-to-video' | 'image-to-video' | 'mix' | 'multi-editor' | 'pinoc' | 'live';
  characterName: string;
  templateName: string;
  prompt: string;
  model: string;
  aspectRatio?: '16:9' | '9:16';
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  creditsUsed: number;
  createdAt: string;
  mediaType?: 'video' | 'image';
  outputUrl: string;
  errorMessage?: string;
}

export const YEARLY_DISCOUNT_RATE = 0.2;

export const VIGGLE_AI_PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    tagline: 'Start creating for free.',
    ctaLabel: 'Start free',
    features: [
      'Free credits refresh daily',
      '1 video generation at a time',
      'Limited multi-track sessions',
      'Limited Real-Time Swap',
      '7-day asset & generation storage',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 9.99,
    yearlyMonthlyPrice: 7.99,
    tagline: 'For creators who make more.',
    ctaLabel: 'Upgrade',
    features: [
      '80 credits/month',
      'Faster video generation',
      'Up to 4 video generations at once',
      'Limited Real-Time Swap sessions',
      'Permanent asset storage',
      'No watermark',
      'Unlimited Multi-Track sessions',
      'Larger motion video uploads',
      'All models except Seedance',
    ],
  },
  {
    id: 'live',
    name: 'Live',
    badge: 'Popular',
    monthlyPrice: 19.99,
    yearlyMonthlyPrice: 15.99,
    tagline: 'For faster workflows.',
    ctaLabel: 'Upgrade',
    features: [
      '200 credits/month',
      'Faster video generation',
      'Up to 6 video generations at once',
      'Stream 6+ hours in Real-Time Swap',
      'Permanent asset storage',
      'No watermark',
      'Unlimited Multi-Track sessions',
      'Larger motion video uploads',
      'Access to all models',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    badge: 'Best value',
    monthlyPrice: 79.99,
    yearlyMonthlyPrice: 63.99,
    tagline: 'For video production at scale.',
    ctaLabel: 'Upgrade',
    features: [
      '800 credits/month',
      'Faster video generation',
      'Up to 10 video generations at once',
      'Unlimited Real-Time Swap sessions',
      'Permanent asset storage',
      'No watermark',
      'Unlimited Multi-Track sessions',
      'Larger motion video uploads',
      'Access to all models',
    ],
  },
];

export const PINOC_PLANS: PlanTier[] = [
  {
    id: 'pinoc-free',
    name: 'Explorer',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    tagline: 'Preview 3D worlds and walk inside scenes.',
    ctaLabel: 'Try PINOC free',
    features: [
      '3 world generations per week',
      'Interactive 3D walk-around camera',
      'Standard GLB preview',
      'Community scene gallery access',
    ],
  },
  {
    id: 'pinoc-creator',
    name: 'Creator',
    badge: 'Popular',
    monthlyPrice: 12.99,
    yearlyMonthlyPrice: 10.39,
    tagline: 'Rigged characters and clean 3D motion export.',
    ctaLabel: 'Upgrade PINOC',
    features: [
      '60 world & character generations/month',
      'Rigged FBX & GLB export',
      'Custom physics-native motion retargeting',
      'Commercial usage rights',
    ],
  },
  {
    id: 'pinoc-studio',
    name: 'Studio',
    badge: 'Best value',
    monthlyPrice: 39.99,
    yearlyMonthlyPrice: 31.99,
    tagline: 'High-volume 3D assets for game & film teams.',
    ctaLabel: 'Upgrade PINOC',
    features: [
      '250 world & character generations/month',
      '4K PBR texture baking & skeletal export',
      'Priority JST-2 world queue',
      'Team shared scene workspace',
    ],
  },
];

export function getDisplayPrice(plan: PlanTier, billing: BillingPeriod): number {
  return billing === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function validateNewsletterEmail(raw: string): { valid: boolean; error?: string; normalized?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter an email address.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true, normalized: trimmed.toLowerCase() };
}

export function calculateJobCredits(mode: StudioJob['mode'], model: string, hd: boolean): number {
  const base =
    mode === 'text-to-video' || mode === 'image-to-video'
      ? 5
      : mode === 'pinoc'
      ? 4
      : mode === 'multi-editor'
      ? 3
      : mode === 'live'
      ? 1
      : 2;
  const modelExtra = model.includes('Seedance') || model.includes('JST-2') || model.includes('omni') ? 2 : 0;
  return base + modelExtra + (hd ? 1 : 0);
}

export function createStudioJob(params: {
  id: string;
  mode: StudioJob['mode'];
  characterName: string;
  templateName: string;
  prompt: string;
  model: string;
  hd: boolean;
  outputUrl: string;
}): StudioJob {
  return {
    id: params.id,
    mode: params.mode,
    characterName: params.characterName,
    templateName: params.templateName,
    prompt: params.prompt.trim() || `${params.characterName} performing ${params.templateName}`,
    model: params.model,
    status: 'queued',
    progress: 12,
    creditsUsed: calculateJobCredits(params.mode, params.model, params.hd),
    createdAt: new Date().toISOString(),
    outputUrl: params.outputUrl,
  };
}

export function advanceStudioJob(job: StudioJob, stepDelta = 30): StudioJob {
  if (job.status === 'completed') return job;
  const nextProgress = Math.min(100, job.progress + stepDelta);
  if (nextProgress >= 100) {
    return {
      ...job,
      progress: 100,
      status: 'completed',
    };
  }
  return {
    ...job,
    progress: nextProgress,
    status: 'rendering',
  };
}

export type MixBackgroundMode = 'template' | 'green' | 'white' | 'custom';
export type StudioResolutionTier = '4k' | '1080p' | '720p';

export function buildMixGenerationPrompt(params: {
  basePrompt: string;
  templateName: string;
  templateCategory: string;
  bgMode: MixBackgroundMode;
  characterRefine: boolean;
  lipSync: boolean;
  footLock: boolean;
  isTextOnly: boolean;
  secondCharacterName?: string;
}): string {
  const trimmed = params.basePrompt.trim();
  if (params.isTextOnly) {
    return trimmed;
  }

  const core =
    trimmed ||
    `Animate this character performing ${params.templateName} (${params.templateCategory}) with smooth natural lighting`;

  const modifiers: string[] = [];
  if (params.bgMode === 'green') {
    modifiers.push('isolated cleanly against a solid #00FF00 green screen chroma key background');
  } else if (params.bgMode === 'white') {
    modifiers.push('isolated cleanly against a seamless white studio cyclorama background');
  } else if (params.bgMode === 'custom') {
    modifiers.push('composited cleanly into custom scene background');
  }

  if (params.characterRefine) modifiers.push('multi-angle character identity refine');
  if (params.lipSync) modifiers.push('facial expression and lip sync preservation');
  if (params.footLock) modifiers.push('physics-grounded foot-lock contact');
  if (params.secondCharacterName) {
    modifiers.push(`dual-character multi-track choreography alongside ${params.secondCharacterName}`);
  }

  if (modifiers.length === 0) return core;
  const combined = `${core}. Features: ${modifiers.join(', ')}.`;
  return combined.slice(0, 1000);
}

export const TEMPLATE_CATEGORIES = [
  'All',
  'Memes',
  'Dance',
  'Action',
  'Sports',
  'Rap / Music',
  '3D Worlds',
  'VFX & Swap',
  'Classic Memes',
] as const;

export type TemplateCategoryFilter = (typeof TEMPLATE_CATEGORIES)[number];

export interface FilterableTemplate {
  id: string;
  name: string;
  creator: string;
  category: string;
  prompt: string;
  tags: string[];
}

export function filterMotionTemplates<T extends FilterableTemplate>(
  templates: T[],
  category: string,
  searchQuery: string
): T[] {
  const q = searchQuery.trim().toLowerCase();
  return templates.filter((tpl) => {
    const matchesCategory = category === 'All' || tpl.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      tpl.name.toLowerCase().includes(q) ||
      tpl.category.toLowerCase().includes(q) ||
      tpl.creator.toLowerCase().includes(q) ||
      tpl.prompt.toLowerCase().includes(q) ||
      tpl.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

export function parseRoute(pathnameWithQuery: string): ParsedRoute {
  const [rawPath, rawQuery = ''] = pathnameWithQuery.split('?');
  const clean = rawPath.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(rawQuery);
  const templateId = params.get('template')?.trim() || undefined;
  const viewParam = params.get('view');
  const studioView =
    viewParam === 'explore' || viewParam === 'my-videos' || viewParam === 'create'
      ? viewParam
      : undefined;

  if (clean === '/' || clean === '/home') return { id: 'home' };
  if (clean === '/pricing') return { id: 'pricing' };
  if (clean === '/research') return { id: 'research' };
  if (clean === '/developers' || clean === '/api') return { id: 'developers' };
  if (clean === '/mcp') return { id: 'mcp' };
  if (clean === '/jst2') return { id: 'jst2' };
  if (clean === '/pinoc') return { id: 'pinoc' };
  if (clean === '/games' || clean.startsWith('/games/')) return { id: 'games' };
  if (clean === '/download') return { id: 'download' };
  if (clean === '/about-us') return { id: 'about' };
  if (clean === '/meme' || clean === '/templates') return { id: 'meme' };
  if (clean.startsWith('/blog/')) {
    return { id: 'blog', slug: clean.slice('/blog/'.length) };
  }
  if (clean === '/blog') {
    return { id: 'blog', slug: 'black-mirror-experience-viggle-api-case-study' };
  }
  if (clean.startsWith('/studio') || clean.startsWith('/meme/app')) {
    let studioMode: ParsedRoute['studioMode'] = 'image-to-video';
    if (clean.includes('text-to-video')) {
      studioMode = 'text-to-video';
    } else if (clean.includes('image-to-video') || clean.includes('animate')) {
      studioMode = 'image-to-video';
    } else if (clean.includes('multi-track') || clean.includes('multi-editor')) {
      studioMode = 'multi-editor';
    } else if (clean.includes('pinoc')) {
      studioMode = 'pinoc';
    } else if (clean.includes('live')) {
      studioMode = 'live';
    }
    return {
      id: 'studio',
      studioMode,
      ...(templateId ? { templateId } : {}),
      ...(studioView ? { studioView } : {}),
    };
  }
  if (clean === '/viggle-live') {
    return {
      id: 'studio',
      studioMode: 'live',
      ...(templateId ? { templateId } : {}),
      ...(studioView ? { studioView } : {}),
    };
  }
  return { id: 'home' };
}

export const UI_COPY: Record<
  LanguageCode,
  {
    heroTitle: string;
    createNow: string;
    getApp: string;
    lovedBy: string;
    tryForFree: string;
    exploreApi: string;
    bottomCtaTitle: string;
    startCreating: string;
    footerTagline: string;
    dontMissOut: string;
    subscribe: string;
  }
> = {
  en: {
    heroTitle: 'Building the experience engine for physical intelligence.',
    createNow: 'Create now',
    getApp: 'Get App',
    lovedBy: 'Loved by creators at',
    tryForFree: 'Try for free',
    exploreApi: 'Explore API',
    bottomCtaTitle: 'Create what moves you.',
    startCreating: 'Start creating',
    footerTagline: 'Spatial GenAI platform.',
    dontMissOut: "Don't miss out!",
    subscribe: 'Subscribe',
  },
  it: {
    heroTitle: "Costruiamo il motore d'esperienza per l'intelligenza fisica.",
    createNow: 'Crea ora',
    getApp: 'Scarica App',
    lovedBy: 'Scelto dai creator di',
    tryForFree: 'Prova gratis',
    exploreApi: 'Esplora API',
    bottomCtaTitle: 'Crea ciò che ti muove.',
    startCreating: 'Inizia a creare',
    footerTagline: 'Piattaforma GenAI spaziale.',
    dontMissOut: 'Non perderti nulla!',
    subscribe: 'Iscriviti',
  },
  zh: {
    heroTitle: '为物理智能构建体验引擎。',
    createNow: '立即创作',
    getApp: '获取应用',
    lovedBy: '深受创作者信赖',
    tryForFree: '免费试用',
    exploreApi: '探索 API',
    bottomCtaTitle: '创作打动你的作品。',
    startCreating: '开始创作',
    footerTagline: '空间生成式 AI 平台。',
    dontMissOut: '不错过任何更新！',
    subscribe: '订阅',
  },
};

export type ExportFormat = 'mp4' | 'gif';

export function sanitizeExportFilename(rawName: string, format: ExportFormat): string {
  const slug = rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  const safeBase = slug ? (slug.startsWith('luancer-') ? slug : `luancer-${slug}`) : 'luancer-motion';
  return `${safeBase}.${format}`;
}

export function buildMotionExportEndpoint(
  sourceUrl: string | undefined,
  format: ExportFormat,
  rawName: string
): string | null {
  if (!sourceUrl) return null;
  const trimmed = sourceUrl.trim();
  if (
    !trimmed.startsWith('/api/videos/file/') &&
    !trimmed.startsWith('/api/templates/4k/') &&
    !trimmed.startsWith('/assets/viggle-templates/') &&
    !trimmed.startsWith('/src/assets/images/')
  ) {
    return null;
  }
  const safeBase = sanitizeExportFilename(rawName, format).replace(/\.(mp4|gif)$/i, '');
  const params = new URLSearchParams({
    format,
    source: trimmed,
    name: safeBase,
  });
  return `/api/export/motion?${params.toString()}`;
}

