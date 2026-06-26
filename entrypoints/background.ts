import { createClient, type OAuthSession } from '@/lib/auth';
import type { Agent } from '@atproto/api';

export default defineBackground(() => {
  createClient();

  // On extension icon click, we could open the popup or do nothing
  // (the popup handles auth via BrowserOAuthClient + IndexedDB)
});

export type { OAuthSession, Agent };
