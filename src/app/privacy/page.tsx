import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SendForGood",
  description:
    "Learn how SendForGood collects, uses, and protects your personal information. Your privacy matters to us.",
};

export default function PrivacyPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-warm-gray">
          Last updated: March 25, 2026
        </p>

        <div className="mt-10 space-y-10 text-warm-gray leading-relaxed">
          {/* Introduction */}
          <div>
            <p>
              SendForGood (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) is committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our website and services at
              sendforgood.com.
            </p>
          </div>

          {/* Data We Collect */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              Information We Collect
            </h2>
            <p className="mt-3">
              We collect the following types of information to provide and
              improve our gift delivery service:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-navy">Account information:</strong>{" "}
                Your name, email address, and authentication credentials when
                you create an account.
              </li>
              <li>
                <strong className="text-navy">Recipient details:</strong>{" "}
                Names, shipping addresses, and occasion dates for your gift
                recipients.
              </li>
              <li>
                <strong className="text-navy">Payment information:</strong>{" "}
                Billing details processed securely through Stripe. We do not
                store your full credit card number on our servers.
              </li>
              <li>
                <strong className="text-navy">Communications:</strong> Messages
                you send us through our contact form or email.
              </li>
              <li>
                <strong className="text-navy">Usage data:</strong> Information
                about how you interact with our website, including pages
                visited and actions taken.
              </li>
            </ul>
          </div>

          {/* How We Use It */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              How We Use Your Information
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                To process and fulfill your gift orders, including scheduling
                and delivering gifts to your recipients.
              </li>
              <li>
                To manage your account and provide customer support.
              </li>
              <li>
                To send you order confirmations, delivery updates, and service
                notifications via email.
              </li>
              <li>
                To process payments and prevent fraud.
              </li>
              <li>
                To improve our website, services, and overall user experience.
              </li>
            </ul>
          </div>

          {/* Third-Party Services */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              Third-Party Services
            </h2>
            <p className="mt-3">
              We work with trusted third-party providers to deliver our
              services. These partners only access your data as needed to
              perform their functions:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-navy">Stripe</strong> &mdash; Processes
                all payments securely. Stripe&rsquo;s privacy policy governs
                how they handle your payment information.
              </li>
              <li>
                <strong className="text-navy">Supabase</strong> &mdash; Hosts
                our database and authentication services. Your account data and
                order records are stored securely on Supabase infrastructure.
              </li>
              <li>
                <strong className="text-navy">Resend</strong> &mdash; Delivers
                transactional emails such as order confirmations and delivery
                notifications on our behalf.
              </li>
            </ul>
          </div>

          {/* Data Retention */}
          <div>
            <h2 className="text-xl font-semibold text-navy">
              Data Retention
            </h2>
            <p className="mt-3">
              We retain your personal information for as long as your account is
              active or as needed to provide our services. For legacy gifting
              plans, we retain recipient and delivery information for the full
              duration of the gift plan to ensure all scheduled gifts are
              delivered.
            </p>
            <p className="mt-3">
              If you request account deletion, we will remove your personal data
              within 30 days, except where we are required to retain certain
              information for legal or operational purposes (such as completing
              prepaid gift deliveries).
            </p>
          </div>

          {/* Your Rights */}
          <div>
            <h2 className="text-xl font-semibold text-navy">Your Rights</h2>
            <p className="mt-3">You have the right to:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Access and receive a copy of your personal data.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and personal data.</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h2 className="text-xl font-semibold text-navy">Security</h2>
            <p className="mt-3">
              We implement appropriate technical and organizational measures to
              protect your personal information. All data is transmitted over
              encrypted connections (TLS/SSL), and we regularly review our
              security practices.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-semibold text-navy">Contact Us</h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy or how we handle
              your data, please contact us at:
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
