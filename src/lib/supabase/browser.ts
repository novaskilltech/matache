import { createBrowserClient } from "@supabase/ssr";
import { publicConfig } from "@/lib/config";
export function browserDb() {
  const { url, key } = publicConfig();
  return createBrowserClient(url, key);
}
