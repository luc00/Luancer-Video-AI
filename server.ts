import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { validateVideoRequestPayload } from './src/utils/videoValidation.ts';

const PORT = Number(process.env.PORT) || 3000;
const VIDEO_DIR = path.join(os.tmpdir(), 'viggle-videos');
fs.mkdirSync(VIDEO_DIR, { recursive: true });

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

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (Number.isNaN(start) || start >= fileSize) {
        return res.status(416).end();
      }
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
    });
    fs.createReadStream(filePath).pipe(res);
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
    console.info(`Viggle full-stack server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
