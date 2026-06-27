import type {
  BrowserOAuthClientOptions,
  OAuthSession,
} from '@atproto/oauth-client-browser';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import type { Agent } from '@atproto/api';

const URL_BASE = `https://literalpie.github.io/4-by-3-scorekeeper`;

export const CALLBACK_URL = `${URL_BASE}/callback.html`;

export function createClient(): BrowserOAuthClient {
  const clientId = `${URL_BASE}/client-metadata.json`;
  
  const authOptions: BrowserOAuthClientOptions = {
    clientMetadata: {
      client_id: clientId,
      client_name: '4-by-3 Scorekeeper',
      client_uri: `${URL_BASE}/`,
      redirect_uris: [CALLBACK_URL] as [string, ...string[]],
      scope: 'atproto repo:com.literalpie.gamescore',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      application_type: 'web',
      dpop_bound_access_tokens: true,
    },
    handleResolver: 'https://bsky.social',
  };
  return new BrowserOAuthClient(authOptions);
}

export type { OAuthSession, Agent };
