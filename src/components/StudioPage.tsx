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
  Radio,
  Search,
  Sparkles,
  Trash2,
  Type,
  X,
  Zap,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import {
  ASSETS,
  MOTION_TEMPLATES,
  STUDIO_CHARACTERS,
  type MotionTemplate,
} from '../data/viggleData';
import { getTemplate4kVideoUrl } from '../utils/templateMedia';
import {
  buildMixGenerationPrompt,
  calculateJobCredits,
  filterMotionTemplates,
  TEMPLATE_CATEGORIES,
  type MixBackgroundMode,
  type StudioJob,
  type StudioResolutionTier,
} from '../utils/viggleLogic';
import {
  validateVideoRequestPayload,
  type VideoAspectRatio,
} from '../utils/videoValidation';
import { ViggleLogo } from './ViggleLogo';
import { TemplateMediaPreview } from './TemplateMediaPreview';
import {
  MixStudioPanel,
  type CharacterOption,
  type CustomMotionClip,
} from './MixStudioPanel';

interface StudioPageProps {
  initialMode?: StudioJob['mode'];
  initialTemplateId?: string;
  initialView?: SidebarView;
  onNavigate?: (path: string) => void;
}

type SidebarView = 'create' | 'explore' | 'my-videos';
type StageCompareMode = 'output' | 'split';

const DEFAULT_SHOWCASE_TPL =
  MOTION_TEMPLATES.find((t) => t.id === 'tpl-kitchen-dance-routine') ??
  MOTION_TEMPLATES.find((t) => Boolean(t.videoUrl)) ??
  MOTION_TEMPLATES[0];

