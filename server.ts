import 'dotenv/config';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { compute4kDimensions } from './src/utils/templateMedia.ts';
import { validateVideoRequestPayload } from './src/utils/videoValidation.ts';

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.PORT) || 3000;
const VIDEO_DIR = path.join(os.tmpdir(), 'viggle-videos');
const TEMPLATE_4K_CACHE_DIR = path.join(os.tmpdir(), 'luancer-4k-templates');
fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(TEMPLATE_4K_CACHE_DIR, { recursive: true });

interface TemplateSourceEntry {
  videoUrl: string;
  priority?: boolean;
}

const TEMPLATE_SOURCES_PATH = path.resolve(process.cwd(), 'src/data/templateSources.json');
const templateSources: Record<string, TemplateSourceEntry> = fs.existsSync(TEMPLATE_SOURCES_PATH)
  ? (JSON.parse(fs.readFileSync(TEMPLATE_SOURCES_PATH, 'utf8')) as Record<string, TemplateSourceEntry>)
  : {};
const inFlight4kJobs = new Map<string, Promise<string>>();

function streamMp4WithRanges(req: express.Request, res: express.Response, filePath: string, cacheHeader: string) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(fileSize - 1, parseInt(parts[1], 10)) : fileSize - 1;
    if (Number.isNaN(start) || start < 0 || start >= fileSize || end < start) {
      return res.status(416).end();
    }
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
      'Cache-Control': cacheHeader,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Length': fileSize,
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheHeader,
  });
  fs.createReadStream(filePath).pipe(res);
}

