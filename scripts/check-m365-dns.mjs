#!/usr/bin/env node
/**
 * Verifies that Microsoft 365 DNS records are present on sealtheday.com.
 * After GoDaddy provisions an M365 mailbox, these records should auto-populate:
 *   - MX:     sealtheday-com.mail.protection.outlook.com
 *   - TXT SPF: v=spf1 include:spf.protection.outlook.com ...
 *   - CNAME autodiscover: autodiscover.outlook.com
 *   - CNAME selector1._domainkey -> selector1-sealtheday-com._domainkey.<tenant>.onmicrosoft.com
 *   - CNAME selector2._domainkey -> selector2-sealtheday-com._domainkey.<tenant>.onmicrosoft.com
 *
 * Usage:
 *   node scripts/check-m365-dns.mjs
 */

import { promises as dns } from "node:dns";

const DOMAIN = "sealtheday.com";

const checks = [
  { type: "MX", name: DOMAIN, expect: /mail\.protection\.outlook\.com/i },
  { type: "TXT", name: DOMAIN, expect: /spf\.protection\.outlook\.com/i, label: "SPF (include Outlook)" },
  { type: "CNAME", name: `autodiscover.${DOMAIN}`, expect: /autodiscover\.outlook\.com/i },
  { type: "CNAME", name: `selector1._domainkey.${DOMAIN}`, expect: /selector1-.*onmicrosoft\.com/i, label: "DKIM selector1" },
  { type: "CNAME", name: `selector2._domainkey.${DOMAIN}`, expect: /selector2-.*onmicrosoft\.com/i, label: "DKIM selector2" },
  { type: "TXT", name: `_dmarc.${DOMAIN}`, expect: /v=DMARC1/i, label: "DMARC" },
];

console.log(`Checking M365 DNS on ${DOMAIN}\n`);

for (const c of checks) {
  const label = c.label || c.type;
  try {
    let records;
    if (c.type === "MX") records = await dns.resolveMx(c.name);
    else if (c.type === "TXT") records = await dns.resolveTxt(c.name);
    else if (c.type === "CNAME") records = await dns.resolveCname(c.name);

    const flat = records
      .map((r) => (Array.isArray(r) ? r.join("") : typeof r === "object" ? r.exchange || JSON.stringify(r) : r))
      .join(" | ");
    const ok = c.expect.test(flat);
    console.log(`  [${ok ? "OK  " : "MISS"}] ${label.padEnd(20)} ${c.name}`);
    console.log(`         -> ${flat}\n`);
  } catch (e) {
    console.log(`  [FAIL] ${label.padEnd(20)} ${c.name}`);
    console.log(`         -> ${e.code || e.message}\n`);
  }
}
