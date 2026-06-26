import { createSignal, onMount } from 'solid-js';
import { createClient, type OAuthSession } from '@/lib/auth';
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
    try {
      const s = await client.signIn(handle(), { display: 'popup' });
      setSession(s);
    } catch (err) {
      if (err instanceof Error && err.message !== 'User navigated back') {
        setError(err.message);
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
              {loading() ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          {error() && <p class="error">{error()}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