async function ensure4kTemplateVideo(templateId: string, sourceUrl: string): Promise<string> {
  const staticCandidates = [
    path.resolve(process.cwd(), 'public/assets/viggle-4k', `${templateId}.mp4`),
    path.resolve(process.cwd(), 'dist/assets/viggle-4k', `${templateId}.mp4`),
  ];
  for (const candidate of staticCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 20000) {
      return candidate;
    }
  }

  const cachedPath = path.join(TEMPLATE_4K_CACHE_DIR, `${templateId}.mp4`);
  if (fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 20000) {
    return cachedPath;
  }

  const existingPromise = inFlight4kJobs.get(templateId);
  if (existingPromise) {
    return existingPromise;
  }

  const jobPromise = (async () => {
    let inputPath = '';
    let tempDownloadPath = '';

    if (sourceUrl.startsWith('/')) {
      const cleanRel = sourceUrl.replace(/^\/+/, '');
      const localPublic = path.resolve(process.cwd(), 'public', cleanRel);
      const localDist = path.resolve(process.cwd(), 'dist', cleanRel);
      inputPath = fs.existsSync(localPublic) ? localPublic : localDist;
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Missing local template source for ${templateId}`);
      }
    } else if (/^https:\/\/assets\.viggle\.ai\//i.test(sourceUrl)) {
      tempDownloadPath = path.join(TEMPLATE_4K_CACHE_DIR, `_src_${templateId}_${Date.now()}.mp4`);
      const upstream = await fetch(sourceUrl);
      if (!upstream.ok) {
        throw new Error(`Failed to fetch template source (${upstream.status})`);
      }
      fs.writeFileSync(tempDownloadPath, Buffer.from(await upstream.arrayBuffer()));
      inputPath = tempDownloadPath;
    } else {
      throw new Error(`Unsupported source URL for ${templateId}`);
    }

    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height',
        '-of',
        'csv=p=0',
        inputPath,
      ]);
      const [rawW, rawH] = stdout.trim().split(',').map(Number);
      const { width, height } = compute4kDimensions(rawW || 1080, rawH || 1920);
      const tmpOut = path.join(TEMPLATE_4K_CACHE_DIR, `_tmp_${templateId}_${Date.now()}.mp4`);

      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-i',
          inputPath,
          '-vf',
          `scale=${width}:${height}:flags=lanczos,unsharp=5:5:0.45:5:5:0.0`,
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-crf',
          '26',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-an',
          tmpOut,
        ],
        { maxBuffer: 1024 * 1024 * 16 }
      );
      fs.renameSync(tmpOut, cachedPath);
      return cachedPath;
    } finally {
      if (tempDownloadPath && fs.existsSync(tempDownloadPath)) {
        fs.rmSync(tempDownloadPath, { force: true });
      }
    }
  })().finally(() => {
    inFlight4kJobs.delete(templateId);
  });

  inFlight4kJobs.set(templateId, jobPromise);
  return jobPromise;
}

interface VideoOutputPart {
  data?: string;
  uri?: string;
  mime_type?: string;
}

interface InteractionStepLike {
  type?: string;
  content?: Array<{
    type?: string;
    data?: string;
    uri?: string;
    mime_type?: string;
  }>;
}

function extractVideoOutput(interaction: {
  output_video?: VideoOutputPart | null;
  steps?: InteractionStepLike[];
}): VideoOutputPart | null {
  if (interaction.output_video && (interaction.output_video.data || interaction.output_video.uri)) {
    return interaction.output_video;
  }
  if (Array.isArray(interaction.steps)) {
    for (let i = interaction.steps.length - 1; i >= 0; i -= 1) {
      const step = interaction.steps[i];
      if (step?.type === 'model_output' && Array.isArray(step.content)) {
        const videoContent = step.content.find(
          (item) => item?.type === 'video' && (item.data || item.uri)
        );
        if (videoContent) {
          return {
            data: videoContent.data,
            uri: videoContent.uri,
            mime_type: videoContent.mime_type,
          };
        }
      }
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/videos/generate', async (req, res) => {
    const validation = validateVideoRequestPayload(req.body || {});
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        error:
          'A paid GEMINI_API_KEY server secret is required to generate videos with gemini-omni-1.2-flash.',
      });
    }

    const payload = validation.data;

    try {
      const ai = new GoogleGenAI({ apiKey });

      const interactionInput =
        payload.mode === 'image-to-video'
          ? [
              {
                type: 'image' as const,
                mime_type: payload.imageMimeType || 'image/jpeg',
                data: payload.imageBase64 || '',
              },
              {
                type: 'text' as const,
                text: payload.prompt,
              },
            ]
          : payload.prompt;

      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          input: interactionInput,
          background: false,
          store: false,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: payload.aspectRatio,
            ...(payload.mode === 'text-to-video'
              ? { duration: '10s', resolution: '720p' }
              : {}),
          },
        } as Parameters<typeof ai.interactions.create>[0],
        { timeout: 300000 }
      );

      const videoPart = extractVideoOutput(
        interaction as {
          output_video?: VideoOutputPart | null;
          steps?: InteractionStepLike[];
        }
      );

      if (!videoPart) {
        return res.status(502).json({
          error: 'gemini-omni-1.2-flash completed without returning video output.',
        });
      }

      const videoId = `vid_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      const targetPath = path.join(VIDEO_DIR, `${videoId}.mp4`);

      if (videoPart.data) {
        const videoBuffer = Buffer.from(videoPart.data, 'base64');
        fs.writeFileSync(targetPath, videoBuffer);
      } else if (videoPart.uri) {
        const fileRes = await fetch(videoPart.uri, {
          headers: { 'x-goog-api-key': apiKey },
        });
        if (!fileRes.ok) {
          return res.status(502).json({
            error: `Failed to fetch generated video artifact (${fileRes.status}).`,
          });
        }
        const arrayBuf = await fileRes.arrayBuffer();
        fs.writeFileSync(targetPath, Buffer.from(arrayBuf));
      }

      return res.json({
        videoId,
        videoUrl: `/api/videos/file/${videoId}`,
        mimeType: videoPart.mime_type || 'video/mp4',
        interactionId:
          typeof (interaction as { id?: string }).id === 'string'
            ? (interaction as { id?: string }).id
            : '',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unexpected error while generating video with gemini-omni-1.2-flash.';
      const status =
        typeof (err as { status?: number })?.status === 'number' &&
        (err as { status: number }).status >= 400 &&
        (err as { status: number }).status < 600
          ? (err as { status: number }).status
          : 502;
      console.error('[api/videos/generate]', message);
      return res.status(status).json({ error: message });
    }
  });

  app.get('/api/videos/file/:videoId', (req, res) => {
    const videoId = req.params.videoId || '';
    if (!/^[a-zA-Z0-9_-]{4,128}$/.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video identifier.' });
    }
    const filePath = path.join(VIDEO_DIR, `${videoId}.mp4`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Generated video not found or expired.' });
    }

    streamMp4WithRanges(req, res, filePath, 'private, max-age=3600');
  });

  app.get('/api/templates/4k/:filename', async (req, res) => {
    const filename = req.params.filename || '';
    const match = /^([a-z0-9-]{2,128})\.mp4$/i.exec(filename);
    if (!match) {
      return res.status(400).json({ error: 'Invalid template video filename.' });
    }
    const templateId = match[1];
    const entry = templateSources[templateId];
    if (!entry?.videoUrl) {
      return res.status(404).json({ error: 'Template video source not found.' });
    }
    try {
      const readyPath = await ensure4kTemplateVideo(templateId, entry.videoUrl);
      return streamMp4WithRanges(req, res, readyPath, 'public, max-age=86400');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to prepare 4K template video.';
      console.error(`[api/templates/4k/${templateId}]`, msg);
      return res.status(502).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.info(`Luancer full-stack server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
