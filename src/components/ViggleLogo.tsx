interface ViggleLogoProps {
  className?: string;
  compact?: boolean;
  variant?: 'inline' | 'card';
}

export const SITE_LOGO_SRC = '/assets/aistudio/logo_LUANCER_d035bfad.PNG';

export function ViggleLogo({
  className = '',
  compact = false,
  variant = 'inline',
}: ViggleLogoProps) {
  if (variant === 'card') {
    return (
      <span
        className={`relative inline-flex items-center justify-center w-[216px] h-[126px] rounded-2xl bg-[#e4f1ea] overflow-hidden border border-black/8 dark:border-white/15 shadow-xs select-none ${className}`}
      >
        <img
          src={SITE_LOGO_SRC}
          alt="Luancer and Co. — Quality you can trust."
          className="w-full h-full object-cover object-[49.5%_48.6%] scale-[1.45] origin-[49.5%_48.6%]"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      <span
        className={`relative inline-block rounded-xl bg-[#e4f1ea] overflow-hidden border border-black/10 dark:border-white/15 shrink-0 shadow-xs ${
          compact ? 'w-8 h-8' : 'w-8 h-8 sm:w-9 sm:h-9'
        }`}
      >
        <img
          src={SITE_LOGO_SRC}
          alt={compact ? 'Luancer and Co.' : ''}
          aria-hidden={!compact}
          className="absolute left-1/2 top-1/2 -translate-x-[49.5%] -translate-y-[42%] w-[385%] h-auto max-w-none"
        />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-semibold tracking-[0.05em] sm:tracking-[0.06em] text-[12px] sm:text-[15px] leading-none uppercase whitespace-nowrap">
            LUANCER AND CO.
          </span>
          <span className="hidden sm:block text-[8px] font-medium tracking-[0.2em] uppercase opacity-70 mt-1 whitespace-nowrap">
            QUALITY YOU CAN TRUST.
          </span>
        </span>
      )}
    </span>
  );
}
