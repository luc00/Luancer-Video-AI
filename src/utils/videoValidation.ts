export type VideoGenerationMode = 'text-to-video' | 'image-to-video';
export type VideoAspectRatio = '16:9' | '9:16';

export const BLUEPRINT_LIMITS = {
  idMax: 128,
  idPattern: /^[a-zA-Z0-9_-]+$/,
  displayNameMax: 120,
  emailMax: 254,
  photoUrlMax: 500,
  titleMax: 120,
  promptMax: 1000,
  modelMax: 64,
  outputUrlMax: 500,
  interactionIdMax: 200,
  errorMessageMax: 400,
} as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export interface VideoGenerationInput {
  mode: VideoGenerationMode;
  prompt: string;
  aspectRatio: VideoAspectRatio;
  imageBase64?: string;
  imageMimeType?: string;
}

export function validateVideoRequestPayload(
  input: Partial<VideoGenerationInput>
): { valid: true; data: VideoGenerationInput } | { valid: false; error: string } {
  const mode = input.mode;
  if (mode !== 'text-to-video' && mode !== 'image-to-video') {
    return { valid: false, error: 'Unsupported generation mode. Use text-to-video or image-to-video.' };
  }

  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  if (!prompt) {
    return {
      valid: false,
      error:
        mode === 'text-to-video'
          ? 'Please enter a text prompt describing the video you want to generate.'
          : 'Please enter motion instructions describing how to animate the image.',
    };
  }

  if (prompt.length > BLUEPRINT_LIMITS.promptMax) {
    return {
      valid: false,
      error: `Prompt exceeds ${BLUEPRINT_LIMITS.promptMax} characters.`,
    };
  }

  const aspectRatio: VideoAspectRatio =
    input.aspectRatio === '9:16' ? '9:16' : '16:9';

  if (mode === 'image-to-video') {
    const rawBase64 = typeof input.imageBase64 === 'string' ? input.imageBase64.trim() : '';
    const cleanedBase64 = rawBase64.replace(/^data:[^;]+;base64,/, '');
    if (!cleanedBase64 || cleanedBase64.length < 16) {
      return {
        valid: false,
        error: 'Please upload or select a valid reference image to animate.',
      };
    }

    const mime = typeof input.imageMimeType === 'string' ? input.imageMimeType.trim().toLowerCase() : 'image/jpeg';
    const normalizedMime = mime === 'image/jpg' ? 'image/jpeg' : mime;
    if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(normalizedMime)) {
      return {
        valid: false,
        error: 'Unsupported image format. Please use PNG, JPEG, or WebP.',
      };
    }

    return {
      valid: true,
      data: {
        mode,
        prompt,
        aspectRatio,
        imageBase64: cleanedBase64,
        imageMimeType: normalizedMime,
      },
    };
  }

  return {
    valid: true,
    data: {
      mode,
      prompt,
      aspectRatio,
    },
  };
}

export function sanitizeCreationFields(input: {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  model: string;
  outputUrl: string;
  videoId?: string;
  interactionId?: string;
  errorMessage?: string;
}) {
  const safeId = input.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, BLUEPRINT_LIMITS.idMax) || `c_${Date.now()}`;
  const safeUserId = input.userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, BLUEPRINT_LIMITS.idMax);
  return {
    id: safeId,
    userId: safeUserId,
    title: input.title.trim().slice(0, BLUEPRINT_LIMITS.titleMax) || 'Luancer Video',
    prompt: input.prompt.trim().slice(0, BLUEPRINT_LIMITS.promptMax) || 'Generated video',
    model: input.model.trim().slice(0, BLUEPRINT_LIMITS.modelMax) || 'gemini-omni-1.2-flash',
    outputUrl: input.outputUrl.trim().slice(0, BLUEPRINT_LIMITS.outputUrlMax),
    ...(input.videoId ? { videoId: input.videoId.trim().slice(0, BLUEPRINT_LIMITS.idMax) } : {}),
    ...(input.interactionId
      ? { interactionId: input.interactionId.trim().slice(0, BLUEPRINT_LIMITS.interactionIdMax) }
      : {}),
    ...(input.errorMessage
      ? { errorMessage: input.errorMessage.trim().slice(0, BLUEPRINT_LIMITS.errorMessageMax) }
      : {}),
  };
}

export function sanitizeUserProfileFields(input: {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}) {
  const displayName =
    (input.displayName?.trim() || input.email?.split('@')[0] || 'Luancer Creator').slice(
      0,
      BLUEPRINT_LIMITS.displayNameMax
    );
  const email = (input.email?.trim() || 'creator@luancer.local').slice(0, BLUEPRINT_LIMITS.emailMax);
  const photoUrl = input.photoURL?.trim().slice(0, BLUEPRINT_LIMITS.photoUrlMax);
  return {
    uid: input.uid.slice(0, BLUEPRINT_LIMITS.idMax),
    displayName,
    email,
    ...(photoUrl ? { photoUrl } : {}),
  };
}
