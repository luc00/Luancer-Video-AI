import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Box,
  CheckCircle2,
  Compass,
  Download,
  Film,
  FolderOpen,
  ImagePlus,
  Layers,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Sparkles,
  Trash2,
  Type,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { ASSETS, MOTION_TEMPLATES, STUDIO_CHARACTERS, type MotionTemplate } from '../data/viggleData';
import {
  calculateJobCredits,
  filterMotionTemplates,
  TEMPLATE_CATEGORIES,
  type StudioJob,
} from '../utils/viggleLogic';
import {
  validateVideoRequestPayload,
  type VideoAspectRatio,
} from '../utils/videoValidation';
import { ViggleLogo } from './ViggleLogo';

interface StudioPageProps {
  initialMode?: StudioJob['mode'];
  initialTemplateId?: string;
  initialView?: SidebarView;
  onNavigate?: (path: string) => void;
}

interface CharacterOption {
  id: string;
  name: string;
  style: string;
  image: string;
  base64?: string;
  mimeType?: string;
}

type SidebarView = 'create' | 'explore' | 'my-videos';

const INITIAL_GALLERY: StudioJob[] = [
  {
    id: 'seed-1',
    mode: 'image-to-video',
    characterName: 'Milo (Kitchen Mix)',
    templateName: 'Viral Kitchen Groove',
    prompt: 'Energetic kitchen dance loop with soft daylight reflections',
    model: 'gemini-omni-1.2-flash',
    aspectRatio: '16:9',
    status: 'completed',
    progress: 100,
    creditsUsed: 0,
    createdAt: '2026-11-24T09:40:00.000Z',
    mediaType: 'image',
    outputUrl: ASSETS.memeMix,
  },
  {
    id: 'seed-2',
    mode: 'text-to-video',
    characterName: 'Nova (Astronaut)',
    templateName: '3D World Walk-Around',
    prompt: 'Starship command deck overlooking cosmic nebula',
    model: 'gemini-omni-1.2-flash',
    aspectRatio: '16:9',
    status: 'completed',
    progress: 100,
    creditsUsed: 0,
    createdAt: '2026-11-24T09:12:00.000Z',
    mediaType: 'image',
    outputUrl: ASSETS.pinocStarship,
  },
];

async function urlToBase64Image(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not load selected reference image.');
  }
  const blob = await response.blob();
  const mimeType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
  return { base64, mimeType };
}

