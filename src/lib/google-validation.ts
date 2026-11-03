import { z } from 'zod';

export const createFolderSchema = z.object({
  folderName: z
    .string()
    .min(1, { message: 'Folder name is required' })
    .max(100, { message: 'Folder name must be at most 100 characters' })
    .transform((val) => val.trim()),
  parentFolderId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
});

export type CreateFolderFormValues = z.infer<typeof createFolderSchema>;

