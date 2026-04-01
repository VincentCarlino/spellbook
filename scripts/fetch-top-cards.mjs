#!/usr/bin/env node
/**
 * Fetches the top 100 Tournament TCG cards from YGOPRODeck and writes
 * them to public/top-cards.json as an array of YgoCard objects ordered
 * by meta usage rank (index 0 = most played).
 *
 * Run with: npm run fetch-top-cards
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../public/top-cards.json");

const TOP_URL =
  "https://ygoprodeck.com/api/top/getFormat.php" +
  "?format=Tournament%20Meta%20Decks" +
  "&dateStart=format";

const CARD_INFO_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php";

// Batch size for cardinfo.php requests (stay well under URL length limits)
const BATCH_SIZE = 25;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchTopList() {
  console.log("Fetching top TCG card list…");
  const res = await fetch(TOP_URL);
  if (!res.ok) throw new Error(`Top list fetch failed: ${res.status}`);
  const data = await res.json();
  const results = data.results ?? [];
  console.log(`  Got ${results.length} cards from top list`);
  return results.slice(0, 100);
}

async function fetchCardInfo(names) {
  const encoded = names.map(encodeURIComponent).join("|");
  const url = `${CARD_INFO_URL}?name=${encoded}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`cardinfo fetch failed: ${res.status} for batch starting "${names[0]}"`);
  const data = await res.json();
  return data.data ?? [];
}

function mapCard(raw) {
  const img = raw.card_images?.[0];
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type ?? "",
    race: raw.race ?? "",
    desc: raw.desc,
    attribute: raw.attribute,
    level: raw.level,
    atk: raw.atk,
    def: raw.def,
    linkval: raw.linkval,
    linkmarkers: raw.linkmarkers,
    imageId: img?.id ?? raw.id,
  };
}

async function main() {
  const topList = await fetchTopList();
  const names = topList.map((c) => c.name);

  // Batch requests to stay within rate limits
  const cardMap = new Map();
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const batch = names.slice(i, i + BATCH_SIZE);
    console.log(`  Fetching card info batch ${i + 1}–${i + batch.length}…`);
    try {
      const cards = await fetchCardInfo(batch);
      for (const card of cards) {
        cardMap.set(card.name, mapCard(card));
      }
    } catch (err) {
      console.warn(`  Warning: ${err.message}`);
    }
    if (i + BATCH_SIZE < names.length) await sleep(200); // respect rate limit
  }

  // Build output in rank order, skip any cards we couldn't resolve
  const output = [];
  for (const entry of topList) {
    const card = cardMap.get(entry.name);
    if (card) {
      output.push(card);
    } else {
      console.warn(`  Could not resolve card: "${entry.name}"`);
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${output.length} cards to public/top-cards.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
