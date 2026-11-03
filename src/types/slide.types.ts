export interface Slide {
  id: string; // UUID
  driveFileId: string;
  fileName: string;
  courseId: string;
  hash?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadSlideDto {
  courseId: string;
  folderId?: string;
}

export interface SlideUploadResult {
  uploaded: Slide[];
  duplicatesSkipped: { fileName: string; hash: string }[];
  failed: { fileName: string; error: string }[];
}

export interface SlideQueryDto {
  courseId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export type MaterialType = 'all' | 'slides' | 'videos';

