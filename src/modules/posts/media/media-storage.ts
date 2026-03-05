export type UploadInput = {
  path: string;
  contentType: string;
  data: Buffer;
};

export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');

export interface MediaStorage {
  upload(input: UploadInput): Promise<{ publicUrl: string }>;
}

