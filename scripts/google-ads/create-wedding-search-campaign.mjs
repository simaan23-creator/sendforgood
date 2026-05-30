#!/usr/bin/env node
/**
 * Creates a PAUSED Google Ads Search campaign targeting wedding-day
 * memory-capture intent, pointing at https://sealtheday.com/wedding.
 *
 * Stays PAUSED so the user can review budget, keywords, and ad copy
 * inside the Google Ads UI before activating.
 *
 * Idempotent: skips campaign / budget / ad group / keyword creation
 * when an object with the same name already exists.
 *
 * Usage:
 *   node scripts/google-ads/create-wedding-search-campaign.mjs
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

// ---------- config ----------
const CAMPAIGN_NAME = "SealTheDay — Wedding Memories (Search) [PAUSED draft]";
const BUDGET_NAME = "SealTheDay Wedding Search Budget";
const DAILY_BUDGET_USD = 20; // user-confirmed monthly target ~$600
const DEFAULT_CPC_USD = 1.5; // Manual CPC default bid; raise per-keyword in UI
const FINAL_URL = "https://sealtheday.com/wedding";

// Campaign-level negative keywords. Phrase match so close variants are also blocked.
// Categories: industry overlap (photographer/venue/dress/planner), price-sensitive
// (free/diy/template/cheap), wrong intent (lyrics/song/vows/speech).
const NEGATIVE_KEYWORDS = [
  "photographer",
  "videographer",
  "venue",
  "venues",
  "dress",
  "dresses",
  "planner",
  "planning",
  "florist",
  "flowers",
  "cake",
  "catering",
  "caterer",
  "dj",
  "officiant",
  "ring",
  "rings",
  "invitation",
  "invitations",
  "gift",
  "gifts",
  "free",
  "diy",
  "template",
  "templates",
  "cheap",
  "lyrics",
  "song",
  "songs",
  "vows",
  "speech",
  "speeches",
  "quotes",
  "ideas",
  "decoration",
  "decorations",
  "favors",
  "registry",
  "honeymoon",
  "bachelorette",
  "bachelor",
  "engagement",
];

// One ad group per intent cluster. Keywords use phrase match by default —
// safer than broad while still picking up close variants.
const AD_GROUPS = [
  {
    name: "Wedding memory app",
    keywords: [
      "wedding memory app",
      "wedding memory book app",
      "digital wedding memory book",
      "wedding keepsake app",
      "wedding time capsule app",
    ],
  },
  {
    name: "Guest video / message collection",
    keywords: [
      "collect wedding videos from guests",
      "wedding guest video messages",
      "wedding guest video book",
      "wedding video guestbook",
      "video guest book wedding",
      "wedding well wishes video",
    ],
  },
  {
    name: "Wedding QR / table cards",
    keywords: [
      "wedding qr code guestbook",
      "wedding qr code video",
      "qr code wedding table cards",
      "wedding reception qr code",
    ],
  },
  {
    name: "Alternative to hashtag / photo sharing",
    keywords: [
      "wedding hashtag alternative",
      "wedding photo sharing app",
      "wedding guest photo app",
      "wedding photo collection app",
    ],
  },
];

// Responsive Search Ad — Google will mix and match these.
// Headlines: 3–15 (max 30 chars each). Descriptions: 2–4 (max 90 chars each).
const RSA = {
  headlines: [
    "Wedding Memory Vault",
    "Capture Every Guest's Words",
    "Video Guest Book in 60 Sec",
    "No App. Just a QR Code.",
    "Sealed Until Your Anniversary",
    "Starter Pack $99.95",
    "50 Video + 200 Photo Slots",
    "Built After Our Photog Ghosted",
    "Your Day, Permanently Sealed",
    "Guests Record, You Watch Later",
    "More Than a Hashtag",
    "Replace Your Wedding Hashtag",
  ],
  descriptions: [
    "Guests scan a QR card and leave a 60-second video or voice memory. No app required.",
    "Seal the vault until your morning-after, first anniversary, or 10th. Permanently yours.",
    "Starter Pack: 1 vault + 50 video + 200 photo slots for $99.95. 48-hour refund window.",
    "Built by a groom whose photographer ghosted on his wedding day. Never lose the day again.",
  ],
  path1: "wedding",
  path2: "memories",
};

// ---------- helpers ----------
function microsFromUsd(usd) {
  return Math.round(usd * 1_000_000);
}

async function findByName(resource, nameField, name) {
  const rows = await customer.query(
    `SELECT ${resource}.resource_name, ${resource}.${nameField} ` +
      `FROM ${resource} ` +
      `WHERE ${resource}.${nameField} = '${name.replace(/'/g, "\\'")}'`
  );
  return rows[0]?.[resource]?.resource_name || null;
}

// ---------- 1. Campaign budget ----------
let budgetResource = await findByName("campaign_budget", "name", BUDGET_NAME);
if (budgetResource) {
  console.log(`[skip] Budget already exists: ${budgetResource}`);
} else {
  console.log(`Creating budget "${BUDGET_NAME}" ($${DAILY_BUDGET_USD}/day)...`);
  const out = await customer.campaignBudgets.create([
    {
      name: BUDGET_NAME,
      amount_micros: microsFromUsd(DAILY_BUDGET_USD),
      delivery_method: enums.BudgetDeliveryMethod.STANDARD,
      explicitly_shared: false,
    },
  ]);
  budgetResource = out.results[0].resource_name;
  console.log(`[ok] Budget: ${budgetResource}`);
}

// ---------- 2. Campaign (PAUSED, Search) ----------
let campaignResource = await findByName("campaign", "name", CAMPAIGN_NAME);
if (campaignResource) {
  console.log(`[skip] Campaign already exists: ${campaignResource}`);
} else {
  console.log(`Creating campaign "${CAMPAIGN_NAME}" (PAUSED)...`);
  const out = await customer.campaigns.create([
    {
      name: CAMPAIGN_NAME,
      status: enums.CampaignStatus.PAUSED,
      advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
      campaign_budget: budgetResource,
      // Manual CPC for the first ~30 conversions so we control spend. Switch to
      // Maximize Conversions or Target CPA after we have enough conversion
      // history for Smart Bidding to optimize against.
      manual_cpc: { enhanced_cpc_enabled: false },
      // Required by Google Ads API as of 2025-EU DSA compliance.
      // 3 = DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING.
      contains_eu_political_advertising: 3,
      network_settings: {
        target_google_search: true,
        target_search_network: true,
        target_content_network: false,
        target_partner_search_network: false,
      },
      // Start date defaults to today, no end date.
    },
  ]);
  campaignResource = out.results[0].resource_name;
  console.log(`[ok] Campaign: ${campaignResource}`);
}

// ---------- 3. Geo targeting: US + Canada ----------
// 2840 = United States, 2124 = Canada (Google Ads geo-target constants).
const existingGeos = await customer.query(`
  SELECT campaign_criterion.resource_name, campaign_criterion.location.geo_target_constant
  FROM campaign_criterion
  WHERE campaign_criterion.campaign = '${campaignResource}'
    AND campaign_criterion.type = 'LOCATION'
`);
const haveGeos = new Set(
  existingGeos.map((r) => r.campaign_criterion?.location?.geo_target_constant)
);
const wantedGeos = [
  { gtc: "geoTargetConstants/2840", label: "United States" },
];
const geoOps = wantedGeos
  .filter((g) => !haveGeos.has(g.gtc))
  .map((g) => ({
    campaign: campaignResource,
    location: { geo_target_constant: g.gtc },
  }));
if (geoOps.length) {
  console.log(`Adding geo targets: ${geoOps.map((g) => g.location.geo_target_constant).join(", ")}`);
  await customer.campaignCriteria.create(geoOps);
  console.log(`[ok] Geo targets added`);
} else {
  console.log(`[skip] Geo targets already present`);
}

// ---------- 4. Language: English (1000) ----------
const existingLangs = await customer.query(`
  SELECT campaign_criterion.resource_name
  FROM campaign_criterion
  WHERE campaign_criterion.campaign = '${campaignResource}'
    AND campaign_criterion.type = 'LANGUAGE'
`);
if (existingLangs.length === 0) {
  console.log(`Adding language: English`);
  await customer.campaignCriteria.create([
    {
      campaign: campaignResource,
      language: { language_constant: "languageConstants/1000" },
    },
  ]);
  console.log(`[ok] Language added`);
} else {
  console.log(`[skip] Language already set`);
}

// ---------- 4b. Campaign-level negative keywords ----------
const existingNegs = await customer.query(`
  SELECT campaign_criterion.keyword.text
  FROM campaign_criterion
  WHERE campaign_criterion.campaign = '${campaignResource}'
    AND campaign_criterion.type = 'KEYWORD'
    AND campaign_criterion.negative = TRUE
`);
const haveNegs = new Set(
  existingNegs.map((r) => r.campaign_criterion?.keyword?.text?.toLowerCase())
);
const negOps = NEGATIVE_KEYWORDS
  .filter((k) => !haveNegs.has(k.toLowerCase()))
  .map((k) => ({
    campaign: campaignResource,
    negative: true,
    keyword: {
      text: k,
      match_type: enums.KeywordMatchType.PHRASE,
    },
  }));
if (negOps.length) {
  console.log(`Adding ${negOps.length} negative keyword(s) at campaign level...`);
  await customer.campaignCriteria.create(negOps);
  console.log(`[ok] Negative keywords added`);
} else {
  console.log(`[skip] All negative keywords already present`);
}

// ---------- 5. Ad groups + keywords + RSA ----------
for (const ag of AD_GROUPS) {
  const fullName = `${CAMPAIGN_NAME} — ${ag.name}`;
  let agResource = await findByName("ad_group", "name", fullName);
  if (agResource) {
    console.log(`[skip] Ad group already exists: ${ag.name}`);
  } else {
    console.log(`Creating ad group: ${ag.name}`);
    const out = await customer.adGroups.create([
      {
        name: fullName,
        campaign: campaignResource,
        status: enums.AdGroupStatus.ENABLED,
        type: enums.AdGroupType.SEARCH_STANDARD,
        cpc_bid_micros: microsFromUsd(DEFAULT_CPC_USD),
      },
    ]);
    agResource = out.results[0].resource_name;
    console.log(`[ok] Ad group: ${agResource}`);
  }

  // Keywords (phrase match)
  const existingKws = await customer.query(`
    SELECT ad_group_criterion.keyword.text
    FROM ad_group_criterion
    WHERE ad_group_criterion.ad_group = '${agResource}'
      AND ad_group_criterion.type = 'KEYWORD'
  `);
  const haveKws = new Set(
    existingKws.map((r) => r.ad_group_criterion?.keyword?.text?.toLowerCase())
  );
  const kwOps = ag.keywords
    .filter((k) => !haveKws.has(k.toLowerCase()))
    .map((k) => ({
      ad_group: agResource,
      status: enums.AdGroupCriterionStatus.ENABLED,
      keyword: {
        text: k,
        match_type: enums.KeywordMatchType.PHRASE,
      },
    }));
  if (kwOps.length) {
    await customer.adGroupCriteria.create(kwOps);
    console.log(`[ok] Added ${kwOps.length} keyword(s)`);
  } else {
    console.log(`[skip] All keywords already present`);
  }

  // Responsive Search Ad (one per ad group)
  const existingAds = await customer.query(`
    SELECT ad_group_ad.ad.id, ad_group_ad.ad.type
    FROM ad_group_ad
    WHERE ad_group_ad.ad_group = '${agResource}'
      AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
  `);
  if (existingAds.length > 0) {
    console.log(`[skip] RSA already exists in ad group`);
  } else {
    console.log(`Creating RSA in ad group...`);
    await customer.adGroupAds.create([
      {
        ad_group: agResource,
        status: enums.AdGroupAdStatus.ENABLED,
        ad: {
          final_urls: [FINAL_URL],
          responsive_search_ad: {
            headlines: RSA.headlines.map((t) => ({ text: t })),
            descriptions: RSA.descriptions.map((t) => ({ text: t })),
            path1: RSA.path1,
            path2: RSA.path2,
          },
        },
      },
    ]);
    console.log(`[ok] RSA created`);
  }
}

console.log(`\n=== DONE ===`);
console.log(`Campaign: ${campaignResource}`);
console.log(`Status:   PAUSED — review and activate manually in Google Ads UI.`);
console.log(`URL:      https://ads.google.com/aw/campaigns?campaignId=...`);
console.log(`\nBefore activating:`);
console.log(`  1. Review keyword match types and bids`);
console.log(`  2. Confirm conversion tracking is firing on /vault/success`);
console.log(`  3. Raise daily budget if you want more impressions`);
console.log(`  4. Add negative keywords (e.g. "free", "diy", "template") if needed`);
