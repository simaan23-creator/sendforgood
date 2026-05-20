import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog \u2014 SealTheDay",
  description:
    "Stories, guides, and ideas for sealing your wedding day in a way you can open years from now.",
};

const TEASER_ARTICLES = [
  {
    title: "What Is a Wedding Vault?",
    excerpt:
      "Your photographer captures what the day looked like. Your videographer captures how it moved. A wedding vault captures what your guests actually felt \u2014 sealed until the date you choose to open it.",
    tag: "Vault 101",
  },
  {
    title: "How to Use Your Wedding Vault at the Reception",
    excerpt:
      "A QR code on the welcome sign. A note in the program. A toast cue from the MC. Five painless ways to invite every guest to contribute to your vault without disrupting the night.",
    tag: "Guide",
  },
  {
    title: "Choosing Your Open Date",
    excerpt:
      "First anniversary, fifth, tenth, twenty-fifth. The day you have your first child. Every open date tells a different story \u2014 here is how couples are choosing theirs.",
    tag: "Ideas",
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
            Stories, guides, and ideas for the wedding vault. Coming soon.
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-12 rounded-xl border border-gold/30 bg-gold/5 p-6 text-center">
          <p className="text-sm font-medium text-gold-dark">
            We&rsquo;re writing our first articles with the same care we put
            into every vault. Check back soon.
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
