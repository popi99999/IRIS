#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, ".npm-cache");

const files = [
  "supabase/functions/_shared/supabase.ts",
  "supabase/functions/_shared/payouts.ts",
  "supabase/functions/confirm-order-delivery/index.ts",
  "supabase/functions/mark-order-shipped/index.ts",
  "supabase/functions/release-payout/index.ts",
  "supabase/functions/respond-to-offer/index.ts",
  "supabase/functions/send-chat-message/index.ts",
  "supabase/functions/create-checkout-session/index.ts",
  "supabase/functions/create-offer-authorization/index.ts",
  "supabase/functions/run-marketplace-maintenance/index.ts",
  "supabase/functions/stripe-webhook/index.ts",
];

for (const relativePath of files) {
  const filePath = path.join(ROOT, relativePath);
  const result = spawnSync(
    "npx",
    ["--yes", "esbuild", filePath, "--platform=neutral", "--format=esm"],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE || CACHE_DIR,
      },
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    throw new Error(`esbuild parse failed for ${relativePath}\n${result.stderr || result.stdout}`);
  }
}

console.log(`Edge function parse checks passed for ${files.length} files.`);
