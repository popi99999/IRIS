#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const testModule = await import(pathToFileURL(path.join(ROOT, "tests/messageModeration.test.mjs")).href);

await testModule.runMessageModerationTestSuite();
console.log("IRIS chat moderation validation passed.");
