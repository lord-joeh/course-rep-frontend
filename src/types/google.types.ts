export interface GoogleAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface GoogleStatusResponse {
  connected: boolean;
  expiryDate: number | null;
}

export interface CreateFolderDto {
  folderName: string;
  parentFolderId?: string;
}

export interface CreateFolderResponse {
  id: string;
  name: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
}

export interface DeleteDriveFileResponse {
  message: string;
  fileId: string;
}

