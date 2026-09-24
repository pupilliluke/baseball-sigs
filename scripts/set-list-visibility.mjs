#!/usr/bin/env node
/**
 * Publish or unpublish every list belonging to one account, as the project
 * owner. Normally people change this themselves with the Public / Private
 * control on their own collection — this exists for the one case that control
 * can't cover: lists saved before sharing existed, which stay private until
 * somebody says otherwise.
 *
 * Changing what another person's data is visible to is a decision, not a
 * chore, so it lives here as a deliberate command rather than happening
 * automatically. Tell them before you run it.
 *
 *   node scripts/set-list-visibility.mjs <uid> public  "Their Name"
 *   node scripts/set-list-visibility.mjs <uid> private
 *   node scripts/set-list-visibility.mjs <uid> public  "Their Name" --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PROJECT = "baseball-sigs";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const [uid, visibility, ownerName] = process.argv.slice(2);
const dryRun = process.argv.includes("--dry-run");

if (!uid || !["public", "private"].includes(visibility)) {
  console.error("Usage: node scripts/set-list-visibility.mjs <uid> <public|private> [\"Owner Name\"] [--dry-run]");
  process.exit(1);
}

function credentials() {
  const candidates = [
    path.join(os.homedir(), ".config", "configstore", "firebase-tools.json"),
    path.join(os.homedir(), "AppData", "Roaming", "configstore", "firebase-tools.json"),
  ];
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) throw new Error("Run: npx firebase-tools login");
  const cfg = JSON.parse(fs.readFileSync(found, "utf8"));
  const out = [];
  if (cfg.tokens?.refresh_token) out.push(cfg.tokens.refresh_token);
  for (const a of cfg.additionalAccounts || []) if (a.tokens?.refresh_token) out.push(a.tokens.refresh_token);
  return out;
}

async function accessToken() {
  for (const refresh_token of credentials()) {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token, grant_type: "refresh_token" }),
    }).then(r => r.json());
    if (!r.access_token) continue;
    const probe = await fetch(`${BASE}/signature-projects?pageSize=1`, {
      headers: { Authorization: `Bearer ${r.access_token}` },
    }).then(r => r.json());
    if (!probe.error) return r.access_token;
  }
  throw new Error(`No logged-in account can administer ${PROJECT}.`);
}

const token = await accessToken();
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const rows = await fetch(`${BASE}:runQuery`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: "signature-projects" }],
      where: { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: uid } } },
    },
  }),
}).then(r => r.json());

const docs = (Array.isArray(rows) ? rows : []).filter(r => r.document);
if (!docs.length) {
  console.log(`No lists found for ${uid}.`);
  process.exit(0);
}

console.log(`${docs.length} list(s) for ${uid} → ${visibility}${dryRun ? "  (dry run)" : ""}\n`);

for (const r of docs) {
  const id = r.document.name.split("/").pop();
  const f = r.document.fields || {};
  const name = f.projectName?.stringValue ?? "(unnamed)";
  const items = (f.signatureNames?.arrayValue?.values || []).length;
  const was = f.visibility?.stringValue || "private";

  if (dryRun) {
    console.log(`  would change  ${name}  (${items} items)  ${was} → ${visibility}`);
    continue;
  }

  const fields = { visibility: { stringValue: visibility } };
  let mask = "updateMask.fieldPaths=visibility";
  if (ownerName && visibility === "public") {
    fields.ownerName = { stringValue: ownerName.slice(0, 60) };
    mask += "&updateMask.fieldPaths=ownerName";
  }

  const res = await fetch(`${BASE}/signature-projects/${id}?${mask}`, {
    method: "PATCH", headers: H, body: JSON.stringify({ fields }),
  }).then(r => r.json());

  console.log(res.error
    ? `  FAILED  ${name}: ${res.error.message}`
    : `  ${was} → ${visibility}   ${name}  (${items} items)`);
}

if (!dryRun) console.log(`\nDone. They can change any of these themselves from My Collection.`);
