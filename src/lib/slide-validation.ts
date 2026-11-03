import { z } from 'zod';

export const uploadSlideSchema = z.object({
  courseId: z
    .string()
    .min(1, { message: 'Course selection is required' })
    .transform((val) => val.trim().toUpperCase()),
  folderId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type UploadSlideFormValues = z.infer<typeof uploadSlideSchema>;

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v']);
const PRESENTATION_EXTENSIONS = new Set(['pptx', 'ppt', 'odp', 'key']);
const DOCUMENT_EXTENSIONS = new Set(['docx', 'doc', 'odt', 'rtf', 'txt']);

export function getFileExtension(fileName: string): string {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function isVideoFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return VIDEO_EXTENSIONS.has(ext);
}

export function isPresentationFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return PRESENTATION_EXTENSIONS.has(ext);
}

export function isPdfFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ext === 'pdf';
}

export type MaterialCategory = 'video' | 'presentation' | 'pdf' | 'document' | 'other';

export function getMaterialCategory(fileName: string): MaterialCategory {
  if (isVideoFile(fileName)) return 'video';
  if (isPresentationFile(fileName)) return 'presentation';
  if (isPdfFile(fileName)) return 'pdf';
  const ext = getFileExtension(fileName);
  if (DOCUMENT_EXTENSIONS.has(ext)) return 'document';
  return 'other';
}

