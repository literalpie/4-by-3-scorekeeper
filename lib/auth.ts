import type {
  BrowserOAuthClientOptions,
  OAuthSession,
} from '@atproto/oauth-client-browser';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import type { Agent } from '@atproto/api';

const GITHUB_USER = 'literalpie';
const REPO = '4-by-3-scorekeeper';

export const CALLBACK_URL = `https://${GITHUB_USER}.github.io/${REPO}/callback.html`;

export function getAuthOptions(): BrowserOAuthClientOptions {
  const clientId = `https://${GITHUB_USER}.github.io/${REPO}/client-metadata.json`;

  return {
    clientMetadata: {
      client_id: clientId,
      client_name: '4-by-3 Scorekeeper',
      client_uri: `https://${GITHUB_USER}.github.io/${REPO}/`,
      redirect_uris: [CALLBACK_URL] as [string, ...string[]],
      scope: 'atproto',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://bsky.social',
  };
}

export function createClient(): BrowserOAuthClient {
  return new BrowserOAuthClient(getAuthOptions());
}

export type { OAuthSession, Agent };
