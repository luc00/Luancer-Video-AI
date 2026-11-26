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
const GIF_EXPORT_CACHE_DIR = path.join(os.tmpdir(), 'luancer-gif-exports');
fs.mkdirSync(VIDEO_DIR, { recursive: true });
fs.mkdirSync(TEMPLATE_4K_CACHE_DIR, { recursive: true });
fs.mkdirSync(GIF_EXPORT_CACHE_DIR, { recursive: true });

interface TemplateSourceEntry {
  videoUrl: string;
  priority?: boolean;
}

const TEMPLATE_SOURCES_PATH = path.resolve(process.cwd(), 'src/data/templateSources.json');
const templateSources: Record<string, TemplateSourceEntry> = fs.existsSync(TEMPLATE_SOURCES_PATH)
  ? (JSON.parse(fs.readFileSync(TEMPLATE_SOURCES_PATH, 'utf8')) as Record<string, TemplateSourceEntry>)
  : {};
const inFlight4kJobs = new Map<string, Promise<string>>();

function streamFileWithRanges(
  req: express.Request,
  res: express.Response,
  filePath: string,
  contentType: string,
  cacheHeader: string,
  downloadFilename?: string
) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const extraHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheHeader,
    ...(downloadFilename ? { 'Content-Disposition': `attachment; filename="${downloadFilename}"` } : {}),
  };

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(fileSize - 1, parseInt(parts[1], 10)) : fileSize - 1;
    if (Number.isNaN(start) || start < 0 || start >= fileSize || end < start) {
      return res.status(416).end();
    }
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      ...extraHeaders,
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunkSize,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    ...extraHeaders,
    'Content-Length': fileSize,
  });
  fs.createReadStream(filePath).pipe(res);
}

