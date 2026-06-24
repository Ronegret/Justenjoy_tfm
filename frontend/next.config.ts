import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase public config — these are intentionally public (see Firebase docs).
  // Fallback ensures they're always available even if Vercel env vars aren't set at build time.
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
    OPENAI_API_KEY: 
      process.env.OPENAI_API_KEY || "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",
    ANTHROPIC_API_KEY:
      process.env.ANTHROPIC_API_KEY || "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",
  },
};

export default nextConfig;
