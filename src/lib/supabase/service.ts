import { createClient } from '@supabase/supabase-js';

/**
 * Service role client — bypasses ALL RLS policies.
 * ONLY use in server-side API routes that are intentionally public.
 * Never expose this key to the client.
 */
export const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
};
