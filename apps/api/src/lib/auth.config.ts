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
const secureCookieMode = isProduction || (process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false);
const trustedOrigins = [
  "https://anket-web.pages.dev",
  "https://a238bb65.anket-web.pages.dev",
  process.env.FRONTEND_URL,
  process.env.CALLBACK_URL,
  process.env.BETTER_AUTH_URL,
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

/* ------------------------------------------------------------------ */
/*  Two auth instances – same DB, different baseURL / redirectURI      */
/* ------------------------------------------------------------------ */

/** Localhost instance – for PC browser at localhost:5173 */
export const localAuth = betterAuth({
  ...sharedConfig,
  baseURL: "http://localhost:3001",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
  baseURL: "https://anket-api-i3i7.onrender.com",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: "https://anket-api-i3i7.onrender.com/api/auth/callback/google",
    },
  },
});

export function getAuth(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return prodAuth;
  }
  const origin = req.headers.get("origin") || "";
  const host = req.headers.get("host") || "";
  if (origin.includes("nip.io") || host.includes("nip.io")) {
    return nipAuth;
  }
  return localAuth;
}

// Default export for backward-compat (used by auth.routes.ts etc.)
export const auth = localAuth;
export type Auth = typeof localAuth;
