import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy \u2014 SealTheDay",
  description:
    "How SealTheDay collects, uses, and protects your information when you create a wedding memory vault.",
};

export default function PrivacyPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-warm-gray">Last updated: May 13, 2026</p>

        <div className="mt-10 space-y-10 text-warm-gray leading-relaxed">
          <div>
            <p>
              SealTheDay (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
              operates sealtheday.com, a wedding memory vault service. This policy
              explains what information we collect when you (the vault owner)
              create a vault and when your guests submit recordings, and how we
              protect it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              Information We Collect from Vault Owners
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-navy">Account information:</strong> your
                name, email, and authentication credentials.
              </li>
              <li>
                <strong className="text-navy">Vault settings:</strong> the vault
                title, occasion, seal date, and recording-slot quantities you
                purchase.
              </li>
              <li>
                <strong className="text-navy">Payment information:</strong>{" "}
                billing details processed by Stripe. We never see or store full
                card numbers.
              </li>
              <li>
                <strong className="text-navy">Usage data:</strong> standard
                server logs and basic analytics about how you use the dashboard.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              Information We Collect from Guests Submitting to a Vault
            </h2>
            <p className="mt-3">
              When a guest opens a vault link to leave a recording, we collect:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                The name they type in (optional &mdash; they may submit
                anonymously).
              </li>
              <li>The video, audio, or photo they choose to upload.</li>
              <li>
                The IP address and basic device metadata of the device used to
                upload, retained for fraud prevention.
              </li>
            </ul>
            <p className="mt-3">
              Guests do not need to create an account. We do not collect a
              guest&rsquo;s email unless they choose to provide it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              How We Use This Information
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                To create, store, seal, and unlock your vault on the date you
                select.
              </li>
              <li>
                To deliver email notifications about vault activity and
                unlocking.
              </li>
              <li>To process payment and prevent fraud.</li>
              <li>To respond to your support requests.</li>
              <li>To improve our service.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              The Seal &mdash; What &ldquo;Locked&rdquo; Means
            </h2>
            <p className="mt-3">
              Once a vault is sealed, the recordings inside it are not visible
              to the vault owner, the guests, or SealTheDay support staff in the
              normal course of business until the seal date passes. Our staff
              retains the technical ability to access data for legal compliance,
              safety review, or to honor a verified take-down request, but
              routine support cannot &ldquo;preview&rdquo; a sealed vault.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              Third-Party Services
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-navy">Stripe</strong> &mdash; processes
                all payments.
              </li>
              <li>
                <strong className="text-navy">Supabase</strong> &mdash; hosts
                our database, authentication, and storage for vault media.
              </li>
              <li>
                <strong className="text-navy">Resend</strong> &mdash; delivers
                transactional email (purchase receipts, unlock notifications).
              </li>
              <li>
                <strong className="text-navy">
                  Google Analytics &amp; Google Ads
                </strong>{" "}
                &mdash; load only after you accept cookies, and respect Consent
                Mode v2.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Data Retention</h2>
            <p className="mt-3">
              Vault media is stored indefinitely so it is available when your
              vault unlocks. If you delete your vault from the dashboard, all
              associated media is removed from our storage within 30 days. If
              you delete your account, all your vaults and their media are
              removed within 30 days.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Your Rights</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Access and download a copy of your data.</li>
              <li>Correct inaccurate information.</li>
              <li>Delete your vaults and account.</li>
              <li>Opt out of non-essential email.</li>
            </ul>
            <p className="mt-3">
              Guests who submitted to a vault may also request removal of their
              specific submission by emailing support@sealtheday.com with proof
              of the upload (the vault link plus the name or timestamp on the
              submission).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Security</h2>
            <p className="mt-3">
              All data is transmitted over TLS. Media is stored on
              Supabase&rsquo;s infrastructure with access scoped to your
              account. We follow industry-standard security practices but
              cannot guarantee absolute security of any internet service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Children</h2>
            <p className="mt-3">
              SealTheDay is not directed to children under 13 and we do not
              knowingly collect data from them. If you believe a child has
              submitted to a vault, contact us and we will remove the
              submission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Contact Us</h2>
            <p className="mt-3 font-medium text-navy">
              <a
                href="mailto:support@sealtheday.com"
                className="underline decoration-gold underline-offset-4 hover:text-navy-light"
              >
                support@sealtheday.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
