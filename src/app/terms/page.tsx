import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — SendForGood",
  description:
    "Read the Terms of Service for SendForGood, the prepaid legacy gift delivery service.",
};

export default function TermsPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-warm-gray">
          Last updated: March 25, 2026
        </p>

        <div className="mt-10 space-y-10 text-warm-gray leading-relaxed">
          {/* Welcome */}
          <div>
            <p>
              Welcome to SendForGood! These Terms of Service
              (&ldquo;Terms&rdquo;) govern your use of our website and services.
              By creating an account or placing an order, you agree to these
              Terms. We&rsquo;ve written them to be as clear and fair as
              possible &mdash; if anything is unclear, please reach out to us at{" "}
              <a
                href="mailto:support@sendforgood.com"
                className="font-medium text-navy underline decoration-gold underline-offset-4 hover:text-navy-light"
              >
                support@sendforgood.com
              </a>
              .
            </p>
          </div>

          {/* Service Description */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              What SendForGood Does
            </h2>
            <p className="mt-3">
              SendForGood is a prepaid gift delivery service. You choose a
              recipient, select a gift tier, and prepay for one or more years of
              gift deliveries. We then curate and ship a thoughtful gift to your
              recipient on each scheduled occasion &mdash; birthdays, holidays,
              anniversaries, or any date you choose.
            </p>
            <p className="mt-3">
              We carefully select each gift based on the tier you&rsquo;ve
              chosen. While specific items may vary to ensure freshness and
              quality, every gift will meet or exceed the value and standards of
              your selected tier.
            </p>
          </div>

          {/* Payment Terms */}
          <div>
            <h2 className="text-xl font-semibold text-navy">Payment Terms</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                All gift plans are <strong className="text-navy">prepaid</strong>{" "}
                at the time of purchase. The total amount covers the selected
                tier price multiplied by the number of years chosen.
              </li>
              <li>
                Payments are processed securely through Stripe. We accept all
                major credit and debit cards.
              </li>
              <li>
                <strong className="text-navy">Refund policy:</strong> You may
                request a full refund within 48 hours of purchase, provided no
                gifts have been shipped. Once a gift has been dispatched, the
                order (or that year&rsquo;s portion) is non-refundable.
              </li>
              <li>
                For multi-year plans where some gifts have already been
                delivered, refunds for remaining unshipped years may be
                considered on a case-by-case basis.
              </li>
            </ul>
          </div>

          {/* Gift Delivery SLA */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              Gift Delivery
            </h2>
            <p className="mt-3">
              We aim to deliver every gift within 5 business days of the
              scheduled occasion date. For first-year gifts, please allow up to
              10 business days for initial processing.
            </p>
            <p className="mt-3">
              If a delivery fails due to an incorrect or unreachable address, we
              will make reasonable efforts to contact you and reattempt delivery.
              We are not responsible for delays caused by shipping carriers,
              natural disasters, or other events beyond our control.
            </p>
          </div>

          {/* Legacy Gifting */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              Legacy Gifting &mdash; What Happens to Your Orders
            </h2>
            <p className="mt-3">
              One of the things that makes SendForGood special is that your love
              keeps arriving even if you&rsquo;re no longer here. Here&rsquo;s
              how we handle that:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                All prepaid gift plans will be fulfilled in their entirety,
                regardless of your account status.
              </li>
              <li>
                If your account becomes inactive (no login for 12 consecutive
                months), we will attempt to reach you via email. If
                unresponsive, your existing plans will continue to deliver as
                scheduled until all prepaid years are fulfilled.
              </li>
              <li>
                A designated emergency contact or legal representative may
                contact us to manage, update, or cancel remaining deliveries.
              </li>
              <li>
                We will never cancel a prepaid plan due to account inactivity
                alone. Your gifts will arrive as promised.
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-xl font-semibold text-navy">Your Account</h2>
            <p className="mt-3">
              You are responsible for maintaining the security of your account
              credentials. You must provide accurate and up-to-date recipient
              information, including shipping addresses, to ensure successful
              deliveries.
            </p>
            <p className="mt-3">
              You may update recipient addresses or cancel future deliveries
              through your dashboard at any time (subject to the refund policy
              above).
            </p>
          </div>

          {/* Limitation of Liability */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              Limitation of Liability
            </h2>
            <p className="mt-3">
              SendForGood provides its services &ldquo;as is.&rdquo; While we
              strive to deliver a wonderful experience with every gift, we
              cannot guarantee that specific items will be available or that
              deliveries will be uninterrupted.
            </p>
            <p className="mt-3">
              To the fullest extent permitted by law, SendForGood&rsquo;s total
              liability for any claim arising from your use of our services
              shall not exceed the amount you paid for the specific order in
              question.
            </p>
            <p className="mt-3">
              We are not liable for indirect, incidental, special, or
              consequential damages, including but not limited to emotional
              distress, lost profits, or missed occasions arising from delivery
              delays or failures.
            </p>
          </div>

          {/* Changes */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              Changes to These Terms
            </h2>
            <p className="mt-3">
              We may update these Terms from time to time. When we make material
              changes, we&rsquo;ll notify you by email or by posting a notice on
              our website. Continued use of our services after changes take
              effect constitutes your acceptance of the updated Terms.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-semibold text-navy">Contact Us</h2>
            <p className="mt-3">
              Questions about these Terms? We&rsquo;re here to help:
            </p>
            <p className="mt-3 font-medium text-navy">
              <a
                href="mailto:support@sendforgood.com"
                className="underline decoration-gold underline-offset-4 hover:text-navy-light"
              >
                support@sendforgood.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
