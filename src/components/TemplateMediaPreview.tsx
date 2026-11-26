import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import type { MotionTemplate } from '../data/viggleData';
import { getTemplate4kVideoUrl } from '../utils/templateMedia';

interface TemplateMediaPreviewProps {
  template: MotionTemplate;
  className?: string;
  autoPlay?: boolean;
}

export function TemplateMediaPreview({
  template,
  className = '',
  autoPlay = false,
}: TemplateMediaPreviewProps) {
  const [active, setActive] = useState(false);
  const [useFallbackSrc, setUseFallbackSrc] = useState(false);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const primary4kSrc = template.videoUrl
    ? getTemplate4kVideoUrl(template.id, template.videoUrl)
    : undefined;
  const videoSrc = useFallbackSrc ? template.videoUrl : primary4kSrc;
  const shouldPlayVideo = Boolean(videoSrc && (autoPlay || active));

  useEffect(() => {
    if (shouldPlayVideo && videoElRef.current) {
      void videoElRef.current.play().catch(() => {});
    }
  }, [shouldPlayVideo, videoSrc]);

  const imgFitClass =
    template.kind === 'classic'
      ? 'object-contain p-2 bg-[#16171a]'
      : template.aspect === '9:16'
      ? 'object-cover object-top'
      : 'object-cover object-center';

  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={`relative w-full h-full bg-[#0d0e10] overflow-hidden ${className}`}
    >
      <img
        src={template.image}
        alt={template.name}
        loading="lazy"
        decoding="async"
        className={`w-full h-full group-hover:scale-105 transition-transform duration-300 ${imgFitClass}`}
      />
      {shouldPlayVideo && (
        <video
          ref={videoElRef}
          src={videoSrc}
          poster={template.image}
          autoPlay
          loop
          muted
          playsInline
          preload={autoPlay ? 'auto' : 'metadata'}
          onCanPlay={(e) => {
            const v = e.currentTarget;
            v.muted = true;
            if (shouldPlayVideo && v.paused) void v.play().catch(() => {});
          }}
          onError={() => {
            if (!useFallbackSrc && template.videoUrl && videoSrc !== template.videoUrl) {
              setUseFallbackSrc(true);
            }
          }}
          className={`absolute inset-0 w-full h-full ${
            template.aspect === '9:16' ? 'object-cover object-top' : 'object-cover object-center'
          }`}
        />
      )}
      {videoSrc && !shouldPlayVideo && (
        <span
          aria-hidden="true"
          className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-85 group-hover:opacity-0 transition-opacity"
        >
          <Play className="w-3 h-3 fill-current ml-0.5" />
        </span>
      )}
    </div>
  );
}

