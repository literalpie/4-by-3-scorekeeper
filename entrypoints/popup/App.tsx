import { createSignal, onCleanup } from 'solid-js';
import './App.css';

export default function App() {
  const [handle, setHandle] = createSignal('');
  const [session, setSession] = createSignal<{ handle: string; did: string } | null>(null);
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const onStorageChanged = (changes: Record<string, any>) => {
    if (changes.authResult) {
      setSession(changes.authResult.newValue || null);
      setLoading(false);
    }
  };
  browser.storage.onChanged.addListener(onStorageChanged);
  onCleanup(() => browser.storage.onChanged.removeListener(onStorageChanged));

  browser.storage.local.get('authResult').then((r) => {
    if (r.authResult) setSession(r.authResult as any);
  });

  const signIn = async () => {
    setError('');
    setLoading(true);
    try {
      await browser.runtime.sendMessage({ type: 'SIGN_IN', handle: handle() });
    } catch (e: any) {
      setLoading(false);
      setError(e.message);
    }
  };

  const signOut = async () => {
    const s = session();
    if (!s) return;
    try {
      await browser.runtime.sendMessage({ type: 'SIGN_OUT', did: s.did });
    } catch {}
    setSession(null);
  };

  return (
    <div class="container">
      {session() ? (
        <>
          <h1>Signed in</h1>
          <p>@{session()!.handle}</p>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <>
          <h1>Sign in to AT Protocol</h1>
          <input
            value={handle()}
            onInput={(e) => setHandle(e.currentTarget.value)}
            placeholder="alice.bsky.social"
            disabled={loading()}
          />
          <button onClick={signIn} disabled={loading() || !handle()}>
            {loading() ? 'Signing in...' : 'Sign in'}
          </button>
          {error() && <p class="error">{error()}</p>}
        </>
      )}

      <hr />
      <button onClick={() => browser.tabs.create({ url: browser.runtime.getURL('/test-page.html' as any) })}>
        Open Test Page
      </button>
    </div>
  );
}
