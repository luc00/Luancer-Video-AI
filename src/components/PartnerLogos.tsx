const PARTNERS = [
  'Google AI',
  'Unity',
  'NetEase Games',
  'ByteDance',
  'Salesforce',
  'Coke Studio',
  'Modelo',
];

export function PartnerLogos({ darkSurface = true }: { darkSurface?: boolean }) {
  const colorClass = darkSurface
    ? 'text-white/85'
    : 'text-[#29231e]/80 dark:text-[#f5f4f0]/80';

  return (
    <div className="overflow-hidden relative w-full mask-fade-x">
      <div className={`animate-viggle-marquee items-center gap-10 md:gap-14 ${colorClass}`}>
        {[...PARTNERS, ...PARTNERS].map((brand, idx) => (
          <div
            key={`${brand}-${idx}`}
            className="flex items-center gap-2 whitespace-nowrap shrink-0 text-[15px] md:text-[16px] font-bold tracking-tight opacity-90"
          >
            {brand === 'Unity' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2ZM12 5.2L6.2 8.6V15.4L12 18.8L17.8 15.4V8.6L12 5.2Z" />
              </svg>
            )}
            {brand === 'Google AI' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="6" cy="12" r="2" />
                <circle cx="12" cy="6" r="2" />
                <circle cx="12" cy="18" r="2" />
                <circle cx="18" cy="12" r="2" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            )}
            {brand === 'ByteDance' && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="3" y="5" width="3" height="14" rx="1" />
                <rect x="8.5" y="9" width="3" height="10" rx="1" />
                <rect x="14" y="3" width="3" height="16" rx="1" />
                <rect x="19.5" y="7" width="3" height="12" rx="1" />
              </svg>
            )}
            <span>{brand}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
