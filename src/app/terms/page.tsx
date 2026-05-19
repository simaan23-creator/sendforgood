import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service \u2014 SealTheDay",
  description:
    "Terms of Service for the SealTheDay wedding memory vault.",
};

export default function TermsPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-warm-gray">Last updated: May 13, 2026</p>

        <div className="mt-10 space-y-10 text-warm-gray leading-relaxed">
          <div>
            <p>
              These Terms govern your use of SealTheDay at sealtheday.com. By
              creating an account, purchasing a vault, or submitting a
              recording to someone&rsquo;s vault, you agree to these Terms.
              Questions:{" "}
              <a
                href="mailto:support@sealtheday.com"
                className="font-medium text-navy underline decoration-gold underline-offset-4 hover:text-navy-light"
              >
                support@sealtheday.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              What SealTheDay Does
            </h2>
            <p className="mt-3">
              SealTheDay is a digital memory vault. As a vault owner, you pay a
              one-time vault fee and purchase recording slots. You share a link
              with your guests, who record video, audio, or upload photos that
              get stored in your vault. You choose a seal date; on that date the
              vault unlocks and you can view everything inside.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              Pricing &amp; Payment
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>$10 one-time vault fee per new vault.</li>
              <li>
                $1 per video slot, $0.25 per audio slot, $0.25 per photo slot.
              </li>
              <li>All charges are processed up front via Stripe.</li>
              <li>Slots never expire. There is no subscription.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Refund Policy</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                The $10 vault fee is refundable within 48 hours of purchase, as
                long as no guest has submitted to the vault.
              </li>
              <li>
                Unused recording slots are refundable at any time before the
                vault is sealed.
              </li>
              <li>
                Used recording slots (a slot is &ldquo;used&rdquo; the moment a
                guest successfully uploads to it) are non-refundable.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Guest Content</h2>
            <p className="mt-3">
              Guests retain ownership of the recordings they upload but grant
              you (the vault owner) a perpetual, worldwide license to store,
              view, download, and share that content. Guests grant SealTheDay a
              limited license to host, transmit, and transcode that content as
              needed to operate the service.
            </p>
            <p className="mt-3">
              We do not pre-screen submissions. Guests are responsible for what
              they upload. If a submission is illegal, infringes copyright, or
              violates these Terms, we may remove it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Acceptable Use</h2>
            <p className="mt-3">You agree not to use SealTheDay to:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Upload anything illegal, harassing, hateful, sexually explicit,
                or that infringes someone else&rsquo;s rights.
              </li>
              <li>Impersonate another person without consent.</li>
              <li>
                Disrupt, probe, or attempt to circumvent our security.
              </li>
            </ul>
            <p className="mt-3">
              We may suspend or terminate accounts that violate this section
              without refund for already-used slots.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">The Seal</h2>
            <p className="mt-3">
              You select a seal date when creating your vault. Until that date,
              the contents are locked even to you. We use commercially
              reasonable measures to enforce the seal but cannot guarantee that
              human error, legal compulsion, or technical failure will never
              cause early access. The seal is a feature of the product, not a
              cryptographic guarantee.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              Storage &amp; Availability
            </h2>
            <p className="mt-3">
              We aim for 99.9% uptime but do not guarantee uninterrupted
              service. We retain your vault and its contents until you delete
              it or close your account. We recommend downloading a backup copy
              once your vault unlocks.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">Your Account</h2>
            <p className="mt-3">
              You are responsible for safeguarding your account credentials and
              for all activity that occurs under your account. Notify us
              immediately of any unauthorized access.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              Limitation of Liability
            </h2>
            <p className="mt-3">
              SealTheDay is provided &ldquo;as is.&rdquo; To the fullest extent
              permitted by law, our total liability for any claim arising from
              your use of the service shall not exceed the amount you paid for
              the vault and slots in question. We are not liable for indirect,
              incidental, special, or consequential damages &mdash; including
              lost data, lost content, or missed unlock dates.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              Changes to These Terms
            </h2>
            <p className="mt-3">
              We may update these Terms. Material changes will be announced by
              email or by notice on the site. Continued use after changes take
              effect constitutes acceptance.
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
