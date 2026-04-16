import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  FetchedInstagramData,
  InstagramPost,
} from './types/instagram-analysis.types';

@Injectable()
export class InstagramDataFetcherService {
  private readonly logger = new Logger(InstagramDataFetcherService.name);

  constructor(private readonly prisma: PrismaService) {}

  async fetchWorkspaceInstagramData(
    workspaceId: string,
    preferredHandle?: string,
  ): Promise<FetchedInstagramData> {
    const connection =
      (await this.prisma.whatsAppConnection.findUnique({
        where: {
          workspaceId,
        },
      })) ??
      (await this.prisma.whatsAppConnection.findFirst({
        orderBy: {
          createdAt: 'desc',
        },
      }));

    const warnings: string[] = [];

    if (!connection) {
      warnings.push(
        'No workspace WhatsApp connection found. Instagram source is unavailable.',
      );
      return {
        instagramHandle: this.normalizeHandle(preferredHandle ?? null),
        profileJson: {},
        postsJson: [],
        warnings,
      };
    }

    const metadata = this.toObject(connection.metadataJson);
    const handleFromMetadata = this.pickString(metadata, [
      'instagramHandle',
      'instagramUsername',
      'instagram_user',
      'instagram',
      'handle',
    ]);
    const handle = this.normalizeHandle(preferredHandle ?? handleFromMetadata);

    const profileJson = this.extractProfileJson(metadata, handle);
    const postsJson = this.extractPosts(metadata);

    if (!handle) {
      warnings.push(
        'Instagram handle was not found in connection metadata. Analysis confidence may be low.',
      );
    }

    if (postsJson.length === 0) {
      warnings.push(
        'Instagram post captions are missing from metadata. Using profile-only analysis.',
      );
    }

    this.logger.log(
      `Instagram data fetched workspace=${workspaceId} handle=${handle ?? 'unknown'} posts=${postsJson.length}`,
    );

    return {
      instagramHandle: handle,
      profileJson,
      postsJson,
      warnings,
    };
  }

  private extractProfileJson(
    metadata: Record<string, unknown>,
    handle: string | null,
  ): Record<string, unknown> {
    const profileBase =
      this.pickObject(metadata, ['instagramProfile', 'profile']) ?? {};
    const result: Record<string, unknown> = { ...profileBase };

    const bio = this.pickString(metadata, ['instagramBio', 'bio']);
    if (bio) {
      result.bio = bio;
    }

    if (handle) {
      result.username = handle;
    } else {
      const username = this.pickString(metadata, ['username', 'instagramUser']);
      if (username) {
        result.username = username;
      }
    }

    const followers = this.pickNumber(metadata, [
      'followers',
      'followerCount',
      'instagramFollowers',
    ]);
    if (followers !== null) {
      result.followers = followers;
    }

    return result;
  }

  private extractPosts(metadata: Record<string, unknown>): InstagramPost[] {
    const posts: InstagramPost[] = [];
    const postSources: unknown[] = [];

    const primaryPostArray =
      this.pickArray(metadata, ['instagramPosts', 'posts']) ?? [];
    postSources.push(...primaryPostArray);

    const captionArray = this.pickArray(metadata, [
      'instagramCaptions',
      'captions',
    ]);
    if (captionArray) {
      postSources.push(...captionArray);
    }

    for (const source of postSources) {
      if (typeof source === 'string') {
        const caption = source.trim();
        if (caption.length === 0) {
          continue;
        }

        posts.push({
          caption,
          hashtags: this.extractHashtags(caption),
          raw: source,
        });
        continue;
      }

      if (typeof source === 'object' && source !== null) {
        const obj = source as Record<string, unknown>;
        const caption =
          this.pickString(obj, ['caption', 'text', 'description', 'content']) ??
          '';

        if (caption.length === 0) {
          continue;
        }

        const hashtags =
          this.pickArray(obj, ['hashtags'])?.flatMap((value) =>
            typeof value === 'string' ? [value] : [],
          ) ?? this.extractHashtags(caption);

        posts.push({
          caption,
          hashtags: this.normalizeHashtags(hashtags),
          raw: source,
        });
      }
    }

    return posts.slice(0, 20);
  }

  private extractHashtags(caption: string): string[] {
    const regex = /#[\p{L}\p{N}_]+/gu;
    const matches = caption.match(regex) ?? [];
    return this.normalizeHashtags(matches);
  }

  private normalizeHashtags(rawHashtags: string[]): string[] {
    const set = new Set<string>();

    for (const hashtag of rawHashtags) {
      const normalized = hashtag.trim().toLowerCase().replace(/^#/, '');
      if (normalized.length > 0) {
        set.add(normalized);
      }
    }

    return Array.from(set).map((value) => `#${value}`);
  }

  private normalizeHandle(handle: string | null): string | null {
    if (!handle) {
      return null;
    }

    const normalized = handle.trim().replace(/^@/, '');
    return normalized.length > 0 ? normalized : null;
  }

  private pickString(
    object: Record<string, unknown>,
    keys: string[],
  ): string | null {
    for (const key of keys) {
      const value = object[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private pickNumber(
    object: Record<string, unknown>,
    keys: string[],
  ): number | null {
    for (const key of keys) {
      const value = object[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private pickObject(
    object: Record<string, unknown>,
    keys: string[],
  ): Record<string, unknown> | null {
    for (const key of keys) {
      const value = object[key];
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        return value as Record<string, unknown>;
      }
    }

    return null;
  }

  private pickArray(
    object: Record<string, unknown>,
    keys: string[],
  ): unknown[] | null {
    for (const key of keys) {
      const value = object[key];
      if (Array.isArray(value)) {
        const normalized: unknown[] = [];
        for (const item of value) {
          normalized.push(item);
        }
        return normalized;
      }
    }

    return null;
  }

  private toObject(value: Prisma.JsonValue | null): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return {};
  }
}