export function StudioPage({
  initialMode = 'image-to-video',
  initialTemplateId,
  initialView,
  onNavigate,
}: StudioPageProps) {
  const {
    user,
    profile,
    creations,
    authError,
    signingIn,
    signInWithGoogle,
    logOut,
    createPersistedCreation,
    deletePersistedCreation,
  } = useFirebase();

  const initialMatchedTpl = initialTemplateId
    ? MOTION_TEMPLATES.find((t) => t.id === initialTemplateId)
    : undefined;

  const [sidebarView, setSidebarView] = useState<SidebarView>(initialView || 'create');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mode, setMode] = useState<StudioJob['mode']>(initialMode);
  const [characters, setCharacters] = useState<CharacterOption[]>(STUDIO_CHARACTERS);
  const [selectedCharId, setSelectedCharId] = useState(STUDIO_CHARACTERS[0].id);
  const [selectedTplId, setSelectedTplId] = useState(
    initialMatchedTpl?.id ?? MOTION_TEMPLATES[0].id
  );
  const [charPickerOpen, setCharPickerOpen] = useState(false);
  const [tplPickerOpen, setTplPickerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(
    initialMatchedTpl?.aspect ?? '16:9'
  );
  const [prompt, setPrompt] = useState(initialMatchedTpl?.prompt ?? '');
  const [model, setModel] = useState('gemini-omni-1.2-flash');
  const [hd, setHd] = useState(true);
  const [guestCredits, setGuestCredits] = useState(80);
  const [sessionJobs, setSessionJobs] = useState<StudioJob[]>(() => {
    if (initialMatchedTpl) {
      return [
        {
          id: `preview-${initialMatchedTpl.id}`,
          mode: initialMode,
          characterName: initialMatchedTpl.name,
          templateName: initialMatchedTpl.name,
          prompt: initialMatchedTpl.prompt,
          model: 'gemini-omni-1.2-flash',
          aspectRatio: initialMatchedTpl.aspect,
          status: 'completed',
          progress: 100,
          creditsUsed: 0,
          createdAt: new Date().toISOString(),
          mediaType: initialMatchedTpl.videoUrl ? 'video' : 'image',
          outputUrl: initialMatchedTpl.videoUrl ?? initialMatchedTpl.image,
        },
        ...INITIAL_GALLERY,
      ];
    }
    return INITIAL_GALLERY;
  });
  const [activeJobId, setActiveJobId] = useState<string>(() =>
    initialMatchedTpl ? `preview-${initialMatchedTpl.id}` : INITIAL_GALLERY[0].id
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialView) {
      setSidebarView(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    if (!initialTemplateId) return;
    const match = MOTION_TEMPLATES.find((t) => t.id === initialTemplateId);
    if (match) {
      setSelectedTplId(match.id);
      setPrompt(match.prompt);
      setAspectRatio(match.aspect);
      setMode((prev) => (prev === 'text-to-video' ? 'image-to-video' : prev));
      setSidebarView(initialView || 'create');
    }
  }, [initialTemplateId, initialView]);

  const persistedJobs: StudioJob[] = creations.map((c) => ({
    id: c.id,
    mode: c.mode,
    characterName: c.title,
    templateName: c.aspectRatio === '9:16' ? 'Portrait 9:16' : 'Landscape 16:9',
    prompt: c.prompt,
    model: c.model,
    aspectRatio: c.aspectRatio,
    status: c.status,
    progress: c.status === 'completed' ? 100 : 50,
    creditsUsed: c.creditsUsed,
    createdAt: c.createdAtIso,
    mediaType: c.mediaType,
    outputUrl: c.outputUrl,
    errorMessage: c.errorMessage,
  }));

  const persistedIds = new Set(persistedJobs.map((j) => j.id));
  const visibleJobs = user
    ? [
        ...sessionJobs.filter((j) => !j.id.startsWith('seed-') && !persistedIds.has(j.id)),
        ...persistedJobs,
        ...(persistedJobs.length === 0 ? INITIAL_GALLERY : []),
      ]
    : sessionJobs;

  const credits = user && profile ? profile.credits : guestCredits;
  const selectedChar = characters.find((c) => c.id === selectedCharId) ?? characters[0];
  const selectedTpl = MOTION_TEMPLATES.find((t) => t.id === selectedTplId) ?? MOTION_TEMPLATES[0];
  const activeJob = visibleJobs.find((j) => j.id === activeJobId) ?? visibleJobs[0];
  const cost = calculateJobCredits(mode, model, hd);
  const isTextOnly = mode === 'text-to-video';

  const filteredTemplates = filterMotionTemplates(MOTION_TEMPLATES, categoryFilter, searchQuery);
  const trendingTemplates = MOTION_TEMPLATES.filter((t) => t.popular).slice(0, 4);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
      const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
      const id = `custom-${Date.now()}`;
      const cleanName = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Uploaded Photo';

      setCharacters((prev) => [
        { id, name: cleanName, style: 'Custom Upload', image: dataUrl, base64, mimeType },
        ...prev,
      ]);
      setSelectedCharId(id);
      setCharPickerOpen(false);
      setErrorMsg(null);
      if (isTextOnly) {
        setMode('image-to-video');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePlay = () => {
    const next = !playing;
    setPlaying(next);
    if (videoRef.current) {
      if (next) {
        void videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const applyMotionTemplate = (tpl: MotionTemplate) => {
    setSelectedTplId(tpl.id);
    setPrompt(tpl.prompt);
    setAspectRatio(tpl.aspect);
    setMode((prev) => (prev === 'text-to-video' ? 'image-to-video' : prev));
    const previewId = `preview-${tpl.id}`;
    setSessionJobs((prev) => {
      const rest = prev.filter((j) => !j.id.startsWith('preview-'));
      return [
        {
          id: previewId,
          mode: 'image-to-video',
          characterName: tpl.name,
          templateName: tpl.name,
          prompt: tpl.prompt,
          model,
          aspectRatio: tpl.aspect,
          status: 'completed',
          progress: 100,
          creditsUsed: 0,
          createdAt: new Date().toISOString(),
          mediaType: tpl.videoUrl ? 'video' : 'image',
          outputUrl: tpl.videoUrl ?? tpl.image,
        },
        ...rest,
      ];
    });
    setActiveJobId(previewId);
    setPlaying(true);
    setTplPickerOpen(false);
    setCharPickerOpen(false);
    setSearchQuery('');
    setSidebarView('create');
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (credits < cost) {
      setErrorMsg('Not enough credits remaining to start this generation.');
      return;
    }

    setErrorMsg(null);
    setCharPickerOpen(false);
    setTplPickerOpen(false);
    const apiMode = isTextOnly ? 'text-to-video' : 'image-to-video';
    const effectivePrompt =
      prompt.trim() ||
      (isTextOnly
        ? ''
        : `Animate this character performing ${selectedTpl.name} (${selectedTpl.category}) with smooth natural lighting`);

    let imageBase64 = selectedChar.base64;
    let imageMimeType = selectedChar.mimeType;

    if (apiMode === 'image-to-video' && !imageBase64) {
      try {
        const converted = await urlToBase64Image(selectedChar.image);
        imageBase64 = converted.base64;
        imageMimeType = converted.mimeType;
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Unable to prepare reference image.');
        return;
      }
    }

    const validation = validateVideoRequestPayload({
      mode: apiMode,
      prompt: effectivePrompt,
      aspectRatio,
      imageBase64,
      imageMimeType,
    });

    if (!validation.valid) {
      setErrorMsg(validation.error);
      return;
    }

    const jobId = `job_${Date.now()}`;
    const pendingJob: StudioJob = {
      id: jobId,
      mode,
      characterName: isTextOnly ? 'Text-to-Video Scene' : selectedChar.name,
      templateName: isTextOnly
        ? aspectRatio === '9:16'
          ? 'Portrait 9:16'
          : 'Landscape 16:9'
        : selectedTpl.name,
      prompt: validation.data.prompt,
      model: 'gemini-omni-1.2-flash',
      aspectRatio,
      status: 'rendering',
      progress: 45,
      creditsUsed: cost,
      createdAt: new Date().toISOString(),
      mediaType: 'image',
      outputUrl: isTextOnly ? ASSETS.heroMotion : selectedChar.image,
    };

    setSessionJobs((prev) => [pendingJob, ...prev]);
    setActiveJobId(jobId);
    setSidebarView('create');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const body = (await response.json().catch(() => ({}))) as {
        videoId?: string;
        videoUrl?: string;
        interactionId?: string;
        error?: string;
      };

      if (!response.ok || !body.videoUrl) {
        throw new Error(body.error || `Video generation failed with status ${response.status}.`);
      }

      const completedJob: StudioJob = {
        ...pendingJob,
        status: 'completed',
        progress: 100,
        mediaType: 'video',
        outputUrl: body.videoUrl,
      };

      setSessionJobs((prev) => prev.map((j) => (j.id === jobId ? completedJob : j)));
      setPlaying(true);

      if (user) {
        await createPersistedCreation({
          id: jobId,
          mode,
          title: completedJob.characterName,
          prompt: completedJob.prompt,
          model: 'gemini-omni-1.2-flash',
          aspectRatio,
          creditsUsed: cost,
          mediaType: 'video',
          status: 'completed',
          outputUrl: body.videoUrl,
          videoId: body.videoId,
          interactionId: body.interactionId,
        });
      } else {
        setGuestCredits((c) => Math.max(0, c - cost));
      }
    } catch (err: unknown) {
      const realError = err instanceof Error ? err.message : 'Unexpected video generation error.';
      setErrorMsg(realError);
      setSessionJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: 'failed', progress: 0, errorMessage: realError } : j
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const navTools: Array<{
    id: StudioJob['mode'];
    label: string;
    icon: typeof Film;
    view: SidebarView;
  }> = [
    { id: 'image-to-video', label: 'Mix / Animate', icon: ImagePlus, view: 'create' },
    { id: 'text-to-video', label: 'Text to Video', icon: Type, view: 'create' },
    { id: 'multi-editor', label: 'Multi-Track', icon: Layers, view: 'create' },
    { id: 'pinoc', label: 'PINOC 3D', icon: Box, view: 'create' },
    { id: 'live', label: 'Luancer Live', icon: Radio, view: 'create' },
  ];

  const renderSidebarInner = () => (
    <div className="flex flex-col h-full bg-[#111214] text-[#f5f4f0] border-r border-white/8 select-none">
      {/* Brand Row */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/8">
        <a
          href="/"
          aria-label="Back to Luancer and Co. home"
          onClick={(e) => {
            if (onNavigate) {
              e.preventDefault();
              onNavigate('/');
            }
          }}
          className="text-white hover:opacity-85 transition-opacity"
        >
          <ViggleLogo />
        </a>
        <button
          type="button"
          aria-label="Close studio sidebar"
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Workspace Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSidebarView('explore');
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer ${
              sidebarView === 'explore'
                ? 'bg-white/10 text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="inline-flex items-center gap-3">
              <Compass className="w-4 h-4" />
              <span>Explore Feed</span>
            </span>
            <span className="text-[11px] font-semibold tabular-nums text-white/50">
              {MOTION_TEMPLATES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarView('my-videos');
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer ${
              sidebarView === 'my-videos'
                ? 'bg-white/10 text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="inline-flex items-center gap-3">
              <FolderOpen className="w-4 h-4" />
              <span>My Videos</span>
            </span>
            <span className="text-[11px] font-semibold tabular-nums text-white/50">
              {visibleJobs.length}
            </span>
          </button>
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Create Tools
          </div>
          <div className="space-y-1">
            {navTools.map((tool) => {
              const Icon = tool.icon;
              const active = sidebarView === 'create' && mode === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    setMode(tool.id);
                    setSidebarView('create');
                    setErrorMsg(null);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#07f34b] text-[#111310] font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Credits & Google Account Dock */}
      <div className="p-3 border-t border-white/8 space-y-2.5">
        <div className="rounded-2xl bg-[#191b1f] border border-white/8 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white tabular-nums">
              <Zap className="w-3.5 h-3.5 text-[#07f34b]" />
              {credits} credits
            </span>
            <span className="text-[11px] text-white/55 uppercase">
              {profile?.planId || 'Free'}
            </span>
          </div>
          <a
            href="/pricing"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/pricing');
              }
            }}
            className="block w-full text-center py-1.5 rounded-xl bg-white/8 hover:bg-white/14 text-[12px] font-semibold text-white transition-colors"
          >
            Upgrade Plan
          </a>
        </div>

        {user ? (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-[#191b1f] border border-white/8">
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.photoUrl || user.photoURL ? (
                <img
                  src={profile?.photoUrl || user.photoURL || ''}
                  alt={profile?.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#07f34b] text-[#111310] font-bold text-[12px] flex items-center justify-center shrink-0">
                  {(profile?.displayName || 'V')[0]}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white truncate">
                  {profile?.displayName || 'Creator'}
                </div>
                <div className="text-[11px] text-white/45 truncate">
                  {profile?.email || user.email}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Sign out"
              onClick={() => void logOut()}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={signingIn}
              onClick={() => void signInWithGoogle()}
              className="w-full py-2.5 px-3 rounded-xl bg-white text-[#111310] hover:bg-white/90 text-[13px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
            {authError && (
              <p className="text-[11px] text-red-400 px-1">{authError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0b0b0c] text-[#f5f4f0]">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block w-[236px] shrink-0 h-full">
        {renderSidebarInner()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[260px] h-full">{renderSidebarInner()}</div>
          <button
            type="button"
            aria-label="Dismiss sidebar overlay"
            onClick={() => setMobileNavOpen(false)}
            className="flex-1 bg-black/60"
          />
        </div>
      )}

      {/* Main Dark Studio Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Studio Bar */}
        <header className="h-14 shrink-0 px-4 md:px-6 border-b border-white/8 bg-[#0b0b0c] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open studio navigation"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/8 text-white hover:bg-white/15"
            >
              <Menu className="w-4 h-4" />
            </button>

            <h1 className="text-[15px] font-semibold text-white whitespace-nowrap truncate">
              {sidebarView === 'explore'
                ? 'Explore Templates'
                : sidebarView === 'my-videos'
                ? 'My Videos'
                : isTextOnly
                ? 'Text to Video'
                : mode === 'multi-editor'
                ? 'Multi-Track Studio'
                : mode === 'pinoc'
                ? 'PINOC 3D Studio'
                : mode === 'live'
                ? 'Luancer Live'
                : 'Mix & Animate Studio'}
            </h1>

            {sidebarView === 'explore' && (
              <div className="hidden lg:flex items-center gap-1 ml-3">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      categoryFilter === cat
                        ? 'bg-white text-[#111310]'
                        : 'text-white/60 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {sidebarView === 'explore' && (
              <div className="hidden sm:flex items-center gap-2 bg-[#16171a] border border-white/10 rounded-xl px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-white/45" />
                <input
                  type="search"
                  aria-label="Search motion templates"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="bg-transparent text-[12px] text-white placeholder:text-white/40 outline-none w-40"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setSidebarView(sidebarView === 'my-videos' ? 'create' : 'my-videos')}
              className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/14 text-[12px] font-medium text-white whitespace-nowrap cursor-pointer"
            >
              {sidebarView === 'my-videos' ? 'Back to Stage' : `My Videos (${visibleJobs.length})`}
            </button>
          </div>
        </header>

        {/* Mobile / Tablet Explore Filter Strip */}
        {sidebarView === 'explore' && (
          <div className="lg:hidden shrink-0 px-4 py-2.5 border-b border-white/8 bg-[#0e0f11] flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-[#16171a] border border-white/10 rounded-xl px-3 py-1.5 sm:hidden">
              <Search className="w-3.5 h-3.5 text-white/45" />
              <input
                type="search"
                aria-label="Search motion templates mobile"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search all ${MOTION_TEMPLATES.length} Luancer templates...`}
                className="bg-transparent text-[12px] text-white placeholder:text-white/40 outline-none flex-1"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-white text-[#111310]'
                      : 'bg-white/6 text-white/70 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Stage / Feed Viewport */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-5 pb-40">
          {sidebarView === 'create' && (
            <div className="max-w-[1160px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Main Theater Stage */}
              <div className="xl:col-span-8 rounded-2xl bg-[#131417] border border-white/8 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">
                      {activeJob.characterName}
                    </div>
                    <div className="text-[12px] text-white/50 truncate">
                      {activeJob.aspectRatio || '16:9'} · {activeJob.model}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        activeJob.status === 'completed'
                          ? 'bg-[#07f34b]/15 text-[#07f34b]'
                          : activeJob.status === 'failed'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-400/20 text-amber-300'
                      }`}
                    >
                      {activeJob.status === 'completed' && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>
                        {activeJob.status === 'completed'
                          ? 'Ready'
                          : activeJob.status === 'failed'
                          ? 'Failed'
                          : 'Generating...'}
                      </span>
                    </span>
                    <a
                      href={activeJob.outputUrl}
                      download={`luancer-${activeJob.id}.${
                        activeJob.mediaType === 'video' ? 'mp4' : 'jpg'
                      }`}
                      className="px-3 py-1.5 rounded-xl bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[12px] font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export</span>
                    </a>
                  </div>
                </div>

                <div className="relative bg-[#09090b] flex items-center justify-center min-h-[360px] md:min-h-[430px] p-4">
                  <div
                    className={
                      activeJob.aspectRatio === '9:16'
                        ? 'w-full max-w-[260px] aspect-[9/16] rounded-xl overflow-hidden bg-black'
                        : 'w-full max-w-[740px] aspect-video rounded-xl overflow-hidden bg-black'
                    }
                  >
                    {activeJob.mediaType === 'video' ? (
                      <video
                        ref={videoRef}
                        key={activeJob.outputUrl}
                        src={activeJob.outputUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src={activeJob.outputUrl}
                        alt={activeJob.prompt}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {activeJob.status === 'rendering' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
                      <Loader2 className="w-8 h-8 text-[#07f34b] animate-spin mb-3" />
                      <div className="text-[16px] font-semibold text-white mb-1">
                        Rendering video with Gemini Omni 1.2 Flash...
                      </div>
                      <p className="text-[12px] text-white/60 max-w-sm">
                        Synthesizing {activeJob.aspectRatio || '16:9'} motion frames via the
                        Interactions API.
                      </p>
                    </div>
                  )}

                  {activeJob.status === 'failed' && (
                    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
                      <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                      <div className="text-[15px] font-semibold text-red-200 mb-1">
                        Video Generation Failed
                      </div>
                      <p className="text-[13px] text-white/75 max-w-md">
                        {activeJob.errorMessage || 'Unable to complete generation.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between gap-4">
                  <p className="text-[12px] text-white/60 truncate">{activeJob.prompt}</p>
                  {activeJob.mediaType === 'video' && (
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/18 text-[12px] font-medium text-white inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {playing ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>{playing ? 'Pause' : 'Play'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Quick Motion Templates + Recent Renders */}
              <div className="xl:col-span-4 space-y-4">
                <div className="rounded-2xl bg-[#131417] border border-white/8 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] font-semibold text-white">Trending Motions</h2>
                    <button
                      type="button"
                      onClick={() => setSidebarView('explore')}
                      className="text-[12px] text-[#07f34b] hover:underline cursor-pointer"
                    >
                      See all ({MOTION_TEMPLATES.length})
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {trendingTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyMotionTemplate(tpl)}
                        className={`group relative rounded-xl overflow-hidden aspect-[4/3] bg-black border text-left cursor-pointer ${
                          tpl.id === selectedTplId
                            ? 'border-[#07f34b]'
                            : 'border-white/8 hover:border-[#07f34b]'
                        }`}
                      >
                        {tpl.videoUrl ? (
                          <video
                            src={tpl.videoUrl}
                            poster={tpl.image}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <img
                            src={tpl.image}
                            alt={tpl.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-2">
                          <div className="text-[11px] font-semibold text-white truncate">
                            {tpl.name}
                          </div>
                          <div className="text-[10px] text-white/60">
                            {tpl.duration} · Remix
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#131417] border border-white/8 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] font-semibold text-white">
                      {user ? 'My Creations' : 'Recent Renders'} ({visibleJobs.length})
                    </h2>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {visibleJobs.map((job) => {
                      const isPersisted = persistedIds.has(job.id);
                      return (
                        <div
                          key={job.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                            job.id === activeJob.id
                              ? 'bg-white/10 border-[#07f34b]'
                              : 'bg-white/3 border-white/8 hover:bg-white/6'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveJobId(job.id)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            {job.mediaType === 'video' ? (
                              <video
                                src={job.outputUrl}
                                muted
                                playsInline
                                className="w-11 h-11 rounded-lg object-cover shrink-0 bg-black"
                              />
                            ) : (
                              <img
                                src={job.outputUrl}
                                alt={job.characterName}
                                className="w-11 h-11 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] font-semibold text-white truncate">
                                {job.characterName}
                              </div>
                              <div className="text-[11px] text-white/50 truncate">
                                {job.aspectRatio || '16:9'} · {job.mode}
                              </div>
                            </div>
                          </button>
                          {user && isPersisted && (
                            <button
                              type="button"
                              aria-label={`Delete creation ${job.characterName}`}
                              onClick={() => void deletePersistedCreation(job.id)}
                              className="p-1.5 rounded-lg text-white/45 hover:text-red-400 hover:bg-white/10 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {sidebarView === 'explore' && (
            <div className="max-w-[1200px] mx-auto space-y-4">
              <div className="flex items-center justify-between text-[12px] text-white/55">
                <span>
                  Showing <strong className="text-white">{filteredTemplates.length}</strong> of{' '}
                  {MOTION_TEMPLATES.length} Luancer motion templates
                  {categoryFilter !== 'All' ? ` in ${categoryFilter}` : ''}
                </span>
                {(categoryFilter !== 'All' || searchQuery.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('All');
                      setSearchQuery('');
                    }}
                    className="text-[#07f34b] hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="rounded-2xl bg-[#131417] border border-white/8 p-10 text-center">
                  <p className="text-[15px] font-semibold text-white mb-1">
                    No templates match &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-[13px] text-white/55 mb-4">
                    Try another keyword or switch back to all categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('All');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#07f34b] text-[#111310] text-[13px] font-semibold cursor-pointer"
                  >
                    Show all templates
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((tpl) => {
                    const isSelected = tpl.id === selectedTplId;
                    return (
                      <div
                        key={tpl.id}
                        className={`group rounded-2xl bg-[#131417] border overflow-hidden transition-colors flex flex-col ${
                          isSelected
                            ? 'border-[#07f34b]'
                            : 'border-white/8 hover:border-white/25'
                        }`}
                      >
                        <div className="relative aspect-[3/4] bg-[#0d0e10] overflow-hidden">
                          {tpl.videoUrl ? (
                            <video
                              src={tpl.videoUrl}
                              poster={tpl.image}
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <img
                              src={tpl.image}
                              alt={tpl.name}
                              loading="lazy"
                              className={`w-full h-full group-hover:scale-105 transition-transform duration-300 ${
                                tpl.kind === 'classic' ? 'object-contain p-2 bg-[#16171a]' : 'object-cover object-top'
                              }`}
                            />
                          )}
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-medium text-white">
                            {tpl.aspect}
                          </div>
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-medium text-white tabular-nums">
                            {tpl.duration}
                          </div>
                        </div>
                        <div className="p-3.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-white truncate">
                              {tpl.name}
                            </div>
                            <div className="text-[12px] text-white/50 truncate">
                              {tpl.creator} · {tpl.category}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyMotionTemplate(tpl)}
                            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold shrink-0 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-white text-[#111310] hover:bg-white/90'
                                : 'bg-[#07f34b] hover:bg-[#00d83d] text-[#111310]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Use Template'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {sidebarView === 'my-videos' && (
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleJobs.map((job) => {
                const isPersisted = persistedIds.has(job.id);
                return (
                  <div
                    key={job.id}
                    className="rounded-2xl bg-[#131417] border border-white/8 overflow-hidden flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveJobId(job.id);
                        setSidebarView('create');
                      }}
                      className="relative aspect-video bg-black overflow-hidden cursor-pointer text-left"
                    >
                      {job.mediaType === 'video' ? (
                        <video
                          src={job.outputUrl}
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={job.outputUrl}
                          alt={job.characterName}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-medium text-white">
                        {job.aspectRatio || '16:9'}
                      </div>
                    </button>
                    <div className="p-3.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-white truncate">
                          {job.characterName}
                        </div>
                        <div className="text-[12px] text-white/50 truncate">{job.prompt}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={job.outputUrl}
                          download={`luancer-${job.id}.${
                            job.mediaType === 'video' ? 'mp4' : 'jpg'
                          }`}
                          aria-label={`Download ${job.characterName}`}
                          className="p-2 rounded-xl bg-white/8 hover:bg-white/15 text-white"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {user && isPersisted && (
                          <button
                            type="button"
                            aria-label={`Delete creation ${job.characterName}`}
                            onClick={() => void deletePersistedCreation(job.id)}
                            className="p-2 rounded-xl bg-white/8 hover:bg-red-500/20 text-white/70 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Floating Viggle Composer Dock */}
        <div className="shrink-0 px-4 md:px-6 pb-4 pt-2 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c] to-transparent relative">
          {/* Character Quick Picker Popover */}
          {charPickerOpen && !isTextOnly && (
            <div className="max-w-[980px] mx-auto mb-3 rounded-2xl bg-[#1a1b1f] border border-white/12 p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold text-white">
                  Choose or Upload Character Photo
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07f34b] text-[#111310] text-[12px] font-semibold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Close character picker"
                    onClick={() => setCharPickerOpen(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                {characters.slice(0, 6).map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    aria-label={`Select character ${char.name}`}
                    onClick={() => {
                      setSelectedCharId(char.id);
                      setCharPickerOpen(false);
                    }}
                    className={`rounded-xl overflow-hidden border-2 aspect-square cursor-pointer transition-all ${
                      char.id === selectedCharId
                        ? 'border-[#07f34b]'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={char.image}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Motion Template Library Quick Picker Popover */}
          {tplPickerOpen && !isTextOnly && (
            <div className="max-w-[1160px] mx-auto mb-3 rounded-2xl bg-[#1a1b1f] border border-white/12 p-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-white">
                    Luancer Motion Templates ({filteredTemplates.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#0e0f11] border border-white/10 rounded-xl px-2.5 py-1">
                    <Search className="w-3.5 h-3.5 text-white/45" />
                    <input
                      type="search"
                      aria-label="Filter motion presets"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter presets..."
                      className="bg-transparent text-[12px] text-white placeholder:text-white/40 outline-none w-32 sm:w-44"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Close motion preset picker"
                    onClick={() => setTplPickerOpen(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2.5 border-b border-white/8">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#07f34b] text-[#111310]'
                        : 'bg-white/6 text-white/70 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-white/60">
                  <span>No presets match &ldquo;{searchQuery}&rdquo;. </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('All');
                      setSearchQuery('');
                    }}
                    className="text-[#07f34b] font-semibold hover:underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
                  {filteredTemplates.map((tpl) => {
                    const isActive = tpl.id === selectedTplId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => applyMotionTemplate(tpl)}
                        className={`group flex items-center gap-2.5 p-2 rounded-xl border text-left cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#07f34b]/15 border-[#07f34b] text-white'
                            : 'bg-[#121316] border-white/8 text-white/80 hover:border-white/25 hover:bg-white/8'
                        }`}
                      >
                        <img
                          src={tpl.image}
                          alt={tpl.name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold truncate">{tpl.name}</div>
                          <div className="text-[10px] text-white/50 truncate">
                            {tpl.category} · {tpl.duration} · {tpl.aspect}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            aria-label="Upload photo"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoUpload}
            className="sr-only"
          />

          <div className="max-w-[1160px] mx-auto rounded-[22px] bg-[#16171a] border border-white/12 p-3 shadow-2xl space-y-2.5">
            {errorMsg && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/35 px-3 py-2 text-[12px] font-medium text-red-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
              {/* Input Slots (Character + Motion) when animating image */}
              {!isTextOnly && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 bg-[#0e0f11] border border-white/10 rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCharPickerOpen(!charPickerOpen);
                        setTplPickerOpen(false);
                      }}
                      className="flex items-center gap-2 pr-1 cursor-pointer"
                      title={`Character: ${selectedChar.name}`}
                    >
                      <img
                        src={selectedChar.image}
                        alt={selectedChar.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div className="text-left hidden sm:block max-w-[92px]">
                        <div className="text-[10px] text-white/45 leading-tight">Character</div>
                        <div className="text-[12px] font-semibold text-white truncate">
                          {selectedChar.name}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label="Upload photo"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg bg-white/8 hover:bg-white/16 text-white cursor-pointer"
                      title="Upload photo"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={`Motion template: ${selectedTpl.name}`}
                    onClick={() => {
                      const nextOpen = !tplPickerOpen;
                      if (nextOpen) {
                        setCategoryFilter('All');
                        setSearchQuery('');
                      }
                      setTplPickerOpen(nextOpen);
                      setCharPickerOpen(false);
                    }}
                    className="flex items-center gap-2 bg-[#0e0f11] border border-white/10 hover:border-[#07f34b]/60 rounded-xl px-2.5 py-1.5 text-left cursor-pointer max-w-[180px]"
                  >
                    <img
                      src={selectedTpl.image}
                      alt={selectedTpl.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] text-[#07f34b] font-medium leading-tight">
                        Motion ({MOTION_TEMPLATES.length})
                      </div>
                      <div className="text-[12px] font-semibold text-white truncate">
                        {selectedTpl.name}
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Prompt Input */}
              <div className="flex-1 min-w-[180px]">
                <label htmlFor="studio-prompt" className="sr-only">
                  {isTextOnly ? '2. Text Prompt (Required)' : 'Animation / Motion Prompt'}
                </label>
                <input
                  id="studio-prompt"
                  type="text"
                  maxLength={1000}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    isTextOnly
                      ? 'Describe your video scene, lighting, and camera motion...'
                      : 'Optional motion prompt...'
                  }
                  className="w-full h-11 rounded-xl bg-[#0e0f11] border border-white/10 focus:border-[#07f34b] px-3.5 text-[13px] text-white placeholder:text-white/45 outline-none"
                />
              </div>

              {/* Aspect Ratio + Generate CTA */}
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 shrink-0">
                <div className="inline-flex rounded-xl bg-[#0e0f11] border border-white/10 p-0.5">
                  {[
                    { id: '16:9' as const, label: '16:9' },
                    { id: '9:16' as const, label: '9:16' },
                  ].map((ratio) => {
                    const active = aspectRatio === ratio.id;
                    return (
                      <button
                        key={ratio.id}
                        type="button"
                        aria-label={ratio.id === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                        aria-pressed={active}
                        onClick={() => setAspectRatio(ratio.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors ${
                          active
                            ? 'bg-white text-[#111310]'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {ratio.label}
                      </button>
                    );
                  })}
                </div>

                <select
                  aria-label="Video Engine"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="rounded-xl bg-[#0e0f11] border border-white/10 px-2.5 py-2 text-[12px] font-medium text-white outline-none"
                >
                  <option value="gemini-omni-1.2-flash">Omni 1.2 Flash</option>
                  <option value="JST-2 + Omni">JST-2 + Omni</option>
                </select>

                <button
                  type="button"
                  aria-pressed={hd}
                  onClick={() => setHd(!hd)}
                  className={`px-2.5 py-2 rounded-xl border text-[12px] font-semibold cursor-pointer ${
                    hd
                      ? 'bg-white/14 border-white/25 text-white'
                      : 'bg-[#0e0f11] border-white/10 text-white/60'
                  }`}
                >
                  {hd ? 'HD' : 'SD'}
                </button>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => void handleGenerate()}
                  className="px-4 py-2.5 rounded-xl bg-[#07f34b] hover:bg-[#00d83d] disabled:opacity-60 text-[#111310] text-[13px] font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isTextOnly ? 'Generate Video' : 'Generate'} ({cost})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
