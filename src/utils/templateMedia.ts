export function compute4kDimensions(srcWidth: number, srcHeight: number): {
  width: number;
  height: number;
} {
  const safeW = Math.max(2, Math.round(srcWidth));
  const safeH = Math.max(2, Math.round(srcHeight));
  const toEven = (n: number) => Math.max(2, Math.round(n / 2) * 2);

  if (safeW === safeH) {
    return { width: 2160, height: 2160 };
  }

  if (safeW > safeH) {
    // Fit proportionally into 3840x2160 (16:9 -> 3840x2160, 4:3 -> 2880x2160)
    const scale = Math.min(3840 / safeW, 2160 / safeH);
    const width = toEven(Math.min(3840, Math.round(safeW * scale)));
    const height = toEven(Math.min(2160, Math.round(safeH * scale)));
    return { width, height };
  }

  // Portrait: fit proportionally into 2160x3840 (9:16 -> 2160x3840, 3:4 -> 2160x2880)
  const scale = Math.min(2160 / safeW, 3840 / safeH);
  const width = toEven(Math.min(2160, Math.round(safeW * scale)));
  const height = toEven(Math.min(3840, Math.round(safeH * scale)));
  return { width, height };
}

export function getTemplate4kVideoUrl(templateId?: string, fallbackUrl?: string): string | undefined {
  if (templateId) {
    return `/api/templates/4k/${encodeURIComponent(templateId)}.mp4`;
  }
  return fallbackUrl;
}
