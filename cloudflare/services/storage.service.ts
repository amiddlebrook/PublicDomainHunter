// cloudflare/services/storage.service.ts
// R2 File Storage Service for Cloudflare Workers

import { R2Bucket } from '@cloudflare/workers-types';

export interface FileMetadata {
  filename: string;
  contentType: string;
  size: number;
  uploadedBy?: number;
  workId?: number;
  uploadedAt: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

/**
 * R2 Storage Service for managing file uploads and downloads
 */
export class StorageService {
  constructor(private bucket: R2Bucket) {}

  /**
   * Upload a file to R2
   */
  async upload(
    file: File | ArrayBuffer,
    key: string,
    metadata?: Partial<FileMetadata>
  ): Promise<UploadResult> {
    let buffer: ArrayBuffer;
    let contentType: string;
    let size: number;
    let filename: string;

    if (file instanceof File) {
      buffer = await file.arrayBuffer();
      contentType = file.type;
      size = file.size;
      filename = file.name;
    } else {
      buffer = file;
      contentType = metadata?.contentType || 'application/octet-stream';
      size = buffer.byteLength;
      filename = metadata?.filename || key;
    }

    // Prepare custom metadata
    const customMetadata: Record<string, string> = {
      filename: filename,
      uploadedAt: new Date().toISOString(),
    };

    if (metadata?.uploadedBy) {
      customMetadata.uploadedBy = metadata.uploadedBy.toString();
    }
    if (metadata?.workId) {
      customMetadata.workId = metadata.workId.toString();
    }

    // Upload to R2
    await this.bucket.put(key, buffer, {
      httpMetadata: {
        contentType: contentType,
      },
      customMetadata: customMetadata,
    });

    return {
      key: key,
      url: `/api/files/${key}`,
      size: size,
      contentType: contentType,
    };
  }

  /**
   * Download a file from R2
   */
  async download(key: string): Promise<R2ObjectBody | null> {
    const object = await this.bucket.get(key);
    return object;
  }

  /**
   * Get file metadata without downloading
   */
  async getMetadata(key: string): Promise<FileMetadata | null> {
    const object = await this.bucket.head(key);

    if (!object) {
      return null;
    }

    return {
      filename: object.customMetadata?.filename || key,
      contentType: object.httpMetadata?.contentType || 'application/octet-stream',
      size: object.size,
      uploadedBy: object.customMetadata?.uploadedBy
        ? parseInt(object.customMetadata.uploadedBy)
        : undefined,
      workId: object.customMetadata?.workId
        ? parseInt(object.customMetadata.workId)
        : undefined,
      uploadedAt: object.customMetadata?.uploadedAt || object.uploaded.toISOString(),
    };
  }

  /**
   * Delete a file from R2
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.bucket.delete(key);
      return true;
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      return false;
    }
  }

  /**
   * List files with a prefix
   */
  async list(prefix?: string, limit: number = 100): Promise<string[]> {
    const options: R2ListOptions = {
      limit: limit,
    };

    if (prefix) {
      options.prefix = prefix;
    }

    const listed = await this.bucket.list(options);
    return listed.objects.map(obj => obj.key);
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    const object = await this.bucket.head(key);
    return object !== null;
  }

  /**
   * Generate a unique key for a file
   */
  generateKey(userId: number, workId: number, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/works/${workId}/${timestamp}-${sanitizedFilename}`;
  }

  /**
   * Upload work file (EPUB, PDF, etc.)
   */
  async uploadWorkFile(
    file: File,
    userId: number,
    workId: number
  ): Promise<UploadResult> {
    const key = this.generateKey(userId, workId, file.name);

    return await this.upload(file, key, {
      uploadedBy: userId,
      workId: workId,
      filename: file.name,
      contentType: file.type,
    });
  }

  /**
   * Get public URL for a file (if bucket is public or using signed URLs)
   */
  getPublicUrl(key: string, bucketName: string): string {
    // For now, return API endpoint. In production, you might use R2 public URLs
    return `/api/files/${key}`;
  }

  /**
   * Copy a file within R2
   */
  async copy(sourceKey: string, destKey: string): Promise<boolean> {
    try {
      const source = await this.bucket.get(sourceKey);

      if (!source) {
        return false;
      }

      await this.bucket.put(destKey, source.body, {
        httpMetadata: source.httpMetadata,
        customMetadata: source.customMetadata,
      });

      return true;
    } catch (error) {
      console.error('Error copying file in R2:', error);
      return false;
    }
  }

  /**
   * Get file size
   */
  async getSize(key: string): Promise<number | null> {
    const metadata = await this.getMetadata(key);
    return metadata?.size || null;
  }
}
