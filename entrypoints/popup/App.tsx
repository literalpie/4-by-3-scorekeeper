import { createSignal, onMount } from 'solid-js';
import { createClient, CALLBACK_URL, type OAuthSession } from '@/lib/auth';
import './App.css';

function App() {
  const [session, setSession] = createSignal<OAuthSession | null>(null);
  const [handle, setHandle] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  onMount(async () => {
    const client = createClient();
    try {
      const result = await client.init();
      if (result?.session) {
        setSession(result.session);
      }
    } catch {
      // no session
    }
  });

  async function signIn() {
    if (!handle()) return;
    setLoading(true);
    setError('');
    const client = createClient();
    let tabId: number | undefined;
    const abort = new AbortController();
    const authTimeout = setTimeout(() => abort.abort(), 20000);
    try {
      console.log('[auth] authorize:', handle());
      const authUrl = await client.authorize(handle(), { signal: abort.signal });
      clearTimeout(authTimeout);
      console.log('[auth] got authUrl:', authUrl.href);
      const tab = await browser.tabs.create({ url: authUrl.href });
      tabId = tab.id;
      console.log('[auth] opened tab:', tabId);
      const callbackUrl = CALLBACK_URL;
      const result = await new Promise<{ session: OAuthSession }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          cleanup();
          reject(new Error('Sign in timed out waiting for callback'));
        }, 5 * 60 * 1000);
        const listener = (id: number, changeInfo: { url?: string }) => {
          if (id !== tab.id) return;
          if (changeInfo.url) console.log('[auth] tab url:', changeInfo.url);
          if (!changeInfo.url?.startsWith(callbackUrl)) return;
          console.log('[auth] callback detected');
          cleanup();
          browser.tabs.remove(id);
          const url = new URL(changeInfo.url);
          const params = new URLSearchParams(url.hash.slice(1) || url.search.slice(1));
          client.callback(params).then(resolve).catch(reject);
        };
        const cleanup = () => {
          clearTimeout(timeout);
          browser.tabs.onUpdated.removeListener(listener);
        };
        browser.tabs.onUpdated.addListener(listener);
      });
      console.log('[auth] success:', result.session.did);
      setSession(result.session);
    } catch (err) {
      clearTimeout(authTimeout);
      if (tabId) browser.tabs.remove(tabId).catch(() => {});
      console.error('[auth] error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error during sign in');
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    const s = session();
    if (!s) return;
    await s.signOut();
    setSession(null);
  }

  return (
    <div class="app">
      {session() ? (
        <div class="signed-in">
          <p class="did">{session()!.did}</p>
          <button onClick={signOut} class="btn btn-outline">
            Sign out
          </button>
        </div>
      ) : (
        <div class="sign-in">
          <h1 class="title">4-by-3 Scorekeeper</h1>
          <p class="subtitle">Sign in with your Bluesky handle</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn();
            }}
          >
            <input
              type="text"
              placeholder="handle.bsky.social"
              value={handle()}
              onInput={(e) => setHandle(e.currentTarget.value)}
              disabled={loading()}
              class="input"
            />
            <button type="submit" disabled={loading() || !handle()} class="btn btn-primary">
              {loading() ? 'A new tab will open for sign in...' : 'Sign in'}
            </button>
          </form>
          {error() && <p class="error">{error()}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
