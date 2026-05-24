#!/usr/bin/env node
/**
 * Creates the SealTheDay Purchase (Website) conversion action in the
 * SealTheDay Ads sub-account (1884911376), and returns the gtag snippet
 * so we can extract the conversion label for NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE.
 *
 * Usage:
 *   node scripts/google-ads/create-sealtheday-purchase.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleAdsApi, enums } from "google-ads-api";

const ROOT = resolve(process.cwd());

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);
const oauth = JSON.parse(
  readFileSync(resolve(ROOT, "google-ads-oauth.json"), "utf8")
).installed;
const token = JSON.parse(
  readFileSync(resolve(ROOT, "google-ads-token.json"), "utf8")
);

const client = new GoogleAdsApi({
  client_id: oauth.client_id,
  client_secret: oauth.client_secret,
  developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

const customer = client.Customer({
  customer_id: env.GOOGLE_ADS_CUSTOMER_ID,
  login_customer_id: env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  refresh_token: token.refresh_token,
});

const NAME = "SealTheDay Purchase (Website)";

// Check if it already exists (idempotency)
const existing = await customer.query(`
  SELECT conversion_action.id, conversion_action.name, conversion_action.resource_name
  FROM conversion_action
  WHERE conversion_action.name = '${NAME}'
`);
if (existing.length > 0) {
  console.log(`[skip] Conversion action already exists:`);
  console.log(`       ${existing[0].conversion_action.resource_name}`);
  console.log(`\nFetching tag snippet anyway...`);
  await printTagSnippet(existing[0].conversion_action.resource_name);
  process.exit(0);
}

console.log(`Creating "${NAME}"...`);
const created = await customer.conversionActions.create([
  {
    name: NAME,
    type: enums.ConversionActionType.WEBPAGE,
    category: enums.ConversionActionCategory.PURCHASE,
    status: enums.ConversionActionStatus.ENABLED,
    primary_for_goal: true,
    counting_type: enums.ConversionActionCountingType.ONE_PER_CLICK,
    click_through_lookback_window_days: 30,
    view_through_lookback_window_days: 1,
    value_settings: {
      default_value: 25,
      default_currency_code: "USD",
      always_use_default_value: false,
    },
    attribution_model_settings: {
      attribution_model: enums.AttributionModel.GOOGLE_ADS_LAST_CLICK,
    },
  },
]);
const resourceName = created.results[0].resource_name;
console.log(`[ok] Created: ${resourceName}\n`);

await printTagSnippet(resourceName);

async function printTagSnippet(resourceName) {
  const rows = await customer.query(`
    SELECT
      conversion_action.id,
      conversion_action.resource_name,
      conversion_action.tag_snippets
    FROM conversion_action
    WHERE conversion_action.resource_name = '${resourceName}'
  `);
  const ca = rows[0].conversion_action;
  console.log("Tag snippets:\n");
  for (const snip of ca.tag_snippets || []) {
    console.log(`-- type=${snip.type}  page_format=${snip.page_format} --`);
    console.log("GLOBAL SITE TAG:");
    console.log(snip.global_site_tag);
    console.log("\nEVENT SNIPPET:");
    console.log(snip.event_snippet);
    console.log("");
  }

  // Extract conversion label from event snippet
  for (const snip of ca.tag_snippets || []) {
    const match =
      snip.event_snippet &&
      snip.event_snippet.match(/AW-\d+\/([A-Za-z0-9_\-]+)/);
    if (match) {
      console.log(`\n=== CONVERSION LABEL ===`);
      console.log(`Full ID:  ${match[0]}`);
      console.log(`Label:    ${match[1]}`);
      console.log(`\nAdd to Vercel:`);
      console.log(`  NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE=${match[1]}`);
      break;
    }
  }
}
