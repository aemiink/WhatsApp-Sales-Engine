import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import {
  FetchedInstagramData,
  InstagramPost,
} from './types/instagram-analysis.types';

interface InstagramGraphError {
  message?: string;
}

interface InstagramGraphProfileResponse {
  id?: string;
  username?: string;
  biography?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
  error?: InstagramGraphError;
}

interface InstagramGraphMediaItem {
  id?: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
}

interface InstagramGraphMediaResponse {
  data?: InstagramGraphMediaItem[];
  error?: InstagramGraphError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class InstagramDataFetcherService {
  private readonly logger = new Logger(InstagramDataFetcherService.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async fetchWorkspaceInstagramData(
    workspaceId: string,
    preferredHandle?: string,
  ): Promise<FetchedInstagramData> {
    const warnings: string[] = [];
    const preferredNormalizedHandle = this.normalizeHandle(
      preferredHandle ?? null,
    );

    const accessToken = this.appConfigService.instagramAccessToken;
    const instagramUserId = this.appConfigService.instagramUserId;

    if (!accessToken || !instagramUserId) {
      warnings.push(
        'INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_USER_ID is not configured. Instagram analysis ran in profile-hint mode.',
      );
      return {
        instagramHandle: preferredNormalizedHandle,
        profileJson: this.buildFallbackProfile(preferredNormalizedHandle),
        postsJson: [],
        warnings,
      };
    }

    const profileResponse = await this.fetchProfile(
      instagramUserId,
      accessToken,
      warnings,
    );
    const mediaResponse = await this.fetchMedia(
      instagramUserId,
      accessToken,
      warnings,
    );

    const handleFromProfile = this.normalizeHandle(
      this.readString(profileResponse, 'username'),
    );
    const instagramHandle = preferredNormalizedHandle ?? handleFromProfile;

    if (
      preferredNormalizedHandle &&
      handleFromProfile &&
      preferredNormalizedHandle.toLowerCase() !==
        handleFromProfile.toLowerCase()
    ) {
      warnings.push(
        `Preferred handle (@${preferredNormalizedHandle}) differs from Graph API username (@${handleFromProfile}).`,
      );
    }

    const profileJson = this.toProfileJson(profileResponse, instagramHandle);
    const postsJson = this.toPosts(mediaResponse);

    if (postsJson.length === 0) {
      warnings.push(
        'No Instagram captions were returned by Graph API. Analysis may rely on profile-only signals.',
      );
    }

    this.logger.log(
      `Instagram data fetched workspace=${workspaceId} userId=${instagramUserId} handle=${instagramHandle ?? 'unknown'} posts=${postsJson.length}`,
    );

    return {
      instagramHandle,
      profileJson,
      postsJson,
      warnings: this.unique(warnings),
    };
  }

  private async fetchProfile(
    instagramUserId: string,
    accessToken: string,
    warnings: string[],
  ): Promise<InstagramGraphProfileResponse | null> {
    try {
      return await this.fetchGraphJson<InstagramGraphProfileResponse>({
        path: `/${instagramUserId}`,
        accessToken,
        params: {
          fields:
            'id,username,biography,followers_count,follows_count,media_count,profile_picture_url',
        },
      });
    } catch (error: unknown) {
      warnings.push(
        `Instagram profile fetch failed: ${this.toErrorMessage(error)}`,
      );
      return null;
    }
  }

  private async fetchMedia(
    instagramUserId: string,
    accessToken: string,
    warnings: string[],
  ): Promise<InstagramGraphMediaResponse | null> {
    try {
      return await this.fetchGraphJson<InstagramGraphMediaResponse>({
        path: `/${instagramUserId}/media`,
        accessToken,
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp',
          limit: String(this.appConfigService.instagramMediaLimit),
        },
      });
    } catch (error: unknown) {
      warnings.push(
        `Instagram media fetch failed: ${this.toErrorMessage(error)}`,
      );
      return null;
    }
  }

  private async fetchGraphJson<T>(input: {
    path: string;
    accessToken: string;
    params?: Record<string, string>;
  }): Promise<T> {
    const url = new URL(
      `https://graph.facebook.com/${this.appConfigService.instagramGraphApiVersion}${input.path}`,
    );

    for (const [key, value] of Object.entries(input.params ?? {})) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set('access_token', input.accessToken);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.appConfigService.instagramProviderTimeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          'user-agent':
            'WhatsApp-Sales-Engine/1.0 (+instagram-brand-context-analysis)',
        },
      });

      const payload: unknown = await response.json();
      if (!isRecord(payload)) {
        throw new Error('Instagram Graph API returned an invalid JSON body.');
      }

      if (!response.ok) {
        throw new Error(this.extractGraphApiError(payload, response.status));
      }

      if (
        isRecord(payload.error) &&
        typeof payload.error.message === 'string' &&
        payload.error.message.trim().length > 0
      ) {
        throw new Error(payload.error.message.trim());
      }

      return payload as T;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `Instagram Graph API request timed out after ${this.appConfigService.instagramProviderTimeoutMs}ms.`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractGraphApiError(
    payload: Record<string, unknown>,
    status: number,
  ): string {
    if (
      isRecord(payload.error) &&
      typeof payload.error.message === 'string' &&
      payload.error.message.trim().length > 0
    ) {
      return `Instagram Graph API HTTP ${status}: ${payload.error.message.trim()}`;
    }

    return `Instagram Graph API HTTP ${status}.`;
  }

  private toProfileJson(
    profile: InstagramGraphProfileResponse | null,
    normalizedHandle: string | null,
  ): Record<string, unknown> {
    if (!profile) {
      return this.buildFallbackProfile(normalizedHandle);
    }

    const result: Record<string, unknown> = {};

    const biography = this.readString(profile, 'biography');
    if (biography) {
      result.bio = biography;
    }

    const username =
      normalizedHandle ?? this.normalizeHandle(profile.username ?? null);
    if (username) {
      result.username = username;
    }

    const followersCount = this.readNumber(profile, 'followers_count');
    if (followersCount !== null) {
      result.followers = followersCount;
    }

    const followsCount = this.readNumber(profile, 'follows_count');
    if (followsCount !== null) {
      result.following = followsCount;
    }

    const mediaCount = this.readNumber(profile, 'media_count');
    if (mediaCount !== null) {
      result.mediaCount = mediaCount;
    }

    const pictureUrl = this.readString(profile, 'profile_picture_url');
    if (pictureUrl) {
      result.profilePictureUrl = pictureUrl;
    }

    const profileId = this.readString(profile, 'id');
    if (profileId) {
      result.instagramUserId = profileId;
    }

    return result;
  }

  private toPosts(media: InstagramGraphMediaResponse | null): InstagramPost[] {
    if (!media || !Array.isArray(media.data)) {
      return [];
    }

    const posts: InstagramPost[] = [];

    for (const item of media.data) {
      if (!isRecord(item)) {
        continue;
      }

      const caption = this.readString(item, 'caption');
      if (!caption) {
        continue;
      }

      posts.push({
        caption,
        hashtags: this.extractHashtags(caption),
        raw: item,
      });
    }

    return posts.slice(0, this.appConfigService.instagramMediaLimit);
  }

  private buildFallbackProfile(
    normalizedHandle: string | null,
  ): Record<string, unknown> {
    if (!normalizedHandle) {
      return {};
    }

    return {
      username: normalizedHandle,
    };
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

  private readString(object: unknown, key: string): string | null {
    if (!isRecord(object)) {
      return null;
    }

    const value = object[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }

    return null;
  }

  private readNumber(object: unknown, key: string): number | null {
    if (!isRecord(object)) {
      return null;
    }

    const value = object[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message.trim();
    }

    return 'unknown_error';
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values));
  }
}
