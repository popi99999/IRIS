#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function read(relativePath) {
  return readFile(path.join(ROOT, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const frontendBundle = await read("iris-plus.js");
const deployScript = await read("scripts/supabase-deploy-functions.sh");
const migration = await read("supabase/migrations/20260415_beta_launch_hardening.sql");
const chatModerationMigration = await read("supabase/migrations/20260416_chat_moderation.sql");

for (const token of [
  "ownerBootstrapPasswordHash",
  "canUseOwnerBootstrap",
  "buildOwnerBootstrapUser",
  "sha256Hex(",
  "deriveUserRole(",
]) {
  assert(!frontendBundle.includes(token), `Forbidden bootstrap token still present in iris-plus.js: ${token}`);
}

assert(!deployScript.includes("--no-verify-jwt"), "Deploy script still disables JWT verification.");
assert(!frontendBundle.includes('.from("conversation_messages").upsert'), "Frontend still writes conversation_messages directly.");
assert(!frontendBundle.includes('.from("conversation_messages").insert'), "Frontend still inserts conversation_messages directly.");
assert(deployScript.includes("send-chat-message"), "Deploy script does not deploy send-chat-message.");

for (const relativePath of [
  "supabase/functions/confirm-order-delivery/index.ts",
  "supabase/functions/mark-order-shipped/index.ts",
  "supabase/functions/release-payout/index.ts",
  "supabase/functions/respond-to-offer/index.ts",
]) {
  const source = await read(relativePath);
  assert(source.includes("isUserAdmin("), `${relativePath} is not using isUserAdmin() gating.`);
  for (const hardcoded of ["owner@iris-fashion.it", "admin@iris-fashion.it", "support@iris-fashion.it"]) {
    assert(!source.includes(hardcoded), `${relativePath} still contains hardcoded admin email ${hardcoded}.`);
  }
}

for (const fragment of [
  "create table if not exists public.admin_users",
  "create table if not exists public.payout_releases",
  "create table if not exists public.stripe_webhook_events",
  "create unique index if not exists offers_active_authorization_idx",
  "create or replace function public.is_iris_admin()",
]) {
  assert(migration.includes(fragment), `Migration is missing required fragment: ${fragment}`);
}

for (const fragment of [
  "create table if not exists public.chat_moderation_users",
  "create table if not exists public.chat_moderation_events",
  "drop policy if exists \"conversation_messages_insert_parties\" on public.conversation_messages;",
  "drop policy if exists \"conversation_messages_update_parties\" on public.conversation_messages;",
]) {
  assert(chatModerationMigration.includes(fragment), `Chat moderation migration is missing required fragment: ${fragment}`);
}

console.log("IRIS hardening checks passed.");
