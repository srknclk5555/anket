import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  users,
  sessions,
  accounts,
  verifications,
} from "../db/schema.js";

const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
const isProduction = process.env.NODE_ENV === "production";

// Ensure BETTER_AUTH_URL has a protocol
const ensureProtocol = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

const betterAuthUrl = ensureProtocol(process.env.BETTER_AUTH_URL);
const secureCookieMode = isProduction || (betterAuthUrl?.startsWith("https://") ?? false);
const trustedOrigins = [
  "https://anket-web.pages.dev",
  "https://a238bb65.anket-web.pages.dev",
  process.env.FRONTEND_URL,
  process.env.CALLBACK_URL,
  betterAuthUrl,
].filter(Boolean) as string[];

/* ------------------------------------------------------------------ */
/*  Shared config – everything except baseURL & redirectURI            */
/* ------------------------------------------------------------------ */
const sharedConfig = {
  database: drizzleAdapter(db, {
    provider: "pg" as const,
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: isProduction
    ? trustedOrigins
    : [
        "http://localhost:5173",
        "http://localhost:3001",
        "http://192.168.1.108.nip.io:5173",
        "http://192.168.1.108.nip.io:3001",
        ...trustedOrigins,
      ].filter(Boolean),
  advanced: {
    useSecureCookies: secureCookieMode,
    crossSubDomainCookies: {
      enabled: false,
    },
    database: {
      generateId: () => randomUUID(),
    },
  },
  user: {
    fields: {
      image: "avatarUrl" as const,
    },
    additionalFields: {
      role: {
        type: "string" as const,
        required: false,
        defaultValue: "user",
        input: false,
      },
      isAdmin: {
        type: "boolean" as const,
        required: false,
        defaultValue: false,
        input: false,
      },
      googleId: {
        type: "string" as const,
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user: any) => {
          const email = user.email?.toLowerCase();
          const isAdmin = Boolean(adminEmail && email === adminEmail);
          return {
            data: {
              ...user,
              isAdmin,
              role: isAdmin ? "admin" : "user",
            },
          };
        },
      },
    },
    account: {
      create: {
        after: async (account: any) => {
          if (account.providerId === "google" && account.userId) {
            await db
              .update(users)
              .set({
                googleId: account.accountId,
                lastLogin: new Date(),
              })
              .where(eq(users.id, account.userId));
          }
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    updateAge: 24 * 60 * 60,
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
};

const authCache = new Map<string, any>();

const createDevAuth = (baseURL: string, origin?: string) => {
  const trustedOriginsOverride = isProduction
    ? trustedOrigins
    : [...sharedConfig.trustedOrigins, origin].filter(Boolean) as string[];

  return betterAuth({
    ...sharedConfig,
    baseURL,
    trustedOrigins: trustedOriginsOverride,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectURI: `${baseURL}/api/auth/callback/google`,
      },
    },
  });
};

const getDevAuth = (req: Request) => {
  const origin = req.headers.get("origin") || undefined;
  const host = req.headers.get("host") || "localhost:3001";
  const protocol = req.headers.get("x-forwarded-proto") || (origin?.startsWith("https://") ? "https" : "http");

  let baseURL = `${protocol}://${host}`;
  if (origin && origin.includes("nip.io")) {
    const originUrl = new URL(origin);
    originUrl.port = "3001";
    baseURL = `${originUrl.protocol}//${originUrl.hostname}:${originUrl.port}`;
  }

  const cacheKey = `${baseURL}::${origin ?? ""}`;

  if (!authCache.has(cacheKey)) {
    authCache.set(cacheKey, createDevAuth(baseURL, origin));
  }

  return authCache.get(cacheKey);
};

/* ------------------------------------------------------------------ */
/*  Two auth instances – same DB, different baseURL / redirectURI      */
/* ------------------------------------------------------------------ */

/** Localhost instance – for PC browser at localhost:5173 */
export const localAuth = betterAuth({
  ...sharedConfig,
  baseURL: "http://localhost:3001",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID_LOCAL!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET_LOCAL!,
      redirectURI: "http://localhost:3001/api/auth/callback/google",
    },
  },
});

/** nip.io instance – for mobile browser at 192.168.1.108.nip.io:5173 */
export const nipAuth = betterAuth({
  ...sharedConfig,
  baseURL: "http://192.168.1.108.nip.io:3001",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: "http://192.168.1.108.nip.io:3001/api/auth/callback/google",
    },
  },
});

export const prodAuth = betterAuth({
  ...sharedConfig,
  baseURL: betterAuthUrl || "https://sanaltribun.com",
  advanced: {
    ...sharedConfig.advanced,
    useSecureCookies: true,
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
    database: {
      generateId: () => randomUUID(),
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${betterAuthUrl || "https://sanaltribun.com"}/api/auth/callback/google`,
    },
  },
});

export function getAuth(req: Request) {
  if (isProduction) {
    return prodAuth;
  }
  return getDevAuth(req);
}

// Default export for backward-compat (used by auth.routes.ts etc.)
export const auth = localAuth;
export type Auth = typeof localAuth;
