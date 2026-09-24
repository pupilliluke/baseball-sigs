#!/usr/bin/env node
/**
 * Back up every saved list and category to backups/.
 *
 * Reads with the project owner's credentials rather than the public web API
 * key. Since private lists became genuinely private, an unauthenticated read
 * returns nothing — a backup taken that way would look like it succeeded and
 * contain no data, which is worse than failing.
 *
 * Usage:  npm run backup
 * Needs:  firebase-tools logged in as an account with access to the project
 *         (`npx firebase-tools login`).
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PROJECT = "baseball-sigs";
const COLLECTIONS = ["signature-projects", "user-categories"];
const OUT_DIR = path.join(process.cwd(), "backups");

// The firebase-tools CLI's own public OAuth client
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

function configPath() {
  const candidates = [
    path.join(os.homedir(), ".config", "configstore", "firebase-tools.json"),
    path.join(os.homedir(), "AppData", "Roaming", "configstore", "firebase-tools.json"),
  ];
  const found = candidates.find(p => fs.existsSync(p));
  if (!found) {
    throw new Error("Could not find firebase-tools credentials. Run: npx firebase-tools login");
  }
  return found;
}

function refreshTokens() {
  const cfg = JSON.parse(fs.readFileSync(configPath(), "utf8"));
  const accounts = [];
  if (cfg.tokens?.refresh_token) accounts.push({ email: cfg.user?.email, token: cfg.tokens.refresh_token });
  for (const a of cfg.additionalAccounts || []) {
    if (a.tokens?.refresh_token) accounts.push({ email: a.user?.email, token: a.tokens.refresh_token });
  }
  if (!accounts.length) throw new Error("No logged-in firebase-tools accounts found.");
  return accounts;
}

async function accessToken(refresh_token) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token,
      grant_type: "refresh_token",
    }),
  }).then(r => r.json());
  return res.access_token || null;
}

async function fetchCollection(token, collection) {
  const docs = [];
  let pageToken = "";
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}`
      + `?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const page = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
    if (page.error) throw new Error(`${collection}: ${page.error.message}`);
    docs.push(...(page.documents || []));
    pageToken = page.nextPageToken || "";
  } while (pageToken);
  return docs;
}

const value = (v = {}) => {
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(value);
  if ("mapValue" in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, value(x)]));
  return null;
};

const plain = (d) => ({
  id: d.name.split("/").pop(),
  ...Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, value(v)])),
  createTime: d.createTime,
  updateTime: d.updateTime,
});

async function main() {
  let token = null;
  let who = null;
  for (const acct of refreshTokens()) {
    const t = await accessToken(acct.token);
    if (!t) continue;
    try {
      await fetchCollection(t, COLLECTIONS[0]);
      token = t;
      who = acct.email;
      break;
    } catch { /* this account can't read the project; try the next */ }
  }
  if (!token) throw new Error(`No logged-in account can read ${PROJECT}. Run: npx firebase-tools login`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  let grandTotal = 0;

  for (const collection of COLLECTIONS) {
    const docs = await fetchCollection(token, collection);
    const simple = docs.map(plain);
    fs.writeFileSync(path.join(OUT_DIR, `${collection}-${stamp}.json`), JSON.stringify(simple, null, 2));
    grandTotal += simple.length;
    console.log(`  ${collection}: ${simple.length} documents`);
  }

  // A backup that silently contains nothing is the failure mode worth guarding.
  if (grandTotal === 0) {
    console.error("\nBackup produced 0 documents — refusing to call that a backup.");
    process.exit(1);
  }
  console.log(`\nBacked up ${grandTotal} documents to backups/ as ${who}`);
}

main().catch(err => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