const INITIAL_GALLERY: StudioJob[] = [
  {
    id: 'seed-1',
    mode: 'image-to-video',
    characterName: DEFAULT_SHOWCASE_TPL.name,
    templateName: DEFAULT_SHOWCASE_TPL.name,
    prompt: DEFAULT_SHOWCASE_TPL.prompt,
    model: 'JST-2 + Omni',
    aspectRatio: DEFAULT_SHOWCASE_TPL.aspect,
    status: 'completed',
    progress: 100,
    creditsUsed: 0,
    createdAt: '2026-11-24T09:40:00.000Z',
    mediaType: DEFAULT_SHOWCASE_TPL.videoUrl ? 'video' : 'image',
    outputUrl:
      getTemplate4kVideoUrl(DEFAULT_SHOWCASE_TPL.id, DEFAULT_SHOWCASE_TPL.videoUrl) ??
      DEFAULT_SHOWCASE_TPL.image,
  },
  {
    id: 'seed-2',
    mode: 'pinoc',
    characterName: 'Nova (Astronaut)',
    templateName: '3D World Walk-Around',
    prompt: 'Starship command deck overlooking cosmic nebula',
    model: 'JST-2 + Omni',
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
    : DEFAULT_SHOWCASE_TPL;

  const [sidebarView, setSidebarView] = useState<SidebarView>(initialView || 'create');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mode, setMode] = useState<StudioJob['mode']>(initialMode);
  const [characters, setCharacters] = useState<CharacterOption[]>(STUDIO_CHARACTERS);
  const [selectedCharId, setSelectedCharId] = useState(STUDIO_CHARACTERS[0].id);
  const [selectedSecondCharId, setSelectedSecondCharId] = useState(STUDIO_CHARACTERS[1].id);
  const [selectedTplId, setSelectedTplId] = useState(
    initialMatchedTpl?.id ?? DEFAULT_SHOWCASE_TPL.id
  );
  const [customMotion, setCustomMotion] = useState<CustomMotionClip | null>(null);
  const [tplBrowserOpen, setTplBrowserOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Viggle Mix settings
  const [bgMode, setBgMode] = useState<MixBackgroundMode>('template');
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [characterRefine, setCharacterRefine] = useState(true);
  const [lipSync, setLipSync] = useState(true);
  const [footLock, setFootLock] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(
    initialMatchedTpl?.aspect ?? '9:16'
  );
  const [prompt, setPrompt] = useState(initialMatchedTpl?.prompt ?? '');
  const [model, setModel] = useState('JST-2 + Omni');
  const [resolutionTier, setResolutionTier] = useState<StudioResolutionTier>('4k');
  const [stageCompare, setStageCompare] = useState<StageCompareMode>('output');

  // Live webcam mocap state
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  const [guestCredits, setGuestCredits] = useState(80);
  const [sessionJobs, setSessionJobs] = useState<StudioJob[]>(() => {
    if (initialTemplateId && initialMatchedTpl) {
      return [
        {
          id: `preview-${initialMatchedTpl.id}`,
          mode: initialMode,
          characterName: initialMatchedTpl.name,
          templateName: initialMatchedTpl.name,
          prompt: initialMatchedTpl.prompt,
          model: 'JST-2 + Omni',
          aspectRatio: initialMatchedTpl.aspect,
          status: 'completed',
          progress: 100,
          creditsUsed: 0,
          createdAt: new Date().toISOString(),
          mediaType: initialMatchedTpl.videoUrl ? 'video' : 'image',
          outputUrl:
            getTemplate4kVideoUrl(initialMatchedTpl.id, initialMatchedTpl.videoUrl) ??
            initialMatchedTpl.image,
        },
        ...INITIAL_GALLERY.filter((j) => j.id !== 'seed-1'),
      ];
    }
    return INITIAL_GALLERY;
  });
  const [activeJobId, setActiveJobId] = useState<string>(() =>
    initialTemplateId && initialMatchedTpl
      ? `preview-${initialMatchedTpl.id}`
      : INITIAL_GALLERY[0].id
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (customMotion?.videoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(customMotion.videoUrl);
      }
    };
  }, [customMotion]);

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const handleToggleWebcam = async () => {
    if (webcamActive) {
      stopWebcam();
      return;
    }
    setWebcamError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setWebcamError('Webcam access is unavailable in this browser context.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      webcamStreamRef.current = stream;
      setWebcamActive(true);
      requestAnimationFrame(() => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
        }
      });
    } catch {
      setWebcamError('Camera permission denied or no webcam device found.');
    }
  };

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
  const selectedSecondChar =
    characters.find((c) => c.id === selectedSecondCharId) ?? characters[1] ?? characters[0];
  const selectedTpl = MOTION_TEMPLATES.find((t) => t.id === selectedTplId) ?? DEFAULT_SHOWCASE_TPL;
  const activeJob = visibleJobs.find((j) => j.id === activeJobId) ?? visibleJobs[0];
  const hd = resolutionTier !== '720p';
  const cost = calculateJobCredits(mode, model, hd);
  const isTextOnly = mode === 'text-to-video';

  const filteredTemplates = filterMotionTemplates(MOTION_TEMPLATES, categoryFilter, searchQuery);
  const trendingTemplates = MOTION_TEMPLATES.filter((t) => t.popular && t.videoUrl).slice(0, 4);

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'primary' | 'secondary' = 'primary'
  ) => {
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
      if (target === 'secondary') {
        setSelectedSecondCharId(id);
      } else {
        setSelectedCharId(id);
      }
      setErrorMsg(null);
      if (isTextOnly) {
        setMode('image-to-video');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMotionVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customMotion?.videoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(customMotion.videoUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'Custom Motion';

    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const dur = Number.isFinite(probe.duration) ? Math.round(probe.duration) : 8;
      const mins = Math.floor(dur / 60);
      const secs = String(dur % 60).padStart(2, '0');
      setCustomMotion({ name: cleanName, videoUrl: objectUrl, durationLabel: `${mins}:${secs}` });
    };
    probe.onerror = () => {
      setCustomMotion({ name: cleanName, videoUrl: objectUrl, durationLabel: '0:08' });
    };
    probe.src = objectUrl;

    const previewId = `preview-custom-${Date.now()}`;
    setSessionJobs((prev) => [
      {
        id: previewId,
        mode,
        characterName: `${selectedChar.name} × ${cleanName}`,
        templateName: cleanName,
        prompt: prompt || `Custom motion transfer from ${cleanName}`,
        model,
        aspectRatio,
        status: 'completed',
        progress: 100,
        creditsUsed: 0,
        createdAt: new Date().toISOString(),
        mediaType: 'video',
        outputUrl: objectUrl,
      },
      ...prev.filter((j) => !j.id.startsWith('preview-')),
    ]);
    setActiveJobId(previewId);
    setPlaying(true);
    setErrorMsg(null);
    e.target.value = '';
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) {
        setCustomBgImage(dataUrl);
        setBgMode('custom');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
    setCustomMotion(null);
    setSelectedTplId(tpl.id);
    setPrompt(tpl.prompt);
    setAspectRatio(tpl.aspect);
    setMode((prev) => (prev === 'text-to-video' ? 'image-to-video' : prev));
    const previewId = `preview-${tpl.id}`;
    const resolvedOutputUrl = tpl.videoUrl
      ? getTemplate4kVideoUrl(tpl.id, tpl.videoUrl) ?? tpl.image
      : tpl.image;
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
          outputUrl: resolvedOutputUrl,
        },
        ...rest,
      ];
    });
    setActiveJobId(previewId);
    setPlaying(true);
    setTplBrowserOpen(false);
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
    setTplBrowserOpen(false);
    const apiMode = isTextOnly ? 'text-to-video' : 'image-to-video';
    const effectivePrompt = buildMixGenerationPrompt({
      basePrompt: prompt,
      templateName: customMotion?.name || selectedTpl.name,
      templateCategory: customMotion ? 'Custom Motion' : selectedTpl.category,
      bgMode,
      characterRefine,
      lipSync,
      footLock,
      isTextOnly,
      secondCharacterName: mode === 'multi-editor' ? selectedSecondChar.name : undefined,
    });

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
        : customMotion?.name || selectedTpl.name,
      prompt: validation.data.prompt,
      model,
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
          model,
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
  }> = [
    { id: 'image-to-video', label: 'Mix / Animate', icon: ImagePlus },
    { id: 'multi-editor', label: 'Multi-Track', icon: Layers },
    { id: 'text-to-video', label: 'Text to Video', icon: Type },
    { id: 'pinoc', label: 'PINOC 3D', icon: Box },
    { id: 'live', label: 'Luancer Live', icon: Radio },
  ];

  const resolutionLabel =
    resolutionTier === '4k' ? '4K UHD' : resolutionTier === '1080p' ? '1080p HD' : '720p SD';

  const stageBgClass =
    bgMode === 'green'
      ? 'bg-[#00b140]/20 ring-2 ring-[#00ff41]/55'
      : bgMode === 'white'
      ? 'bg-white ring-1 ring-white/30'
      : 'bg-[#09090b]';

  const activeMotionPreviewUrl =
    customMotion?.videoUrl || getTemplate4kVideoUrl(selectedTpl.id, selectedTpl.videoUrl);

  const renderSidebarInner = () => (
    <div className="flex flex-col h-full bg-[#111214] text-[#f5f4f0] border-r border-white/8 select-none">
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
          className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSidebarView('explore');
              setMobileNavOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
              sidebarView === 'explore'
                ? 'bg-white/10 text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="inline-flex items-center gap-2.5">
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
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
              sidebarView === 'my-videos'
                ? 'bg-white/10 text-white'
                : 'text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="inline-flex items-center gap-2.5">
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
              const active =
                sidebarView === 'create' &&
                (mode === tool.id || (tool.id === 'image-to-video' && mode === 'mix'));
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    if (tool.id !== 'live' && webcamActive) stopWebcam();
                    setMode(tool.id);
                    setSidebarView('create');
                    setErrorMsg(null);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
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
                  {(profile?.displayName || 'L')[0]}
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
            {authError && <p className="text-[11px] text-red-400 px-1">{authError}</p>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0b0b0c] text-[#f5f4f0]">
      {/* Persistent Desktop/Tablet Sidebar */}
      <aside className="hidden md:block w-[220px] lg:w-[236px] shrink-0 h-full">
        {renderSidebarInner()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-[260px] h-full">{renderSidebarInner()}</div>
          <button
            type="button"
            aria-label="Dismiss sidebar overlay"
            onClick={() => setMobileNavOpen(false)}
            className="flex-1 bg-black/60"
          />
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Studio Bar */}
        <header className="h-14 shrink-0 px-4 md:px-6 border-b border-white/8 bg-[#0b0b0c] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open studio navigation"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/8 text-white hover:bg-white/15"
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
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {sidebarView === 'explore' && (
              <div className="hidden sm:flex items-center gap-2 bg-[#16171a] border border-white/10 rounded-xl px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-white/45" />
                <input
                  type="search"
                  aria-label="Search motion templates"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search all ${MOTION_TEMPLATES.length} templates...`}
                  className="bg-transparent text-[12px] text-white placeholder:text-white/40 outline-none w-44 lg:w-52"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setSidebarView(sidebarView === 'explore' ? 'create' : 'explore')
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/14 text-[12px] font-medium text-white whitespace-nowrap cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#07f34b]" />
              <span>
                {sidebarView === 'explore'
                  ? 'Back to Mix'
                  : `Explore Feed (${MOTION_TEMPLATES.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSidebarView(sidebarView === 'my-videos' ? 'create' : 'my-videos')
              }
              className="px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/14 text-[12px] font-medium text-white whitespace-nowrap cursor-pointer"
            >
              {sidebarView === 'my-videos'
                ? 'Back to Stage'
                : `My Videos (${visibleJobs.length})`}
            </button>
          </div>
        </header>

        {/* Explore Category Strip */}
        {sidebarView === 'explore' && (
          <div className="shrink-0 px-4 md:px-6 py-2.5 border-b border-white/8 bg-[#0e0f11] flex flex-col gap-2">
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
                  className={`px-3.5 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-white text-[#111310]'
                      : 'bg-white/6 text-white/70 hover:text-white hover:bg-white/12'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Studio Viewport */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
          {sidebarView === 'create' && (
            <div className="max-w-[1340px] mx-auto space-y-4">
              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/35 px-3.5 py-2.5 text-[12px] font-medium text-red-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Viggle.ai Dual-Pane Mix Workspace: Left Controls + Right Cinema Stage */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Mix Composer Column (Never clips on any screen) */}
                <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 min-w-0">
                  <MixStudioPanel
                    mode={mode}
                    isTextOnly={isTextOnly}
                    characters={characters}
                    selectedChar={selectedChar}
                    selectedSecondChar={selectedSecondChar}
                    onSelectChar={setSelectedCharId}
                    onSelectSecondChar={setSelectedSecondCharId}
                    onUploadCharFile={handlePhotoUpload}
                    selectedTpl={selectedTpl}
                    templateCount={MOTION_TEMPLATES.length}
                    customMotion={customMotion}
                    onUploadMotionFile={handleMotionVideoUpload}
                    onClearCustomMotion={() => setCustomMotion(null)}
                    onOpenTemplateBrowser={() => {
                      setCategoryFilter('All');
                      setSearchQuery('');
                      setTplBrowserOpen(true);
                    }}
                    bgMode={bgMode}
                    onChangeBgMode={setBgMode}
                    customBgImage={customBgImage}
                    onUploadCustomBg={handleCustomBgUpload}
                    characterRefine={characterRefine}
                    onToggleCharacterRefine={() => setCharacterRefine((v) => !v)}
                    lipSync={lipSync}
                    onToggleLipSync={() => setLipSync((v) => !v)}
                    footLock={footLock}
                    onToggleFootLock={() => setFootLock((v) => !v)}
                    prompt={prompt}
                    onChangePrompt={setPrompt}
                    aspectRatio={aspectRatio}
                    onChangeAspectRatio={setAspectRatio}
                    model={model}
                    onChangeModel={setModel}
                    resolutionTier={resolutionTier}
                    onChangeResolutionTier={setResolutionTier}
                    cost={cost}
                    isGenerating={isGenerating}
                    onGenerate={() => void handleGenerate()}
                    webcamActive={webcamActive}
                    webcamError={webcamError}
                    onToggleWebcam={() => void handleToggleWebcam()}
                    webcamVideoRef={webcamVideoRef}
                  />
                </div>

                {/* Right Cinema Stage + Trending Motions + Recent Renders */}
                <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-4 min-w-0">
                  <div className="rounded-2xl bg-[#131417] border border-white/10 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-white truncate">
                          {activeJob.characterName}
                        </div>
                        <div className="text-[12px] text-white/50 truncate">
                          {activeJob.aspectRatio || aspectRatio} · {activeJob.model} · {resolutionLabel}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {!isTextOnly && (
                          <div className="inline-flex rounded-lg bg-[#0e0f11] border border-white/10 p-0.5">
                            <button
                              type="button"
                              onClick={() => setStageCompare('output')}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                                stageCompare === 'output'
                                  ? 'bg-white text-[#111310]'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              Result
                            </button>
                            <button
                              type="button"
                              onClick={() => setStageCompare('split')}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                                stageCompare === 'split'
                                  ? 'bg-white text-[#111310]'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              Compare Inputs
                            </button>
                          </div>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            activeJob.status === 'completed'
                              ? 'bg-[#07f34b]/15 text-[#07f34b]'
                              : activeJob.status === 'failed'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-400/20 text-amber-300'
                          }`}
                        >
                          {activeJob.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
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

                    {/* Stage Viewport */}
                    <div
                      className={`relative flex items-center justify-center min-h-[340px] md:min-h-[430px] p-4 ${
                        bgMode === 'custom' && customBgImage ? 'bg-[#09090b]' : stageBgClass
                      }`}
                      style={
                        bgMode === 'custom' && customBgImage
                          ? {
                              backgroundImage: `url(${customBgImage})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                          : undefined
                      }
                    >
                      {stageCompare === 'split' && !isTextOnly ? (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                          <div className="rounded-xl bg-black/75 border border-white/12 p-2 flex flex-col">
                            <div className="text-[11px] font-semibold text-white/70 mb-1.5">
                              Character
                            </div>
                            <div className="flex-1 min-h-[180px] rounded-lg overflow-hidden bg-black">
                              <img
                                src={selectedChar.image}
                                alt={selectedChar.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          <div className="rounded-xl bg-black/75 border border-white/12 p-2 flex flex-col">
                            <div className="text-[11px] font-semibold text-white/70 mb-1.5">
                              Motion Reference (4K)
                            </div>
                            <div className="flex-1 min-h-[180px] rounded-lg overflow-hidden bg-black">
                              {activeMotionPreviewUrl ? (
                                <video
                                  key={activeMotionPreviewUrl}
                                  src={activeMotionPreviewUrl}
                                  poster={customMotion ? undefined : selectedTpl.image}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <img
                                  src={selectedTpl.image}
                                  alt={selectedTpl.name}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl bg-black/75 border border-[#07f34b]/40 p-2 flex flex-col">
                            <div className="text-[11px] font-semibold text-[#07f34b] mb-1.5">
                              Output Preview
                            </div>
                            <div className="flex-1 min-h-[180px] rounded-lg overflow-hidden bg-black">
                              {activeJob.mediaType === 'video' ? (
                                <video
                                  key={activeJob.outputUrl}
                                  src={activeJob.outputUrl}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
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
                          </div>
                        </div>
                      ) : (
                        <div
                          className={
                            activeJob.aspectRatio === '9:16'
                              ? 'w-full max-w-[270px] aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10'
                              : 'w-full max-w-[740px] aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10'
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
                              muted
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
                      )}

                      {activeJob.status === 'rendering' && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
                          <Loader2 className="w-8 h-8 text-[#07f34b] animate-spin mb-3" />
                          <div className="text-[16px] font-semibold text-white mb-1">
                            Rendering {resolutionLabel} video with {model}...
                          </div>
                          <p className="text-[12px] text-white/60 max-w-sm">
                            Applying {bgMode === 'green' ? 'green screen matte' : `${bgMode} scene`}, character motion, and {activeJob.aspectRatio || aspectRatio} framing.
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
                          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{playing ? 'Pause' : 'Play'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Trending Motions & Recent Renders */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[#131417] border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[13px] font-semibold text-white">
                          Trending Mix Motions (4K)
                        </h2>
                        <button
                          type="button"
                          onClick={() => setSidebarView('explore')}
                          className="text-[12px] text-[#07f34b] hover:underline cursor-pointer"
                        >
                          See all ({MOTION_TEMPLATES.length})
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {trendingTemplates.map((tpl) => {
                          const src4k = getTemplate4kVideoUrl(tpl.id, tpl.videoUrl);
                          return (
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
                              {src4k ? (
                                <video
                                  src={src4k}
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
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#131417] border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[13px] font-semibold text-white">
                          {user ? 'My Creations' : 'Recent Renders'} ({visibleJobs.length})
                        </h2>
                      </div>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
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
              </div>
            </div>
          )}

          {sidebarView === 'explore' && (
            <div className="max-w-[1200px] mx-auto space-y-4">
              <div className="flex items-center justify-between text-[12px] text-white/55">
                <span>
                  Showing <strong className="text-white">{filteredTemplates.length}</strong> of{' '}
                  {MOTION_TEMPLATES.length} Luancer motion templates (4K UHD)
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5">
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
                          <TemplateMediaPreview template={tpl} />
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-medium text-white">
                            {tpl.aspect}
                          </div>
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[11px] font-medium text-white tabular-nums">
                            {tpl.duration}
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-white truncate">
                              {tpl.name}
                            </div>
                            <div className="text-[11px] text-white/50 truncate mt-0.5">
                              {tpl.creator} · {tpl.category}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => applyMotionTemplate(tpl)}
                            className={`w-full py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer transition-colors ${
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
      </div>

      {/* Motion Template Picker Modal Overlay */}
      {tplBrowserOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Motion Template Picker"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-[920px] max-h-[85vh] rounded-2xl bg-[#16171b] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/8 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[15px] font-semibold text-white">
                Select Motion Template ({filteredTemplates.length})
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#0e0f11] border border-white/10 rounded-xl px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-white/45" />
                  <input
                    type="search"
                    aria-label="Filter motion presets"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter presets..."
                    className="bg-transparent text-[12px] text-white placeholder:text-white/40 outline-none w-44"
                  />
                </div>
                <button
                  type="button"
                  aria-label="Close motion preset picker"
                  onClick={() => setTplBrowserOpen(false)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 py-2.5 border-b border-white/8 flex items-center gap-1.5 overflow-x-auto">
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

            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTemplates.map((tpl) => {
                const isActive = tpl.id === selectedTplId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyMotionTemplate(tpl)}
                    className={`group flex flex-col rounded-xl overflow-hidden border text-left cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#07f34b]/15 border-[#07f34b] text-white'
                        : 'bg-[#111216] border-white/8 text-white/85 hover:border-white/25'
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-black overflow-hidden">
                      <TemplateMediaPreview template={tpl} />
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-medium text-white">
                        {tpl.duration}
                      </span>
                    </div>
                    <div className="p-2.5 min-w-0">
                      <div className="text-[12px] font-semibold truncate">{tpl.name}</div>
                      <div className="text-[10px] text-white/50 truncate">
                        {tpl.category} · {tpl.aspect}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
