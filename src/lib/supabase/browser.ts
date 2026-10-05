import { createBrowserClient } from "@supabase/ssr";
import { publicConfig, DATABASE_SCHEMA, AUTH_COOKIE_NAME } from "@/lib/config";
export function browserDb() {
  const { url, key } = publicConfig();
  return createBrowserClient(url, key, {
    db: { schema: DATABASE_SCHEMA },
    cookieOptions: { name: AUTH_COOKIE_NAME },
  });
}
