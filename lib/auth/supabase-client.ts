import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
        },
        set(name: string, value: string, options: any) {
          // 90 days in seconds
          const NINETY_DAYS = 90 * 24 * 60 * 60;

          const cookieOptions = {
            ...options,
            maxAge: NINETY_DAYS,
            path: "/",
            sameSite: "lax" as const,
            secure: process.env.NODE_ENV === "production",
          };

          let cookieString = `${name}=${encodeURIComponent(value)}`;
          cookieString += `; path=${cookieOptions.path}`;
          cookieString += `; max-age=${cookieOptions.maxAge}`;
          cookieString += `; samesite=${cookieOptions.sameSite}`;

          if (cookieOptions.secure) {
            cookieString += "; secure";
          }

          document.cookie = cookieString;
        },
        remove(name: string, options: any) {
          document.cookie = `${name}=; path=/; max-age=0`;
        },
      },
    }
  );
}