function streamMp4WithRanges(
  req: express.Request,
  res: express.Response,
  filePath: string,
  cacheHeader: string,
  downloadFilename?: string
) {
  streamFileWithRanges(req, res, filePath, 'video/mp4', cacheHeader, downloadFilename);
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

async function resolveExportSource(
  rawSource: string
): Promise<{ filePath: string; isImage: boolean; cacheKey: string }> {
  const cleanSource = rawSource.split('?')[0].trim();

  const vidMatch = /^\/api\/videos\/file\/([a-zA-Z0-9_-]{4,128})$/.exec(cleanSource);
  if (vidMatch) {
    const p = path.join(VIDEO_DIR, `${vidMatch[1]}.mp4`);
    if (!fs.existsSync(p)) throw new Error('Generated video file not found or expired.');
    return { filePath: p, isImage: false, cacheKey: `vid-${vidMatch[1]}` };
  }

  const tpl4kMatch = /^\/api\/templates\/4k\/([a-z0-9-]{2,128})\.mp4$/i.exec(cleanSource);
  if (tpl4kMatch) {
    const templateId = tpl4kMatch[1];
    const entry = templateSources[templateId];
    if (!entry?.videoUrl) throw new Error('Template motion source not found.');
    const p = await ensure4kTemplateVideo(templateId, entry.videoUrl);
    return { filePath: p, isImage: false, cacheKey: `tpl-${templateId}` };
  }

  const localTplMatch = /^\/assets\/viggle-templates\/([a-zA-Z0-9._-]{3,160})$/.exec(cleanSource);
  if (localTplMatch) {
    const filename = localTplMatch[1];
    const pubPath = path.resolve(process.cwd(), 'public/assets/viggle-templates', filename);
    const distPath = path.resolve(process.cwd(), 'dist/assets/viggle-templates', filename);
    const resolved = fs.existsSync(pubPath) ? pubPath : distPath;
    if (!fs.existsSync(resolved)) throw new Error('Template asset file not found.');
    const isImage = /\.(webp|png|jpe?g)$/i.test(filename);
    return {
      filePath: resolved,
      isImage,
      cacheKey: `asset-${crypto.createHash('sha1').update(filename).digest('hex').slice(0, 12)}`,
    };
  }

  const localImgMatch = /^\/src\/assets\/images\/([a-zA-Z0-9._-]{3,160})$/.exec(cleanSource);
  if (localImgMatch) {
    const filename = localImgMatch[1];
    const imgPath = path.resolve(process.cwd(), 'src/assets/images', filename);
    if (!fs.existsSync(imgPath)) throw new Error('Scene image file not found.');
    return {
      filePath: imgPath,
      isImage: true,
      cacheKey: `img-${crypto.createHash('sha1').update(filename).digest('hex').slice(0, 12)}`,
    };
  }

  throw new Error('Unsupported or invalid export source path.');
}

async function transcodeToExportFormat(
  inputPath: string,
  isImage: boolean,
  format: 'mp4' | 'gif',
  outPath: string
): Promise<void> {
  const tmpOut = `${outPath}.tmp.${process.pid}.${Date.now()}.${format}`;
  try {
    if (format === 'gif') {
      const inputArgs = isImage ? ['-y', '-loop', '1', '-t', '2.5', '-i', inputPath] : ['-y', '-i', inputPath, '-t', '5'];
      await execFileAsync(
        'ffmpeg',
        [
          ...inputArgs,
          '-vf',
          "fps=12,scale='min(420,iw)':-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
          '-loop',
          '0',
          tmpOut,
        ],
        { maxBuffer: 1024 * 1024 * 16 }
      );
    } else {
      const inputArgs = isImage ? ['-y', '-loop', '1', '-t', '3', '-i', inputPath] : ['-y', '-i', inputPath];
      await execFileAsync(
        'ffmpeg',
        [
          ...inputArgs,
          '-vf',
          "scale='trunc(iw/2)*2':'trunc(ih/2)*2'",
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-crf',
          '23',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          '-an',
          tmpOut,
        ],
        { maxBuffer: 1024 * 1024 * 16 }
      );
    }
    fs.renameSync(tmpOut, outPath);
  } finally {
    if (fs.existsSync(tmpOut)) {
      fs.rmSync(tmpOut, { force: true });
    }
  }
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
        { timeout: 300000, maxRetries: 0 }
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

  app.get('/api/export/motion', async (req, res) => {
    const formatRaw = String(req.query.format || 'mp4').toLowerCase();
    const format: 'mp4' | 'gif' = formatRaw === 'gif' ? 'gif' : 'mp4';
    const sourceRaw = String(req.query.source || '');
    const rawName = String(req.query.name || 'luancer-motion');
    const safeName =
      rawName
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64) || 'luancer-motion';
    const downloadFilename = `${safeName}.${format}`;

    try {
      const { filePath, isImage, cacheKey } = await resolveExportSource(sourceRaw);
      if (format === 'mp4' && !isImage) {
        return streamMp4WithRanges(req, res, filePath, 'public, max-age=3600', downloadFilename);
      }

      const cachedExportPath = path.join(GIF_EXPORT_CACHE_DIR, `${cacheKey}.${format}`);
      if (!fs.existsSync(cachedExportPath) || fs.statSync(cachedExportPath).size < 1000) {
        await transcodeToExportFormat(filePath, isImage, format, cachedExportPath);
      }

      return streamFileWithRanges(
        req,
        res,
        cachedExportPath,
        format === 'gif' ? 'image/gif' : 'video/mp4',
        'public, max-age=3600',
        downloadFilename
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to export motion file.';
      console.error('[api/export/motion]', msg);
      return res.status(400).json({ error: msg });
    }
  });

  app.post(
    '/api/export/motion-blob',
    express.raw({ type: ['video/*', 'image/*', 'application/octet-stream'], limit: '48mb' }),
    async (req, res) => {
      const formatRaw = String(req.query.format || 'gif').toLowerCase();
      const format: 'mp4' | 'gif' = formatRaw === 'mp4' ? 'mp4' : 'gif';
      const rawName = String(req.query.name || 'luancer-custom');
      const safeName =
        rawName
          .toLowerCase()
          .replace(/[^a-z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 64) || 'luancer-custom';
      const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (bodyBuffer.length < 32) {
        return res.status(400).json({ error: 'Empty media payload for export.' });
      }

      const contentType = String(req.headers['content-type'] || '').toLowerCase();
      const isImage = contentType.startsWith('image/');
      const ext = contentType.includes('webm')
        ? '.webm'
        : contentType.includes('quicktime')
        ? '.mov'
        : contentType.includes('png')
        ? '.png'
        : contentType.includes('webp')
        ? '.webp'
        : isImage
        ? '.jpg'
        : '.mp4';

      const stamp = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const inPath = path.join(GIF_EXPORT_CACHE_DIR, `_blob_in_${stamp}${ext}`);
      const outPath = path.join(GIF_EXPORT_CACHE_DIR, `_blob_out_${stamp}.${format}`);
      try {
        fs.writeFileSync(inPath, bodyBuffer);
        await transcodeToExportFormat(inPath, isImage, format, outPath);
        const bytes = fs.readFileSync(outPath);
        res.writeHead(200, {
          'Content-Type': format === 'gif' ? 'image/gif' : 'video/mp4',
          'Content-Length': bytes.length,
          'Content-Disposition': `attachment; filename="${safeName}.${format}"`,
          'Cache-Control': 'no-store',
        });
        return res.end(bytes);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to convert uploaded motion.';
        console.error('[api/export/motion-blob]', msg);
        return res.status(500).json({ error: msg });
      } finally {
        if (fs.existsSync(inPath)) fs.rmSync(inPath, { force: true });
        if (fs.existsSync(outPath)) fs.rmSync(outPath, { force: true });
      }
    }
  );

  app.post('/api/videos/composite', async (req, res) => {
    const body = (req.body || {}) as {
      templateId?: string;
      aspectRatio?: string;
      bgMode?: string;
      resolutionTier?: string;
      characterImageBase64?: string;
      characterMimeType?: string;
    };

    const aspectRatio = body.aspectRatio === '9:16' ? '9:16' : '16:9';
    const bgMode = ['template', 'green', 'white', 'custom'].includes(String(body.bgMode))
      ? String(body.bgMode)
      : 'template';
    const targetH = body.resolutionTier === '720p' ? 720 : 1080;
    const outW = aspectRatio === '9:16' ? (targetH === 720 ? 720 : 1080) : targetH === 720 ? 1280 : 1920;
    const outH = aspectRatio === '9:16' ? (targetH === 720 ? 1280 : 1920) : targetH;
    const bgHex = bgMode === 'green' ? '0x00b140' : bgMode === 'white' ? '0xffffff' : '0x0d0e11';

    const templateId =
      typeof body.templateId === 'string' && /^[a-z0-9-]{2,128}$/i.test(body.templateId)
        ? body.templateId
        : '';

    const videoId = `vid_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const targetPath = path.join(VIDEO_DIR, `${videoId}.mp4`);
    let tempCharPath = '';

    try {
      let motionInputPath = '';
      if (templateId && templateSources[templateId]?.videoUrl) {
        motionInputPath = await ensure4kTemplateVideo(templateId, templateSources[templateId].videoUrl);
      }

      if (typeof body.characterImageBase64 === 'string' && body.characterImageBase64.length > 32) {
        const cleaned = body.characterImageBase64.replace(/^data:[^;]+;base64,/, '');
        const ext = body.characterMimeType === 'image/png' ? '.png' : body.characterMimeType === 'image/webp' ? '.webp' : '.jpg';
        tempCharPath = path.join(VIDEO_DIR, `_char_${videoId}${ext}`);
        fs.writeFileSync(tempCharPath, Buffer.from(cleaned, 'base64'));
      }

      if (motionInputPath && tempCharPath) {
        const pipSize = Math.round(Math.min(outW, outH) * 0.24);
        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            motionInputPath,
            '-loop',
            '1',
            '-i',
            tempCharPath,
            '-filter_complex',
            `[0:v]scale=${outW}:${outH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:${bgHex}[base];[1:v]scale=${pipSize}:${pipSize}:force_original_aspect_ratio=increase,crop=${pipSize}:${pipSize}[pip];[base][pip]overlay=28:28:shortest=1`,
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            '24',
            '-pix_fmt',
            'yuv420p',
            '-movflags',
            '+faststart',
            '-an',
            targetPath,
          ],
          { maxBuffer: 1024 * 1024 * 16 }
        );
      } else if (motionInputPath) {
        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            motionInputPath,
            '-vf',
            `scale=${outW}:${outH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:${bgHex}`,
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            '24',
            '-pix_fmt',
            'yuv420p',
            '-movflags',
            '+faststart',
            '-an',
            targetPath,
          ],
          { maxBuffer: 1024 * 1024 * 16 }
        );
      } else if (tempCharPath) {
        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-loop',
            '1',
            '-t',
            '3',
            '-i',
            tempCharPath,
            '-vf',
            `scale=${outW}:${outH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:${bgHex}`,
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            '24',
            '-pix_fmt',
            'yuv420p',
            '-movflags',
            '+faststart',
            '-an',
            targetPath,
          ],
          { maxBuffer: 1024 * 1024 * 16 }
        );
      } else {
        return res.status(400).json({ error: 'Provide a motion template or character image to composite.' });
      }

      return res.json({
        videoId,
        videoUrl: `/api/videos/file/${videoId}`,
        mimeType: 'video/mp4',
        engine: 'local-ffmpeg-compositor',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to composite motion video.';
      console.error('[api/videos/composite]', msg);
      return res.status(500).json({ error: msg });
    } finally {
      if (tempCharPath && fs.existsSync(tempCharPath)) {
        fs.rmSync(tempCharPath, { force: true });
      }
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
