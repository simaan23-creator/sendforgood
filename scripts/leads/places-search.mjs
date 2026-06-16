#!/usr/bin/env node
/**
 * Photographer lead scraper — Step 1: discovery via Google Places API (New).
 *
 * Searches "wedding photographer in {city}" across the configured US cities
 * and upserts results into the photographer_leads table.
 *
 * SETUP (one-time, ~5 min):
 *   1. Open https://console.cloud.google.com/
 *   2. Create or reuse a project (the same one you used for Google Ads is fine).
 *   3. Enable the "Places API (New)" — NOT the legacy "Places API".
 *      https://console.cloud.google.com/apis/library/places.googleapis.com
 *   4. APIs & Services → Credentials → Create credentials → API key.
 *      Restrict it to "Places API (New)" only.
 *   5. Add GOOGLE_PLACES_API_KEY=AIza... to .env.local
 *
 * COSTS:
 *   - Text Search: $32 per 1000 requests (after $200/mo free credit).
 *   - Place Details (Pro): $20 per 1000.
 *   - This script does ~1 text-search request per city + 1 details per result.
 *   - 30 cities × ~20 results = ~630 requests = well under the free tier.
 *
 * USAGE:
 *   node scripts/leads/places-search.mjs                # default 30 cities
 *   node scripts/leads/places-search.mjs --cities=10    # just first 10
 *   node scripts/leads/places-search.mjs --query="wedding videographer"  # broaden later
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = resolve(process.cwd());

// ---------- env loader ----------
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

if (!env.GOOGLE_PLACES_API_KEY) {
  console.error(
    "ERROR: GOOGLE_PLACES_API_KEY missing from .env.local.\n" +
      "See setup instructions at the top of this file."
  );
  process.exit(1);
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERROR: Supabase env vars missing.");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ---------- CLI args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  })
);
const QUERY_TEMPLATE = args.query || "wedding photographer in";
const MAX_CITIES = args.cities ? parseInt(args.cities, 10) : 30;
// Persona tag for the cron's template selector. Defaults to 'photographer'
// to preserve historical behavior; pass --lead-type=officiant when running
// the officiant query.
const LEAD_TYPE = args["lead-type"] || args.leadType || "photographer";

// ---------- target cities ----------
// Top US wedding metros by combined wedding-spend + photographer density.
// Ordered roughly by market size. Adjust as you learn what converts.
const CITIES = [
  { city: "New York", state: "NY" },
  { city: "Los Angeles", state: "CA" },
  { city: "Chicago", state: "IL" },
  { city: "Dallas", state: "TX" },
  { city: "Houston", state: "TX" },
  { city: "Austin", state: "TX" },
  { city: "Atlanta", state: "GA" },
  { city: "Miami", state: "FL" },
  { city: "Orlando", state: "FL" },
  { city: "Tampa", state: "FL" },
  { city: "Boston", state: "MA" },
  { city: "Philadelphia", state: "PA" },
  { city: "Washington", state: "DC" },
  { city: "San Francisco", state: "CA" },
  { city: "San Diego", state: "CA" },
  { city: "Seattle", state: "WA" },
  { city: "Portland", state: "OR" },
  { city: "Denver", state: "CO" },
  { city: "Phoenix", state: "AZ" },
  { city: "Nashville", state: "TN" },
  { city: "Charleston", state: "SC" },
  { city: "Savannah", state: "GA" },
  { city: "Asheville", state: "NC" },
  { city: "Charlotte", state: "NC" },
  { city: "Raleigh", state: "NC" },
  { city: "Minneapolis", state: "MN" },
  { city: "Detroit", state: "MI" },
  { city: "Pittsburgh", state: "PA" },
  { city: "Las Vegas", state: "NV" },
  { city: "Salt Lake City", state: "UT" },
].slice(0, MAX_CITIES);

// ---------- Places API (New) ----------
const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Field mask controls what we get back; smaller mask = cheaper request.
// "displayName,id,formattedAddress,websiteUri,nationalPhoneNumber,rating,userRatingCount"
// keeps us in the Pro pricing tier (~$32/1000) and includes website + phone
// in one call, avoiding a separate Details lookup.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
].join(",");

async function searchCity({ city, state }) {
  const textQuery = `${QUERY_TEMPLATE} ${city}, ${state}`;
  const res = await fetch(PLACES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      regionCode: "US",
      maxResultCount: 20, // hard max
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.places || [];
}

// ---------- main ----------
console.log(`\n=== Lead discovery (${LEAD_TYPE}) ===`);
console.log(`Query template: "${QUERY_TEMPLATE} {city}, {state}"`);
console.log(`Cities: ${CITIES.length}\n`);

let totalDiscovered = 0;
let totalInserted = 0;
let totalSkipped = 0;

for (const target of CITIES) {
  process.stdout.write(
    `  ${target.city}, ${target.state}`.padEnd(36)
  );
  let places;
  try {
    places = await searchCity(target);
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
    continue;
  }
  totalDiscovered += places.length;

  let cityInserted = 0;
  let citySkipped = 0;
  for (const p of places) {
    // Upsert by (source, external_id). On conflict do nothing so re-runs
    // don't blow away enrichment/email status set by later scripts.
    const row = {
      source: "google_places",
      external_id: p.id,
      business_name: p.displayName?.text || "Unknown",
      website: p.websiteUri || null,
      phone: p.nationalPhoneNumber || null,
      address: p.formattedAddress || null,
      city: target.city,
      state: target.state,
      rating: typeof p.rating === "number" ? p.rating : null,
      user_ratings_total:
        typeof p.userRatingCount === "number" ? p.userRatingCount : null,
      status: "new",
      lead_type: LEAD_TYPE,
    };
    const { error } = await supabase
      .from("photographer_leads")
      .insert(row);
    if (error) {
      // 23505 = duplicate key. Expected on re-runs; not a real error.
      if (error.code === "23505") {
        citySkipped++;
      } else {
        console.log(`\n    insert error: ${error.message}`);
      }
    } else {
      cityInserted++;
    }
  }
  totalInserted += cityInserted;
  totalSkipped += citySkipped;
  console.log(`found=${places.length}  new=${cityInserted}  dup=${citySkipped}`);
}

console.log(`\nDiscovered: ${totalDiscovered}`);
console.log(`Inserted:   ${totalInserted}`);
console.log(`Duplicates: ${totalSkipped} (already in DB from prior run)`);
console.log(
  `\nNext: node scripts/leads/scrape-emails.mjs to enrich with email addresses.\n`
);
