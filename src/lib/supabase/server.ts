import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicConfig, DATABASE_SCHEMA, AUTH_COOKIE_NAME } from "@/lib/config";
export async function serverDb() {
  const jar = await cookies();
  const { url, key } = publicConfig();
  return createServerClient(url, key, {
    db: { schema: DATABASE_SCHEMA },
    cookieOptions: { name: AUTH_COOKIE_NAME },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values) {
          try {
            jar.set(name, value, options);
          } catch {
            /* Server Component: refresh is handled in proxy. */
          }
        }
      },
    },
  });
}
