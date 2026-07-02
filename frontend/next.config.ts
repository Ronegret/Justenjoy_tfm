import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase public config — these are intentionally public (see Firebase docs)
  // and safe to fall back to since they identify the project, not a secret.
  // OPENAI_API_KEY / ANTHROPIC_API_KEY are NOT listed here on purpose: they are
  // server-only secrets read directly via process.env in the API route, and
  // must be configured in Vercel's Environment Variables, never hardcoded.
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCttNjv5AKhLsgfNrjLj1MrVQ6v0iFixWo",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "justenjoy-tfm-g7.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "justenjoy-tfm-g7",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "justenjoy-tfm-g7.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "888414990197",
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:888414990197:web:e6f38cd4dab0ae4335ed3c",
  },
};

export default nextConfig;
