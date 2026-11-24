import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown } from 'lucide-react';
import {
  formatUsd,
  getDisplayPrice,
  PINOC_PLANS,
  VIGGLE_AI_PLANS,
  type BillingPeriod,
  type PricingProduct,
} from '../utils/viggleLogic';
import { COMPARISON_ROWS, PRICING_FAQS } from '../data/viggleData';
import { PartnerLogos } from './PartnerLogos';

interface PricingPageProps {
  onNavigate: (path: string) => void;
}

export function PricingPage({ onNavigate }: PricingPageProps) {
  const [product, setProduct] = useState<PricingProduct>('viggle-ai');
  const [billing, setBilling] = useState<BillingPeriod>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedPlanNotice, setSelectedPlanNotice] = useState<string | null>(null);

  const plans = product === 'viggle-ai' ? VIGGLE_AI_PLANS : PINOC_PLANS;

  return (
    <div className="w-full pt-28">
      {/* Top Hero */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-14 pb-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6b645c] dark:text-[#a39c93] mb-3">
          Pricing
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <h1 className="lg:col-span-8 text-[clamp(2.5rem,4.8vw,4rem)] font-medium leading-[1.05] tracking-[-0.03em] text-balance">
            Choose the plan that keeps up with your creativity.
          </h1>
          <p className="lg:col-span-4 text-[15px] leading-[1.55] text-[#6b645c] dark:text-[#a39c93]">
            Trusted by 50M+ creators, developers, and animators at leading brands and studios.
          </p>
        </div>

        <PartnerLogos darkSurface={false} />
      </section>

      {/* Plans Container */}
      <section className="bg-[#f3f2ed] dark:bg-[#171614] rounded-t-[36px] pt-16 pb-24 px-6 md:px-14">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-[36px] font-medium tracking-[-0.025em] mb-8">Plans</h2>

          {/* 3 Product Selector Cards matching Viggle.ai */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            <button
              type="button"
              aria-pressed={product === 'viggle-ai'}
              onClick={() => setProduct('viggle-ai')}
              className={`text-left rounded-[24px] p-6 transition-all cursor-pointer border ${
                product === 'viggle-ai'
                  ? 'bg-[#fcfcfc] dark:bg-[#22201d] border-[#29231e] dark:border-[#07f34b] shadow-sm'
                  : 'bg-[#fcfcfc]/65 dark:bg-[#1d1b19] border-black/8 dark:border-white/10 hover:bg-[#fcfcfc]'
              }`}
            >
              <div className="text-[22px] font-medium mb-1">Luancer AI</div>
              <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93] mb-6">
                Swap characters into video, one at a time, many at once, or live.
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#6b645c] dark:text-[#a39c93]">
                    From
                  </span>
                  <div className="text-[22px] font-semibold tabular-nums">
                    $7.99<span className="text-[13px] font-normal text-[#6b645c]">/month</span>
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-emerald-700 dark:text-[#07f34b]">
                  {product === 'viggle-ai' ? 'Active' : 'See plans'}
                </span>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={product === 'pinoc'}
              onClick={() => setProduct('pinoc')}
              className={`text-left rounded-[24px] p-6 transition-all cursor-pointer border ${
                product === 'pinoc'
                  ? 'bg-[#fcfcfc] dark:bg-[#22201d] border-[#29231e] dark:border-[#07f34b] shadow-sm'
                  : 'bg-[#fcfcfc]/65 dark:bg-[#1d1b19] border-black/8 dark:border-white/10 hover:bg-[#fcfcfc]'
              }`}
            >
              <div className="text-[22px] font-medium mb-1">PINOC</div>
              <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93] mb-6">
                Rigged 3D characters from photos, and motion you export as FBX or GLB.
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#6b645c] dark:text-[#a39c93]">
                    From
                  </span>
                  <div className="text-[22px] font-semibold tabular-nums">
                    $10.39<span className="text-[13px] font-normal text-[#6b645c]">/month</span>
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-emerald-700 dark:text-[#07f34b]">
                  {product === 'pinoc' ? 'Active' : 'See plans'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/developers')}
              className="text-left rounded-[24px] p-6 bg-[#fcfcfc]/65 dark:bg-[#1d1b19] border border-black/8 dark:border-white/10 hover:bg-[#fcfcfc] transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[22px] font-medium">API</span>
                <ArrowUpRight className="w-5 h-5 opacity-70" />
              </div>
              <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93] mb-6">
                Pay as you go. New accounts get 100 free credits.
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#6b645c] dark:text-[#a39c93]">
                    Per credit
                  </span>
                  <div className="text-[22px] font-semibold tabular-nums">$0.01</div>
                </div>
                <span className="text-[13px] font-semibold">API pricing</span>
              </div>
            </button>
          </div>

          {/* Billing Period Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-[26px] font-medium tracking-[-0.02em]">
                {product === 'viggle-ai' ? 'Luancer AI plans' : 'PINOC plans'}
              </h3>
              <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93]">
                {product === 'viggle-ai' ? 'Billed separately from PINOC.' : 'Billed separately from Luancer AI.'}
              </p>
            </div>

            <div
              role="group"
              aria-label="Billing period"
              className="inline-flex items-center gap-1 p-1.5 rounded-full bg-[#fcfcfc] dark:bg-[#22201d] border border-black/8 dark:border-white/10"
            >
              <button
                type="button"
                aria-pressed={billing === 'monthly'}
                onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                  billing === 'monthly'
                    ? 'bg-[#29231e] text-white dark:bg-[#07f34b] dark:text-[#111310]'
                    : 'text-[#6b645c] dark:text-[#a39c93]'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                aria-pressed={billing === 'yearly'}
                onClick={() => setBilling('yearly')}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                  billing === 'yearly'
                    ? 'bg-[#29231e] text-white dark:bg-[#07f34b] dark:text-[#111310]'
                    : 'text-[#6b645c] dark:text-[#a39c93]'
                }`}
              >
                <span>Yearly</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#07f34b] text-[#111310] text-[11px] font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {selectedPlanNotice && (
            <div
              role="status"
              className="mb-6 p-4 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-between gap-4"
            >
              <span className="text-[14px] font-medium">{selectedPlanNotice}</span>
              <button
                type="button"
                onClick={() => onNavigate('/studio/mix')}
                className="px-4 py-1.5 rounded-full bg-[#07f34b] text-[#111310] text-[13px] font-semibold whitespace-nowrap cursor-pointer"
              >
                Open Studio
              </button>
            </div>
          )}

          {/* Plan Cards Grid */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              plans.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
            } gap-5`}
          >
            {plans.map((plan) => {
              const activePrice = getDisplayPrice(plan, billing);
              const showStrike = billing === 'yearly' && plan.monthlyPrice > 0;
              return (
                <div
                  key={plan.id}
                  className="rounded-[24px] bg-[#fcfcfc] dark:bg-[#211f1c] p-6 border border-black/8 dark:border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="text-[22px] font-medium">{plan.name}</h3>
                      {plan.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#07f34b]/20 text-emerald-800 dark:text-[#07f34b] text-[12px] font-semibold">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mb-2 tabular-nums">
                      {showStrike && (
                        <span className="text-[16px] line-through text-[#6b645c] dark:text-[#a39c93]">
                          {formatUsd(plan.monthlyPrice)}
                        </span>
                      )}
                      <span className="text-[36px] font-semibold tracking-tight">
                        {formatUsd(activePrice)}
                      </span>
                      <span className="text-[13px] text-[#6b645c] dark:text-[#a39c93]">/month</span>
                    </div>

                    <p className="text-[13px] text-[#6b645c] dark:text-[#a39c93] mb-5">
                      {plan.tagline}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        if (plan.monthlyPrice === 0) {
                          onNavigate('/studio/mix');
                        } else {
                          setSelectedPlanNotice(
                            `${plan.name} (${billing}) selected at ${formatUsd(activePrice)}/mo. Ready in Luancer Studio.`
                          );
                        }
                      }}
                      className={`w-full py-3 rounded-full text-[14px] font-semibold transition-colors cursor-pointer mb-6 ${
                        plan.badge === 'Popular'
                          ? 'bg-[#07f34b] hover:bg-[#00d83d] text-[#111310]'
                          : 'bg-[#f3f2ed] dark:bg-white/10 hover:bg-[#e5e3dc] dark:hover:bg-white/20'
                      }`}
                    >
                      {plan.ctaLabel}
                    </button>

                    <ul className="space-y-2.5 text-[13px]">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-[#07f34b] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Models Strip */}
          <div className="mt-10 p-5 rounded-2xl bg-[#fcfcfc] dark:bg-[#211f1c] border border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-[13px]">
              <span className="font-semibold text-[#6b645c] dark:text-[#a39c93]">Models</span>
              {['Seedance 2.0 / Fast', 'Seedance 2.5', 'Veo 3.1', 'Wan', 'Happy Horse', 'ChatGPT Images', 'Nano Banana'].map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onNavigate('/jst2')}
                    className="font-medium hover:underline cursor-pointer"
                  >
                    {m}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/research')}
              className="text-[13px] font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              All models <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-14 py-20">
        <h2 className="text-[32px] font-medium tracking-[-0.025em] mb-8">
          Compare Luancer AI plans
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-black/8 dark:border-white/10">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-[#f3f2ed] dark:bg-[#171614] text-[13px] font-semibold">
                <th className="py-4 px-5">Feature</th>
                <th className="py-4 px-5">Free</th>
                <th className="py-4 px-5">Pro</th>
                <th className="py-4 px-5">Live</th>
                <th className="py-4 px-5">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6 dark:divide-white/8 text-[14px] tabular-nums">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="hover:bg-[#f3f2ed]/45 dark:hover:bg-white/5">
                  <th scope="row" className="py-3.5 px-5 font-medium">
                    {row.feature}
                  </th>
                  <td className="py-3.5 px-5 text-[#6b645c] dark:text-[#a39c93]">{row.free}</td>
                  <td className="py-3.5 px-5">{row.pro}</td>
                  <td className="py-3.5 px-5">{row.live}</td>
                  <td className="py-3.5 px-5 font-medium">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-[920px] mx-auto px-6 md:px-14 pb-24">
        <h2 className="text-[32px] font-medium tracking-[-0.025em] mb-8">FAQs</h2>
        <div className="divide-y divide-black/8 dark:divide-white/10 border-y border-black/8 dark:border-white/10">
          {PRICING_FAQS.map((item, idx) => {
            const open = openFaq === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : idx)}
                  className="w-full py-5 flex items-center justify-between gap-4 text-left font-medium text-[17px] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <p className="pb-5 text-[15px] leading-[1.6] text-[#6b645c] dark:text-[#a39c93]">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Aurora */}
      <section className="viggle-aurora-bottom pt-20 pb-28 px-6 text-center">
        <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-medium tracking-[-0.03em] mb-6 max-w-[680px] mx-auto">
          Turn your imagination into the next viral video.
        </h2>
        <button
          type="button"
          onClick={() => onNavigate('/studio/mix')}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#07f34b] hover:bg-[#00d83d] text-[#111310] font-semibold cursor-pointer"
        >
          <span>Start creating</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
