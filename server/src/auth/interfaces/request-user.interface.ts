export const APP_ROLES = ['admin', 'agent', 'viewer'] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface RequestUser {
  userId: string;
  email: string;
  workspaceId: string;
  role: AppRole;
}
