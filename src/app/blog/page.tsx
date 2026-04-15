import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — SendForGood",
  description:
    "Stories, guides, and insights about legacy gifting, gifts, and making every occasion meaningful.",
};

const TEASER_ARTICLES = [
  {
    title: "The Art of Legacy Gifting",
    excerpt:
      "What does it mean to give a gift that outlasts you? We explore the emotional power of gifts and why more families are sending them they can assign whenever they are ready.",
    tag: "Legacy",
  },
  {
    title: "Why SendForGood Changes Everything",
    excerpt:
      "In a world of subscriptions and auto-renewals, there's something beautifully intentional about sending gifts you control. No rush, no pressure \u2014 assign recipients from your dashboard whenever you are ready.",
    tag: "Gifting",
  },
  {
    title: "How to Choose the Perfect Gift Tier",
    excerpt:
      "From a heartfelt greeting card to a luxury curated experience — how to pick the right SendForGood tier for every recipient and occasion.",
    tag: "Guide",
  },
];

export default function BlogPage() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Blog</h1>
          <p className="mt-3 text-lg text-warm-gray">
            Stories and guides about gifting with heart. Coming soon.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-12 rounded-xl border border-gold/30 bg-gold/5 p-6 text-center">
          <p className="text-sm font-medium text-gold-dark">
            We&rsquo;re crafting our first articles with the same care we put
            into every gift. Check back soon!
          </p>
        </div>

        {/* Teaser Cards */}
        <div className="mt-12 space-y-6">
          {TEASER_ARTICLES.map((article) => (
            <article
              key={article.title}
              className="rounded-2xl border border-cream-dark bg-white p-8 shadow-md"
            >
              <span className="inline-block rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold uppercase tracking-wider text-warm-gray">
                {article.tag}
              </span>
              <h2 className="mt-4 text-xl font-bold">{article.title}</h2>
              <p className="mt-2 leading-relaxed text-warm-gray">
                {article.excerpt}
              </p>
              <p className="mt-4 text-sm font-medium text-gold-dark">
                Coming soon
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
