import { createClient } from '@/lib/auth';

const client = createClient();

try {
  await client.init();
} catch {
  // LoginContinuedInParentWindowError is thrown on success —
  // the popup window closes itself after signaling the parent.
}
