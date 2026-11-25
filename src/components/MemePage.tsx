import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Film,
  ImagePlus,
  Search,
  Sparkles,
  Type,
} from 'lucide-react';
import {
  CLASSIC_MEME_TEMPLATES,
  MOVING_TEMPLATES,
  type MotionTemplate,
} from '../data/viggleData';
import { TemplateMediaPreview } from './TemplateMediaPreview';

const MOVING_CATEGORIES = [
  'All',
  'Memes',
  'Dance',
  'Action',
  'Sports',
  'Rap / Music',
  '3D Worlds',
  'VFX & Swap',
] as const;

interface MemePageProps {
  onNavigate: (path: string) => void;
}

export function MemePage({ onNavigate }: MemePageProps) {
  const [selectedClassic, setSelectedClassic] = useState<MotionTemplate>(
    CLASSIC_MEME_TEMPLATES[0]
  );
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [topText, setTopText] = useState('Top text');
  const [bottomText, setBottomText] = useState('Bottom text');
  const [fontSize, setFontSize] = useState(34);
  const [classicSearch, setClassicSearch] = useState('');
  const [movingCategory, setMovingCategory] = useState<string>('All');
  const [movingSearch, setMovingSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const activeImageUrl = customImageUrl ?? selectedClassic.image;

  const filteredClassics = CLASSIC_MEME_TEMPLATES.filter((t) => {
    const q = classicSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const filteredMoving = MOVING_TEMPLATES.filter((t) => {
    if (movingCategory !== 'All' && t.category !== movingCategory) return false;
    const q = movingSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.creator.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const w = 640;
      const h = Math.max(420, Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * w));
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.16));
      ctx.font = `900 ${fontSize}px Impact, "Arial Black", sans-serif`;

      const drawCaption = (text: string, y: number) => {
        const clean = text.trim();
        if (!clean) return;
        ctx.strokeText(clean, w / 2, y, w - 40);
        ctx.fillText(clean, w / 2, y, w - 40);
      };

      drawCaption(topText, fontSize + 18);
      drawCaption(bottomText, h - 22);

      // Subtle watermark inside canvas matching editor preview
      ctx.font = '600 13px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.lineWidth = 3;
      ctx.strokeText('luancer.ai', w - 12, h - 10);
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText('luancer.ai', w - 12, h - 10);
    };
    img.src = activeImageUrl;
    return () => {
      cancelled = true;
    };
  }, [activeImageUrl, topText, bottomText, fontSize]);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) setCustomImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `luancer-${selectedClassic.id}.png`;
    a.click();
  };

  const handleCopyMeme = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !navigator.clipboard) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pt-28 pb-24 px-6 md:px-14 max-w-[1280px] mx-auto">
      {/* Page Hero */}
      <div className="mb-10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-2">
          Luancer Meme Maker · {CLASSIC_MEME_TEMPLATES.length + MOVING_TEMPLATES.length} Templates
        </p>
        <h1 className="text-[clamp(2.25rem,4.5vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.03em] mb-3">
          Meme generator
        </h1>
        <p className="text-[17px] text-[#6b645c] dark:text-[#a39c93] max-w-[660px]">
          Pick a classic meme, a moving video template, or your own image. Add captions to export instantly or send straight to Studio to animate any character.
        </p>
      </div>

      {/* Interactive Meme Editor Card */}
      <section className="rounded-[28px] bg-[#f3f2ed] dark:bg-[#171614] border border-black/6 dark:border-white/10 p-6 md:p-8 mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Live Canvas Preview */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              aria-label={`Meme preview: ${selectedClassic.name}`}
              className="max-w-full max-h-[480px] rounded-2xl shadow-lg border border-black/10 dark:border-white/10 bg-[#111214]"
            />
          </div>

          {/* Caption Controls & Export */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="text-[13px] font-semibold text-[#6b645c] dark:text-[#a39c93] mb-1">
                Active template
              </div>
              <div className="text-[20px] font-semibold">
                {customImageUrl ? 'Custom Uploaded Image' : selectedClassic.name}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="meme-top-text" className="block text-[12px] font-semibold mb-1.5">
                  Top text
                </label>
                <input
                  id="meme-top-text"
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0e0d0c] border border-black/10 dark:border-white/12 text-[14px] outline-none focus:border-[#07f34b]"
                />
              </div>

              <div>
                <label htmlFor="meme-bottom-text" className="block text-[12px] font-semibold mb-1.5">
                  Bottom text
                </label>
                <input
                  id="meme-bottom-text"
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#0e0d0c] border border-black/10 dark:border-white/12 text-[14px] outline-none focus:border-[#07f34b]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="inline-flex items-center gap-2">
                <Type className="w-4 h-4 text-[#6b645c] dark:text-[#a39c93]" />
                <span className="text-[13px] font-medium">Text size ({fontSize}px)</span>
                <button
                  type="button"
                  aria-label="Smaller text"
                  onClick={() => setFontSize((s) => Math.max(18, s - 4))}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0e0d0c] border border-black/10 dark:border-white/12 text-[13px] font-semibold cursor-pointer"
                >
                  A-
                </button>
                <button
                  type="button"
                  aria-label="Bigger text"
                  onClick={() => setFontSize((s) => Math.min(58, s + 4))}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0e0d0c] border border-black/10 dark:border-white/12 text-[13px] font-semibold cursor-pointer"
                >
                  A+
                </button>
              </div>

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUploadImage}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#0e0d0c] border border-black/10 dark:border-white/12 text-[13px] font-semibold hover:border-[#07f34b] cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Upload image</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadMeme}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111310] text-white dark:bg-white dark:text-[#111310] text-[14px] font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download meme</span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopyMeme()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-black/15 dark:border-white/20 text-[14px] font-medium cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#00a830]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy image'}</span>
              </button>
            </div>

            <div className="rounded-2xl bg-[#fcfcfc] dark:bg-[#0e0d0c] border border-black/6 dark:border-white/10 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold">Put your character in it</div>
                <p className="text-[12px] text-[#6b645c] dark:text-[#a39c93]">
                  Animate this meme in Studio with JST-2 & Omni 1.2 Flash.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(`/studio/mix?template=${selectedClassic.id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] text-[13px] font-semibold cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Make it a video</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Moving & Video Templates (all exported Luancer templates) */}
      <section className="mb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#00a830] dark:text-[#07f34b] mb-1">
              <Film className="w-3.5 h-3.5" />
              <span>Moving &amp; Video Templates ({MOVING_TEMPLATES.length})</span>
            </div>
            <h2 className="text-[28px] md:text-[34px] font-medium tracking-[-0.02em]">
              Trending motion templates
            </h2>
            <p className="text-[14px] text-[#6b645c] dark:text-[#a39c93]">
              Drop your photo into viral dances, VFX character swaps, 3D worlds, sports mocap, and reaction loops. Hover any card to preview motion.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#f3f2ed] dark:bg-[#171614] border border-black/8 dark:border-white/10 rounded-xl px-3.5 py-2">
            <Search className="w-4 h-4 text-[#6b645c] dark:text-[#a39c93]" />
            <input
              type="search"
              aria-label="Search moving templates"
              value={movingSearch}
              onChange={(e) => setMovingSearch(e.target.value)}
              placeholder={`Search ${MOVING_TEMPLATES.length} motion templates...`}
              className="bg-transparent text-[13px] outline-none w-52"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5">
          {MOVING_CATEGORIES.map((cat) => {
            const active = movingCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setMovingCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#111310] text-white dark:bg-[#07f34b] dark:text-[#111310]'
                    : 'bg-[#f3f2ed] dark:bg-[#171614] border border-black/8 dark:border-white/10 text-[#6b645c] dark:text-[#a39c93] hover:text-[#111310] dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMoving.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onNavigate(`/studio/mix?template=${tpl.id}`)}
              className="group text-left rounded-2xl bg-[#f3f2ed] dark:bg-[#171614] border border-black/6 dark:border-white/10 overflow-hidden hover:border-[#07f34b] transition-colors cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[3/4] bg-black overflow-hidden">
                <TemplateMediaPreview template={tpl} />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-semibold">
                  {tpl.category}
                </span>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-semibold tabular-nums">
                  {tpl.duration}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="text-[13px] font-semibold leading-snug line-clamp-2">
                  {tpl.name}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#00a830] dark:text-[#07f34b]">
                  <span>Use in Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Classic Meme Templates (33 real static templates) */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[28px] md:text-[34px] font-medium tracking-[-0.02em]">
              Classic meme templates ({CLASSIC_MEME_TEMPLATES.length})
            </h2>
            <p className="text-[14px] text-[#6b645c] dark:text-[#a39c93]">
              Click any classic template to edit captions above or animate it inside Studio.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#f3f2ed] dark:bg-[#171614] border border-black/8 dark:border-white/10 rounded-xl px-3.5 py-2">
            <Search className="w-4 h-4 text-[#6b645c] dark:text-[#a39c93]" />
            <input
              type="search"
              aria-label="Search classic meme templates"
              value={classicSearch}
              onChange={(e) => setClassicSearch(e.target.value)}
              placeholder="Search classic memes..."
              className="bg-transparent text-[13px] outline-none w-48"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredClassics.map((tpl) => {
            const isSelected = !customImageUrl && selectedClassic.id === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setCustomImageUrl(null);
                  setSelectedClassic(tpl);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`group text-left rounded-2xl overflow-hidden border transition-colors cursor-pointer bg-[#f3f2ed] dark:bg-[#171614] ${
                  isSelected
                    ? 'border-[#07f34b] ring-2 ring-[#07f34b]/40'
                    : 'border-black/6 dark:border-white/10 hover:border-[#07f34b]'
                }`}
              >
                <div className="aspect-square bg-[#e9e7e0] dark:bg-[#0e0d0c] p-1.5 overflow-hidden">
                  <img
                    src={tpl.image}
                    alt={`${tpl.name} meme template`}
                    loading="lazy"
                    className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5">
                  <div className="text-[12px] font-semibold truncate">{tpl.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
