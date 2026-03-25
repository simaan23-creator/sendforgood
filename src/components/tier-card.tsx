"use client";

import { TIERS } from "@/lib/constants";

type Tier = (typeof TIERS)[number];

interface TierCardProps {
  tier: Tier;
  selected: boolean;
  onSelect: (tierId: Tier["id"]) => void;
  yearsCount: number;
}

export function TierCard({ tier, selected, onSelect, yearsCount }: TierCardProps) {
  const isPopular = "popular" in tier && tier.popular;
  const totalPrice = tier.price * yearsCount;

  return (
    <button
      type="button"
      onClick={() => onSelect(tier.id)}
      className={`
        relative flex flex-col rounded-2xl border-2 p-6 text-left
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-lg
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold
        ${
          selected
            ? "border-gold bg-cream shadow-md ring-1 ring-gold/20"
            : "border-cream-dark bg-white hover:border-gold/40"
        }
      `}
    >
      {/* Popular Badge */}
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-gold px-3 py-0.5 text-xs font-semibold text-navy shadow-sm">
          Most Popular
        </span>
      )}

      {/* Tier Name */}
      <h3 className="text-lg font-bold text-navy">{tier.name}</h3>

      {/* Price */}
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-navy tracking-tight">
          ${tier.price}
        </span>
        <span className="text-sm text-warm-gray">/yr</span>
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-warm-gray leading-relaxed">
        {tier.description}
      </p>

      {/* Features */}
      <ul className="mt-4 flex-1 space-y-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-navy/80">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="mt-0.5 shrink-0 text-forest"
              aria-hidden="true"
            >
              <path
                d="M13.333 4L6 11.333 2.667 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Total Price */}
      <div className="mt-6 pt-4 border-t border-cream-dark">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-warm-gray">
            Total for {yearsCount} {yearsCount === 1 ? "year" : "years"}
          </span>
          <span className="text-lg font-bold text-navy">${totalPrice}</span>
        </div>
      </div>

      {/* Selection Indicator */}
      <div
        className={`
          mt-4 w-full rounded-lg py-2 text-center text-sm font-semibold transition-colors duration-150
          ${
            selected
              ? "bg-navy text-cream"
              : "bg-cream-dark text-navy/60"
          }
        `}
      >
        {selected ? "Selected" : "Select Plan"}
      </div>
    </button>
  );
}
