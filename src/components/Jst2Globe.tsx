import { useEffect, useRef } from 'react';

export function Jst2Globe({ theme }: { theme: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;
    let angle = 0.35;
    let isVisible = false;
    let lastTick = 0;

    const size = 440;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const drawFrame = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const r = 180;
      const lineStroke = theme === 'dark' ? 'rgba(245, 244, 240, 0.25)' : 'rgba(41, 35, 30, 0.25)';
      const nodeFill = theme === 'dark' ? 'rgba(245, 244, 240, 0.85)' : 'rgba(41, 35, 30, 0.85)';

      ctx.strokeStyle = lineStroke;
      ctx.lineWidth = 1;

      const latSteps = 7;
      const lonSteps = 10;
      const tilt = 0.24;

      const project = (lat: number, lon: number) => {
        const x0 = Math.cos(lat) * Math.sin(lon + angle);
        const y0 = Math.sin(lat);
        const z0 = Math.cos(lat) * Math.cos(lon + angle);

        const y1 = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
        const z1 = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);

        return {
          x: cx + x0 * r,
          y: cy - y1 * r,
          z: z1,
        };
      };

      for (let i = 1; i < latSteps; i++) {
        const lat = -Math.PI / 2 + (i / latSteps) * Math.PI;
        ctx.beginPath();
        for (let j = 0; j <= 36; j++) {
          const lon = (j / 36) * Math.PI * 2;
          const p = project(lat, lon);
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      for (let j = 0; j < lonSteps; j++) {
        const lon = (j / lonSteps) * Math.PI * 2;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const lat = -Math.PI / 2 + (i / 24) * Math.PI;
          const p = project(lat, lon);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      for (let i = 1; i < latSteps; i++) {
        const lat = -Math.PI / 2 + (i / latSteps) * Math.PI;
        for (let j = 0; j < lonSteps; j++) {
          const lon = (j / lonSteps) * Math.PI * 2;
          const p = project(lat, lon);
          if (p.z > -0.15) {
            ctx.fillStyle = nodeFill;
            ctx.globalAlpha = Math.max(0.15, (p.z + 1) / 2);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (ts: number) => {
      if (!isVisible || prefersReducedMotion) return;
      if (ts - lastTick >= 33) {
        lastTick = ts;
        angle += 0.006;
        drawFrame();
      }
      rafId = requestAnimationFrame(tick);
    };

    drawFrame();

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting);
        cancelAnimationFrame(rafId);
        if (isVisible && !prefersReducedMotion) {
          rafId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="jst2-globe"
      aria-label="Interactive JST-2 3D spatial wireframe globe"
      className="w-[340px] h-[340px] md:w-[460px] md:h-[460px] mx-auto select-none pointer-events-none"
    />
  );
}
